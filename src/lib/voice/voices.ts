import type { Locale } from "@/lib/i18n/config";

/** Gemini prebuilt voices chosen for a warm, calm delivery per language. */
export const CLOUD_VOICES = ["Kore", "Leda", "Aoede", "Sulafat", "Achird", "Charon", "Puck", "Despina", "Gacrux"] as const;
export type CloudVoice = (typeof CLOUD_VOICES)[number];

export const DEFAULT_CLOUD_VOICE: Record<Locale, CloudVoice> = {
  hi: "Kore",
  en: "Sulafat",
  mr: "Leda",
  bn: "Aoede",
  ta: "Kore",
  te: "Leda",
  kn: "Aoede",
  gu: "Sulafat",
  pa: "Achird",
};

/** settings.voiceName stores cloud voices as "cloud:<Name>" and device voices by their plain name. */
export const CLOUD_PREFIX = "cloud:";
export function cloudVoiceFrom(voiceName: string | undefined): CloudVoice | undefined {
  if (!voiceName?.startsWith(CLOUD_PREFIX)) return undefined;
  const v = voiceName.slice(CLOUD_PREFIX.length);
  return (CLOUD_VOICES as readonly string[]).includes(v) ? (v as CloudVoice) : undefined;
}
export function deviceVoiceFrom(voiceName: string | undefined) {
  return voiceName && !voiceName.startsWith(CLOUD_PREFIX) ? voiceName : undefined;
}
