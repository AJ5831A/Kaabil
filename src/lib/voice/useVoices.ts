"use client";

import { useEffect, useState } from "react";
import { localeInfo, type Locale } from "@/lib/i18n/config";
import { loadVoices } from "./browserEngine";

export interface VoiceOption {
  name: string;
  lang: string;
  natural: boolean;
  matchesLocale: boolean;
}

/** Device voices, those matching the locale first and natural/neural voices ranked higher. */
export function useVoices(locale: Locale): VoiceOption[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    let alive = true;
    loadVoices().then((v) => alive && setVoices(v));
    const s = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    const on = () => alive && setVoices(s?.getVoices() ?? []);
    s?.addEventListener?.("voiceschanged", on);
    return () => {
      alive = false;
      s?.removeEventListener?.("voiceschanged", on);
    };
  }, []);

  const tag = localeInfo(locale).speech.toLowerCase();
  return voices
    .map((v) => {
      const lang = v.lang.replace("_", "-").toLowerCase();
      return {
        name: v.name,
        lang: v.lang,
        natural: /natural|neural|google/i.test(v.name),
        matchesLocale: lang === tag || lang.startsWith(locale + "-") || (locale !== "en" && lang === "en-in"),
      };
    })
    .filter((v) => v.matchesLocale || v.lang.toLowerCase().startsWith("en"))
    .sort((a, b) => Number(b.matchesLocale) - Number(a.matchesLocale) || Number(b.natural) - Number(a.natural) || a.name.localeCompare(b.name));
}
