import "server-only";
import { z } from "zod";

/**
 * The shape Pip always returns to the client, whether it came from a model or
 * from the offline demo coach below. Everything is optional-with-default on
 * the way in: free-tier models are far less obedient about JSON shape than
 * OpenAI's strict structured outputs, so we normalize instead of trusting.
 */
export const pipResponseSchema = z.object({
  short_message: z.string().trim().min(1),
  suggested_steps: z.array(z.string().trim().min(1)).default([]),
  estimated_order: z.array(z.string().trim().min(1)).default([]),
  encouragement: z.string().trim().default(""),
  safety_notice: z.string().trim().default(""),
  // True when the reply was produced locally, with no model involved — the UI
  // says so out loud rather than passing canned text off as AI output.
  demo: z.boolean().default(false),
});

export type PipResponse = z.infer<typeof pipResponseSchema>;

export const PIP_JSON_SHAPE = `{
  "short_message": string,        // 1-2 short sentences, talk directly to the child
  "suggested_steps": string[],    // small concrete actions, each one short
  "estimated_order": string[],    // optional: the steps in the order to do them
  "encouragement": string,        // one warm closing line
  "safety_notice": string         // "" unless you had to refuse something
}`;

/**
 * Models sometimes wrap JSON in prose or a ```json fence even when asked not
 * to, and sometimes return a step list as one newline-joined string. Recover
 * what we can; throw only when there is genuinely nothing usable, so the
 * caller can fall back to the demo coach.
 */
export function parsePipResponse(raw: string): PipResponse {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  if (!text.startsWith("{")) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) text = text.slice(start, end + 1);
  }

  const parsed = JSON.parse(text) as Record<string, unknown>;
  const asList = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
    if (typeof v === "string" && v.trim()) {
      return v.split(/\r?\n/).map((s) => s.replace(/^\s*[-*\d.)\s]+/, "").trim()).filter(Boolean);
    }
    return [];
  };

  return pipResponseSchema.parse({
    short_message: String(parsed.short_message ?? parsed.message ?? "").trim() || "…",
    suggested_steps: asList(parsed.suggested_steps ?? parsed.steps),
    estimated_order: asList(parsed.estimated_order),
    encouragement: String(parsed.encouragement ?? "").trim(),
    safety_notice: String(parsed.safety_notice ?? "").trim(),
    demo: false,
  });
}

const HE = {
  opener: (name: string, title: string) => `${name}, בוא נפרק את "${title}" לצעדים קטנים.`,
  stuck: (title: string) => `זה בסדר להיתקע. נתחיל מהחלק הכי קטן של "${title}" — רק צעד אחד.`,
  time: (title: string) => `רוב הילדים מסיימים משימה כזאת ב-15 עד 30 דקות. נסה טיימר קצר ל-"${title}".`,
  steps: (title: string) => [
    `תכין את מה שצריך בשביל "${title}" — כלים, מחברת, מה שרלוונטי.`,
    "עשה את החלק הראשון בלבד, בלי לחשוב על כל השאר.",
    "עצור, תבדוק מה יצא, ותסמן לעצמך מה נשאר.",
    "סיים את השאר ותסמן את המשימה כבוצעה באפליקציה.",
  ],
  encouragement: "אתה יותר קרוב ממה שנדמה לך — צעד אחד קדימה זה כבר התקדמות! ⭐",
  demoNotice: "Pip רץ כרגע במצב הדגמה (בלי חיבור לשירות AI), אז התשובות קבועות מראש.",
};

const EN = {
  opener: (name: string, title: string) => `${name}, let's break "${title}" into small steps.`,
  stuck: (title: string) => `Getting stuck is normal. Start with the smallest piece of "${title}" — just one step.`,
  time: (title: string) => `Most kids finish a task like this in 15-30 minutes. Try a short timer for "${title}".`,
  steps: (title: string) => [
    `Gather what you need for "${title}" — tools, notebook, whatever applies.`,
    "Do only the first part, without thinking about the rest.",
    "Stop, check how it went, and note what's left.",
    "Finish the rest, then mark the task done in the app.",
  ],
  encouragement: "You're closer than it feels — one step forward already counts! ⭐",
  demoNotice: "Pip is running in demo mode (no AI service connected), so these replies are pre-written.",
};

/**
 * Offline coaching used when no AI provider is configured or the provider
 * call fails. It is deliberately generic-but-actionable, and always flags
 * itself as demo output so nobody mistakes it for a model's answer.
 */
export function demoCoachReply(opts: {
  childName: string;
  taskTitle: string;
  message: string;
  language: string;
  premium: boolean;
}): PipResponse {
  const L = opts.language === "he" ? HE : EN;
  const msg = opts.message.toLowerCase();
  const stuck = /stuck|hard|can'?t|difficult|תקוע|קשה|לא מצליח|לא יודע/.test(msg);
  const timing = /how long|time|minutes|כמה זמן|דקות/.test(msg);

  const short = timing ? L.time(opts.taskTitle) : stuck ? L.stuck(opts.taskTitle) : L.opener(opts.childName, opts.taskTitle);
  const allSteps = L.steps(opts.taskTitle);

  return pipResponseSchema.parse({
    short_message: short,
    // Free plan caps the plan at 3 steps, same rule the model prompt uses.
    suggested_steps: opts.premium ? allSteps : allSteps.slice(0, 3),
    estimated_order: [],
    encouragement: L.encouragement,
    safety_notice: L.demoNotice,
    demo: true,
  });
}
