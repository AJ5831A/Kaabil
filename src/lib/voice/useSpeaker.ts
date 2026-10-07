"use client";

import { useCallback, useSyncExternalStore } from "react";
import { speaker, type SpeakerState } from "./speaker";
import { useApp } from "@/lib/store/app";
import { plain } from "@/components/ui/Rich";

const idle: SpeakerState = { speaking: false, level: 0 };

export function useSpeaker() {
  const state = useSyncExternalStore(
    (cb) => speaker.subscribe(cb),
    () => speaker.getState(),
    () => idle,
  );
  const locale = useApp((s) => s.locale);
  const { voiceRate, slowMode, voiceName } = useApp((s) => s.settings);

  const speak = useCallback(
    (text: string, id?: string) =>
      speaker.speak(plain(text), { locale, id, rate: slowMode ? Math.min(voiceRate, 0.8) : voiceRate, voiceName }),
    [locale, voiceRate, slowMode, voiceName],
  );
  const stop = useCallback(() => speaker.stop(), []);
  return { ...state, speak, stop };
}
