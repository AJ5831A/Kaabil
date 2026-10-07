"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { localeInfo } from "@/lib/i18n/config";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { speaker } from "./speaker";
import { cloudSttAvailable } from "./caps";

/**
 * Speech input.
 *   useRecognition({ onFinal, onInterim? }) → { supported, listening, interim, level, error?, busy, start, stop }
 * Primary: browser SpeechRecognition with the locale's xx-IN tag, auto-finalised after ~1.2s of silence.
 * Fallback (iOS/Firefox): MediaRecorder + energy-based silence detection → /api/transcribe (Gemini).
 * start() interrupts Saathi if it is speaking (barge-in). stop() sends what was heard (push-to-talk release).
 */

const SILENCE_MS = 1200;
const MAX_LISTEN_MS = 30_000;
const NO_SPEECH_MS = 7000;

// Minimal typings for the Web Speech API (not in lib.dom for all TS versions).
interface SRAlternative { transcript: string }
interface SRResult { isFinal: boolean; 0: SRAlternative; length: number }
interface SREvent { resultIndex: number; results: ArrayLike<SRResult> }
interface SRErrorEvent { error: string }
interface SR {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRCtor = new () => SR;

function getSR(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const isMobile = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** RMS level meter over a mic stream. */
function meter(stream: MediaStream) {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser();
  an.fftSize = 1024;
  src.connect(an);
  const buf = new Uint8Array(an.fftSize);
  return {
    read() {
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (const b of buf) sum += ((b - 128) / 128) ** 2;
      return Math.sqrt(sum / buf.length);
    },
    close() {
      src.disconnect();
      void ctx.close().catch(() => {});
    },
  };
}

function pickMime() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m));
}

interface Session {
  rec?: SR;
  recorder?: MediaRecorder;
  stream?: MediaStream;
  meter?: ReturnType<typeof meter>;
  timers: ReturnType<typeof setTimeout>[];
  raf?: number;
  text: string;
  sent: boolean;
  cancelled: boolean;
}

const noopSubscribe = () => () => {};

export interface RecognitionApi {
  supported: boolean;
  listening: boolean;
  /** True while fallback audio is being transcribed on the server. */
  busy: boolean;
  interim: string;
  level: number;
  error?: string;
  start(): void;
  stop(): void;
}

export function useRecognition(opts: { onFinal(text: string): void; onInterim?(text: string): void }): RecognitionApi {
  const locale = useApp((s) => s.locale);
  const { t } = useT();
  const cb = useRef(opts);
  useEffect(() => {
    cb.current = opts;
  });

  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string>();
  const [sttFallback, setSttFallback] = useState(false);
  const hasSR = useSyncExternalStore(noopSubscribe, () => !!getSR(), () => false);

  useEffect(() => {
    if (!getSR() && typeof MediaRecorder !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") {
      cloudSttAvailable().then(setSttFallback);
    }
  }, []);

  // Live session resources.
  const session = useRef<Session | null>(null);

  const cleanup = useCallback(() => {
    const s = session.current;
    if (!s) return;
    s.timers.forEach(clearTimeout);
    if (s.raf) cancelAnimationFrame(s.raf);
    s.meter?.close();
    s.stream?.getTracks().forEach((tr) => tr.stop());
    setLevel(0);
  }, []);

  const deliver = useCallback((text: string) => {
    const s = session.current;
    if (!s || s.sent || s.cancelled) return;
    s.sent = true;
    const clean = text.trim();
    if (clean) cb.current.onFinal(clean);
  }, []);

  const friendly = useCallback(
    (code: string) =>
      code === "not-allowed" || code === "service-not-allowed" || code === "NotAllowedError" || code === "SecurityError"
        ? t("common.voice.micDenied")
        : code === "no-speech"
          ? t("settings.voiceExtra.noSpeech")
          : code === "unsupported"
            ? t("settings.voiceExtra.notSupported")
            : code === "transcribe"
              ? t("settings.voiceExtra.transcribeFailed")
              : t("settings.voiceExtra.micError"),
    [t],
  );

  const startLevelLoop = useCallback((onSample?: (rms: number) => void) => {
    const s = session.current;
    if (!s?.meter) return;
    const loop = () => {
      const rms = s.meter!.read();
      setLevel(Math.min(1, rms * 5));
      onSample?.(rms);
      s.raf = requestAnimationFrame(loop);
    };
    s.raf = requestAnimationFrame(loop);
  }, []);

  /* ---------------- Browser SpeechRecognition ---------------- */
  const startSR = useCallback(
    (Ctor: SRCtor) => {
      const rec = new Ctor();
      rec.lang = localeInfo(locale).speech;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      const s: Session = { rec, timers: [], text: "", sent: false, cancelled: false };
      session.current = s;

      const armSilence = () => {
        s.timers.forEach(clearTimeout);
        s.timers = [setTimeout(() => rec.stop(), SILENCE_MS), setTimeout(() => rec.stop(), MAX_LISTEN_MS)];
      };

      rec.onstart = () => {
        setListening(true);
        s.timers = [setTimeout(() => rec.stop(), NO_SPEECH_MS)];
      };
      rec.onresult = (e) => {
        let finals = "";
        let partial = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finals += r[0].transcript + " ";
          else partial += r[0].transcript;
        }
        s.text = (finals + partial).replace(/\s+/g, " ").trim();
        setInterim(s.text);
        cb.current.onInterim?.(s.text);
        if (isMobile()) setLevel(0.5 + Math.random() * 0.4);
        armSilence();
      };
      rec.onerror = (e) => {
        if (e.error === "aborted") return;
        if (e.error !== "no-speech") setError(friendly(e.error));
      };
      rec.onend = () => {
        setListening(false);
        cleanup();
        deliver(s.text);
      };

      try {
        rec.start();
      } catch {
        setError(friendly("start"));
        return;
      }

      // Real mic level on desktop only: opening a second capture on mobile can starve SpeechRecognition.
      if (!isMobile() && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
          .then((stream) => {
            if (session.current !== s || s.sent) return stream.getTracks().forEach((tr) => tr.stop());
            s.stream = stream;
            try {
              s.meter = meter(stream);
              startLevelLoop();
            } catch {
              /* level stays 0 */
            }
          })
          .catch(() => {});
      }
    },
    [locale, cleanup, deliver, friendly, startLevelLoop],
  );

  /* ---------------- MediaRecorder → /api/transcribe ---------------- */
  const startRecorder = useCallback(async () => {
    const s: Session = { timers: [], text: "", sent: false, cancelled: false };
    session.current = s;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      setError(friendly((e as DOMException).name || "mic"));
      return;
    }
    if (s.cancelled) return stream.getTracks().forEach((tr) => tr.stop());
    s.stream = stream;
    const mime = pickMime();
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
    s.recorder = recorder;
    const parts: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && parts.push(e.data);
    recorder.onstop = async () => {
      setListening(false);
      cleanup();
      if (s.cancelled) return;
      const blob = new Blob(parts, { type: (recorder.mimeType || mime || "audio/webm").split(";")[0] });
      if (blob.size < 1500) return setError(friendly("no-speech"));
      if (blob.size > 2 * 1024 * 1024) return setError(friendly("transcribe"));
      setBusy(true);
      setInterim("…");
      try {
        const r = await fetch(`/api/transcribe?locale=${locale}`, { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
        const j = (await r.json()) as { text?: string };
        if (!r.ok) throw new Error(String(r.status));
        setInterim(j.text ?? "");
        if (j.text) deliver(j.text);
        else setError(friendly("no-speech"));
      } catch {
        setInterim("");
        setError(friendly("transcribe"));
      } finally {
        setBusy(false);
      }
    };

    // Energy-based end-of-speech detection.
    let heard = false;
    let quietSince = performance.now();
    const startedAt = performance.now();
    try {
      s.meter = meter(stream);
    } catch {
      /* no meter: rely on max duration */
    }
    startLevelLoop((rms) => {
      const now = performance.now();
      if (rms > 0.035) {
        heard = true;
        quietSince = now;
      }
      const silentFor = now - quietSince;
      if (recorder.state !== "recording") return;
      if ((heard && silentFor > SILENCE_MS) || (!heard && now - startedAt > NO_SPEECH_MS) || now - startedAt > 20_000) recorder.stop();
    });
    recorder.start(250);
    setListening(true);
  }, [locale, cleanup, deliver, friendly, startLevelLoop]);

  const start = useCallback(() => {
    speaker.stop(); // barge-in: interrupt Saathi
    if (session.current && (listening || busy)) return;
    setError(undefined);
    setInterim("");
    const Ctor = getSR();
    if (Ctor) return startSR(Ctor);
    if (sttFallback) return void startRecorder();
    setError(friendly("unsupported"));
  }, [listening, busy, sttFallback, startSR, startRecorder, friendly]);

  const stop = useCallback(() => {
    const s = session.current;
    if (!s) return;
    s.timers.forEach(clearTimeout);
    if (s.rec) s.rec.stop();
    else if (s.recorder?.state === "recording") s.recorder.stop();
  }, []);

  // Abort without sending on unmount.
  useEffect(
    () => () => {
      const s = session.current;
      if (!s) return;
      s.cancelled = true;
      s.rec?.abort();
      if (s.recorder?.state === "recording") s.recorder.stop();
      cleanup();
    },
    [cleanup],
  );

  return { supported: hasSR || sttFallback, listening, busy, interim, level, error, start, stop };
}
