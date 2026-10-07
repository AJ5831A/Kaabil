import "server-only";
import { GoogleGenAI } from "@google/genai";

/** Server-only Gemini client. The key never leaves the server. */
let client: GoogleGenAI | null = null;

export function gemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export const MODELS = {
  chat: process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash",
  tts: process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-lite-tts",
  stt: process.env.GEMINI_STT_MODEL || process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash",
  translate: process.env.GEMINI_TRANSLATE_MODEL || process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash",
};

export const hasGemini = () => !!process.env.GEMINI_API_KEY;
