"use client";

import { useApp } from "@/lib/store/app";

let ctx: AudioContext | null = null;

function blip(freq: number, dur = 0.06, gain = 0.03) {
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {
    /* audio unavailable */
  }
}

/** Optional subtle sound + haptic cues, gated by settings. */
export function useFeedback() {
  const { sound, haptics } = useApp((s) => s.settings);
  return {
    tap() {
      if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
      if (sound) blip(660, 0.05, 0.02);
    },
    success() {
      if (haptics && typeof navigator !== "undefined") navigator.vibrate?.([10, 40, 18]);
      if (sound) {
        blip(660, 0.08);
        setTimeout(() => blip(990, 0.12), 90);
      }
    },
  };
}
