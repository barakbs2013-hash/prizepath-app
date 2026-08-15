import "server-only";
import OpenAI from "openai";

/**
 * Pip talks to any OpenAI-*compatible* chat-completions endpoint, not to
 * OpenAI specifically. That matters because the OpenAI platform requires
 * prepaid credits, while several providers expose the exact same wire format
 * on a free tier — so a demo can run without a paid account by dropping in a
 * different key.
 *
 * Resolution order is "first key that exists", free providers first, with
 * OPENAI_API_KEY last as the paid fallback. Set AI_PROVIDER to pin one
 * explicitly, or AI_BASE_URL + AI_API_KEY (+ AI_MODEL) to point at something
 * not listed here at all (Ollama, Together, a local gateway...).
 */
export type AiProviderName = "groq" | "gemini" | "openrouter" | "openai" | "custom";

type ProviderSpec = {
  name: AiProviderName;
  envKey: string;
  baseURL?: string;
  model: string;
};

// Free tiers, no credit card, in the order we prefer them for a demo.
const PROVIDERS: ProviderSpec[] = [
  {
    name: "groq",
    envKey: "GROQ_API_KEY",
    baseURL: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  {
    name: "gemini",
    envKey: "GEMINI_API_KEY",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-2.0-flash",
  },
  {
    name: "openrouter",
    envKey: "OPENROUTER_API_KEY",
    baseURL: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.3-70b-instruct:free",
  },
  {
    name: "openai",
    envKey: "OPENAI_API_KEY",
    baseURL: undefined, // SDK default
    model: "gpt-4o-mini",
  },
];

export type ResolvedProvider = {
  name: AiProviderName;
  model: string;
  client: OpenAI;
};

let cached: ResolvedProvider | null = null;
let cacheKey = "";

function pickSpec(): { spec: ProviderSpec; apiKey: string } | null {
  const custom = process.env.AI_BASE_URL;
  const customKey = process.env.AI_API_KEY;
  if (custom && customKey) {
    return {
      spec: {
        name: "custom",
        envKey: "AI_API_KEY",
        baseURL: custom,
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
      },
      apiKey: customKey,
    };
  }

  const pinned = process.env.AI_PROVIDER as AiProviderName | undefined;
  const candidates = pinned ? PROVIDERS.filter((p) => p.name === pinned) : PROVIDERS;

  for (const spec of candidates) {
    const apiKey = process.env[spec.envKey];
    // A key left at the .env.example placeholder is the same as no key —
    // treat it that way instead of firing a request that can only 401.
    if (apiKey && apiKey.trim() && !apiKey.startsWith("your-value")) {
      return { spec, apiKey: apiKey.trim() };
    }
  }
  return null;
}

/**
 * Returns the configured provider, or null when no usable key is present —
 * callers fall back to offline demo coaching rather than erroring out.
 */
export function getAiProvider(): ResolvedProvider | null {
  const picked = pickSpec();
  if (!picked) return null;

  const model = process.env.AI_MODEL?.trim() || picked.spec.model;
  const key = `${picked.spec.name}:${model}:${picked.apiKey.slice(-6)}`;
  if (cached && cacheKey === key) return cached;

  cached = {
    name: picked.spec.name,
    model,
    client: new OpenAI({ apiKey: picked.apiKey, baseURL: picked.spec.baseURL }),
  };
  cacheKey = key;
  return cached;
}
