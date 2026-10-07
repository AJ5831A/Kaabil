"use client";

import { localeInfo, type Locale } from "@/lib/i18n/config";
import type { SpeakOptions, SpeechEngine } from "./speaker";
import { splitSentences, toSpeech } from "./speechText";
import { deviceVoiceFrom } from "./voices";

let missingVoiceHandler: ((locale: Locale) => void) | null = null;
/** VoiceBoot registers a handler that tells the user (once) when their language has no device voice. */
export function setMissingVoiceHandler(fn: ((locale: Locale) => void) | null) {
  missingVoiceHandler = fn;
}

function synth() {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

/** Voices load asynchronously in Chrome; wait briefly for them. */
export function loadVoices(timeout = 1200): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      s.removeEventListener("voiceschanged", done);
      resolve(s.getVoices());
    };
    s.addEventListener("voiceschanged", done);
    setTimeout(done, timeout);
  });
}

const quality = (v: SpeechSynthesisVoice) =>
  (/natural|neural/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (/microsoft/i.test(v.name) ? 1 : 0) + (v.localService ? 0 : 0.5);

/** Best voice for a locale: exact xx-IN (prefer Natural/Neural/Google), then language prefix. */
export function pickVoice(voices: SpeechSynthesisVoice[], locale: Locale, preferred?: string) {
  const byName = preferred ? voices.find((v) => v.name === preferred) : undefined;
  if (byName) return { voice: byName, matched: true };
  const tag = localeInfo(locale).speech.toLowerCase();
  const norm = (l: string) => l.replace("_", "-").toLowerCase();
  const exact = voices.filter((v) => norm(v.lang) === tag).sort((a, b) => quality(b) - quality(a));
  if (exact[0]) return { voice: exact[0], matched: true };
  const prefix = voices.filter((v) => norm(v.lang).startsWith(locale + "-") || norm(v.lang) === locale).sort((a, b) => quality(b) - quality(a));
  if (prefix[0]) return { voice: prefix[0], matched: true };
  const enIn = voices.filter((v) => norm(v.lang) === "en-in").sort((a, b) => quality(b) - quality(a));
  return { voice: enIn[0], matched: false };
}

let stopped = 0;

/** Browser speechSynthesis engine: sentence-chunked (avoids Chrome's ~15s cut-off) with a synthetic level for lip-sync. */
export const browserEngine: SpeechEngine = {
  async speak(text: string, opts: SpeakOptions, onLevel) {
    const s = synth();
    if (!s) return;
    const my = ++stopped;
    s.cancel();
    const voices = await loadVoices();
    if (my !== stopped) return;
    const { voice, matched } = pickVoice(voices, opts.locale, deviceVoiceFrom(opts.voiceName));
    if (!matched) missingVoiceHandler?.(opts.locale);
    const chunks = splitSentences(toSpeech(text, opts.locale));

    // Gentle oscillating level while audio plays; boundary events add a kick.
    let kick = 0;
    const t0 = performance.now();
    const timer = setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      kick *= 0.7;
      onLevel(Math.min(1, 0.25 + 0.3 * Math.abs(Math.sin(t * 9)) + 0.2 * Math.random() + kick));
    }, 90);

    try {
      for (const chunk of chunks) {
        if (my !== stopped) break;
        await new Promise<void>((resolve) => {
          const u = new SpeechSynthesisUtterance(chunk);
          u.lang = voice?.lang ?? localeInfo(opts.locale).speech;
          if (voice) u.voice = voice;
          u.rate = Math.max(0.5, Math.min(1.6, opts.rate ?? 1));
          u.pitch = 1;
          u.onboundary = () => (kick = 0.5);
          u.onend = () => resolve();
          u.onerror = () => resolve();
          s.speak(u);
        });
      }
    } finally {
      clearInterval(timer);
      onLevel(0);
    }
  },
  stop() {
    stopped++;
    synth()?.cancel();
  },
};
