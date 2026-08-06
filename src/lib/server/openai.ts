import "server-only";
import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("AI assistant is not configured");
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const AI_MODEL = "gpt-4o-mini";
