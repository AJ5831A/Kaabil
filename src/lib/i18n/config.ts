/**
 * Locale registry. To add a language:
 *   1. Add an entry here.
 *   2. Add src/messages/<code>/ with the same namespace files as src/messages/en/.
 *   3. Register the folder in src/messages/index.ts.
 * Missing keys always fall back to English.
 */
export const LOCALES = [
  { code: "hi", label: "हिन्दी", english: "Hindi", speech: "hi-IN", script: "deva" },
  { code: "en", label: "English", english: "English", speech: "en-IN", script: "latn" },
  { code: "mr", label: "मराठी", english: "Marathi", speech: "mr-IN", script: "deva" },
  { code: "bn", label: "বাংলা", english: "Bengali", speech: "bn-IN", script: "beng" },
  { code: "ta", label: "தமிழ்", english: "Tamil", speech: "ta-IN", script: "taml" },
  { code: "te", label: "తెలుగు", english: "Telugu", speech: "te-IN", script: "telu" },
  { code: "kn", label: "ಕನ್ನಡ", english: "Kannada", speech: "kn-IN", script: "knda" },
  { code: "gu", label: "ગુજરાતી", english: "Gujarati", speech: "gu-IN", script: "gujr" },
  { code: "pa", label: "ਪੰਜਾਬੀ", english: "Punjabi", speech: "pa-IN", script: "guru" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "hi";
export const LOCALE_CODES = LOCALES.map((l) => l.code) as Locale[];
export const LOCALE_COOKIE = "kaabil_locale";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALE_CODES as string[]).includes(v);
}

export function localeInfo(code: Locale) {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

/** Localised string map used by content and DB records. `en` is always present. */
export type L10n = { en: string } & Partial<Record<Locale, string>>;

export function pick(text: L10n | string | undefined, locale: Locale): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[locale] ?? text.en;
}
