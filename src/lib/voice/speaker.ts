"use client";

/**
 * Speaker contract used across the app (ListenButton, Saathi, auto-read).
 *   speaker.speak(text, { locale, id, rate }) -> Promise<void>
 *   speaker.stop()
 *   speaker.subscribe(fn) -> unsubscribe
 * Default engine: browser speechSynthesis. VoiceBoot swaps in the Gemini cloud
 * engine (/api/tts) when available. Both apply toSpeech() pre-processing.
 */
import type { Locale } from "@/lib/i18n/config";
import { browserEngine } from "./browserEngine";

export type SpeakerState = { speaking: boolean; id?: string; level: number };
type Listener = (s: SpeakerState) => void;

export interface SpeakOptions {
  locale: Locale;
  id?: string;
  rate?: number;
  voiceName?: string;
}

export interface SpeechEngine {
  speak(text: string, opts: SpeakOptions, onLevel: (level: number) => void): Promise<void>;
  stop(): void;
}

class Speaker {
  private engine: SpeechEngine = browserEngine;
  private listeners = new Set<Listener>();
  private state: SpeakerState = { speaking: false, level: 0 };
  private token = 0;
  private lastLevelAt = 0;

  setEngine(e: SpeechEngine) {
    this.engine = e;
  }
  getState() {
    return this.state;
  }
  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  private emit(s: Partial<SpeakerState>) {
    this.state = { ...this.state, ...s };
    this.listeners.forEach((l) => l(this.state));
  }
  /** Level updates are quantised and throttled (~15fps) so subscribers don't re-render every frame. */
  private emitLevel(level: number) {
    const q = Math.round(level * 10) / 10;
    const now = performance.now();
    if (q === this.state.level || (q !== 0 && now - this.lastLevelAt < 66)) return;
    this.lastLevelAt = now;
    this.emit({ level: q });
  }
  async speak(text: string, opts: SpeakOptions) {
    const my = ++this.token;
    this.engine.stop();
    this.emit({ speaking: true, id: opts.id, level: 0 });
    try {
      await this.engine.speak(text, opts, (level) => my === this.token && this.emitLevel(level));
    } finally {
      if (my === this.token) this.emit({ speaking: false, id: undefined, level: 0 });
    }
  }
  stop() {
    this.token++;
    this.engine.stop();
    this.emit({ speaking: false, id: undefined, level: 0 });
  }
}

export const speaker = new Speaker();
