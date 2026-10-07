"use client";

import type { SpeakOptions, SpeechEngine } from "./speaker";
import { browserEngine } from "./browserEngine";
import { splitSentences, toSpeech } from "./speechText";
import { cloudVoiceFrom } from "./voices";

/**
 * Gemini TTS via /api/tts. Sentence-chunked with one-ahead prefetch, client LRU cache,
 * AnalyserNode-driven level for the orb, and a seamless fallback to the browser engine.
 */
const MAX_CACHE = 60;
const cache = new Map<string, Promise<Blob>>();

function fetchAudio(text: string, opts: SpeakOptions, signal: AbortSignal): Promise<Blob> {
  const voice = cloudVoiceFrom(opts.voiceName);
  const slow = (opts.rate ?? 1) <= 0.8;
  const key = `${opts.locale}|${voice ?? ""}|${slow ? 1 : 0}|${text}`;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const p = fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, locale: opts.locale, voice, slow }),
    signal,
  }).then(async (r) => {
    if (!r.ok || !(r.headers.get("content-type") || "").startsWith("audio/")) throw new Error(`tts ${r.status}`);
    return r.blob();
  });
  cache.set(key, p);
  p.catch(() => cache.delete(key));
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value!);
  return p;
}

let audioCtx: AudioContext | null = null;
let current: { abort: AbortController } | null = null;
let failures = 0;
let disabledUntil = 0;

function playBlob(blob: Blob, rate: number, onLevel: (l: number) => void, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playbackRate = Math.max(0.6, Math.min(1.5, rate));
    audio.preservesPitch = true;
    let raf = 0;
    let analyser: AnalyserNode | null = null;
    try {
      audioCtx ??= new AudioContext();
      if (audioCtx.state === "suspended") void audioCtx.resume();
      const src = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch {
      analyser = null; // element still plays directly
    }
    const buf = analyser ? new Uint8Array(analyser.fftSize) : null;
    const tick = () => {
      if (analyser && buf) {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const b of buf) sum += ((b - 128) / 128) ** 2;
        onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4.5));
      } else onLevel(0.4 + 0.3 * Math.random());
      raf = requestAnimationFrame(tick);
    };
    const finish = (err?: unknown) => {
      cancelAnimationFrame(raf);
      onLevel(0);
      URL.revokeObjectURL(url);
      signal.removeEventListener("abort", onAbort);
      if (err) reject(err);
      else resolve();
    };
    const onAbort = () => {
      audio.pause();
      finish();
    };
    signal.addEventListener("abort", onAbort);
    audio.onended = () => finish();
    audio.onerror = () => finish(new Error("audio error"));
    audio.play().then(() => (raf = requestAnimationFrame(tick)), finish);
  });
}

export const cloudEngine: SpeechEngine = {
  async speak(text, opts, onLevel) {
    // Back off after repeated failures (offline, quota) and use the device voice.
    if (Date.now() < disabledUntil) return browserEngine.speak(text, opts, onLevel);
    const abort = new AbortController();
    current = { abort };
    const chunks = splitSentences(toSpeech(text, opts.locale), 280);
    let i = 0;
    try {
      let next = chunks[0] ? fetchAudio(chunks[0], opts, abort.signal) : null;
      for (; i < chunks.length; i++) {
        if (abort.signal.aborted) return;
        const blob = await next!;
        next = chunks[i + 1] ? fetchAudio(chunks[i + 1], opts, abort.signal) : null;
        next?.catch(() => {});
        await playBlob(blob, opts.rate ?? 1, onLevel, abort.signal);
      }
      failures = 0;
    } catch {
      if (abort.signal.aborted) return;
      if (++failures >= 2) disabledUntil = Date.now() + 5 * 60_000;
      // Continue the rest of the message on the device voice.
      const rest = chunks.slice(i).join(" ");
      if (rest) await browserEngine.speak(rest, opts, onLevel);
    } finally {
      if (current?.abort === abort) current = null;
    }
  },
  stop() {
    current?.abort.abort();
    current = null;
    browserEngine.stop();
  },
};
