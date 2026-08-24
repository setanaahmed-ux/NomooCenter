import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";

// Single shared entry point for Google Gemini. Every AI-powered feature in
// the backend (lesson-script generation, the community/tutor assistant, and
// anything added later) should call this instead of instantiating its own
// client, so the Google Cloud project/API key is configured in one place.

let client: GoogleGenerativeAI | undefined;

function getClient(): GoogleGenerativeAI {
  if (!env.geminiConfigured) {
    throw new Error("Gemini is not configured (missing GEMINI_API_KEY)");
  }
  if (!client) {
    client = new GoogleGenerativeAI(env.geminiApiKey!);
  }
  return client;
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: env.geminiModel,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
