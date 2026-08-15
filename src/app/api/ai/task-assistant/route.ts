import { NextResponse } from "next/server";
import { ForbiddenError, requireChild } from "@/lib/server/currentProfile";
import { getFamilyForChild } from "@/lib/server/family";
import { isFamilyPremium } from "@/lib/server/subscription";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/server/serviceClient";
import { getAiProvider } from "@/lib/server/aiProvider";
import { demoCoachReply, parsePipResponse, PIP_JSON_SHAPE } from "@/lib/server/pip";
import { aiTaskAssistantSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

const RATE_LIMIT_PER_HOUR = 20;

const PREMIUM_ONLY = "Pip, the AI helper, is part of PrizePath Premium.";

/**
 * Pip is a paid feature: a child may only use it while their family is on
 * the premium plan. Checked on every AI request, not just at render time, so
 * an open chat tab stops working the moment the plan lapses.
 */
async function requirePremiumChild() {
  const child = await requireChild();
  const familyId = await getFamilyForChild(child.id);
  if (!(await isFamilyPremium(familyId))) {
    throw new ForbiddenError(PREMIUM_ONLY);
  }
  return child;
}

function systemPrompt(opts: { childName: string; taskTitle: string; taskDescription: string; premium: boolean; language: string }) {
  const langLine =
    opts.language === "he"
      ? "Respond in Hebrew."
      : "Respond in English.";
  return `You are Pip, a friendly, encouraging AI task coach inside a children's chore app called PrizePath.
You are talking with ${opts.childName}, a child between 9 and 17 years old, about this specific task:
Title: ${opts.taskTitle}
Description: ${opts.taskDescription || "(no extra description)"}

Rules you must always follow:
- Explain things simply and age-appropriately, in short sentences.
- Break the task into small, concrete, actionable steps.
- Ask clarifying questions if you are unsure what the child needs.
- Encourage the child to do the work themselves — NEVER do the child's homework or schoolwork for them, never write essays or solve problems for them; instead guide them to find the answer themselves.
- NEVER claim the task is already done or mark it complete yourself — only the child can do that in the app.
- If the child asks for anything unsafe, inappropriate, or unrelated to the task (e.g. personal information, harmful content, content unsuitable for children), politely refuse and redirect to the task, and set a safety_notice.
- ${opts.premium ? "You may provide a more detailed, multi-step plan with time estimates (premium plan)." : "Keep your plan brief (max 3 steps) — mention that a Premium plan unlocks more detailed AI planning."}
- ${langLine}

Reply with ONE JSON object and nothing else — no prose before or after, no code fences.
Use exactly this shape:
${PIP_JSON_SHAPE}`;
}


export async function GET(request: Request) {
  try {
    const child = await requirePremiumChild();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) throw new Error("taskId is required");

    const supabase = await createClient();
    const { data: conversation } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("child_id", child.id)
      .eq("task_id", taskId)
      .eq("status", "active")
      .maybeSingle();

    if (!conversation) return NextResponse.json({ messages: [] });

    const { data: messages, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error("Could not load conversation");

    return NextResponse.json({ conversationId: conversation.id, messages });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const child = await requirePremiumChild();
    const body = aiTaskAssistantSchema.parse(await request.json());
    const supabase = await createClient();
    const admin = createServiceClient();

    // Server loads the task itself — never trusts client-sent task details.
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, description, assigned_child_id, family_id")
      .eq("id", body.taskId)
      .single();
    if (taskError || !task) throw new Error("Task not found");
    if (task.assigned_child_id !== child.id) throw new Error("Not your task");

    // Simple rate limit: count this child's user messages across all their
    // conversations in the last hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentConversations } = await admin
      .from("ai_conversations")
      .select("id")
      .eq("child_id", child.id);
    const conversationIds = (recentConversations ?? []).map((c) => c.id);
    let recentCount = 0;
    if (conversationIds.length > 0) {
      const { count } = await admin
        .from("ai_messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .eq("role", "user")
        .gte("created_at", oneHourAgo);
      recentCount = count ?? 0;
    }
    if (recentCount >= RATE_LIMIT_PER_HOUR) {
      return NextResponse.json(
        { error: "You have reached the hourly limit for AI messages. Please try again later." },
        { status: 429 }
      );
    }

    // Reaching here means the family is premium (requirePremiumChild), so the
    // deeper planning prompt always applies — the old free-tier prompt branch
    // is now unreachable by design.
    const premium = true;

    // Find or create the conversation for this task+child.
    let conversationId: string;
    const { data: existingConversation } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("child_id", child.id)
      .eq("task_id", body.taskId)
      .eq("status", "active")
      .maybeSingle();

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      const { data: newConversation, error: convError } = await supabase
        .from("ai_conversations")
        .insert({ child_id: child.id, task_id: body.taskId, status: "active" })
        .select("id")
        .single();
      if (convError || !newConversation) throw new Error("Could not start conversation");
      conversationId = newConversation.id;
    }

    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: body.message,
    });

    const language = body.language ?? child.preferredLanguage ?? "he";
    const demoFallback = () =>
      demoCoachReply({
        childName: child.displayName,
        taskTitle: task.title,
        message: body.message,
        language,
        premium,
      });

    let structured;
    const provider = getAiProvider();
    if (!provider) {
      // No key configured anywhere — still answer usefully, flagged as demo.
      structured = demoFallback();
    } else {
      try {
        const completion = await provider.client.chat.completions.create({
          model: provider.model,
          // json_object is the one JSON mode every OpenAI-compatible provider
          // supports; OpenAI-only strict json_schema would 400 on Groq et al.
          response_format: { type: "json_object" },
          temperature: 0.6,
          max_tokens: 700,
          messages: [
            {
              role: "system",
              content: systemPrompt({
                childName: child.displayName,
                taskTitle: task.title,
                taskDescription: task.description ?? "",
                premium,
                language,
              }),
            },
            { role: "user", content: body.message },
          ],
        });
        structured = parsePipResponse(completion.choices[0]?.message?.content ?? "");
      } catch (aiError) {
        // Never leak raw provider errors to the client — log them, and let the
        // child keep getting something actionable.
        console.error("[ai] provider call failed:", provider.name, provider.model, aiError);
        structured = demoFallback();
      }
    }

    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: JSON.stringify(structured),
    });

    return NextResponse.json({ conversationId, response: structured });
  } catch (err) {
    return handleApiError(err);
  }
}
