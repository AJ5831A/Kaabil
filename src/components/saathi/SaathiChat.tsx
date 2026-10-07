"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { useSaathiChat, useSaathiSession } from "@/lib/saathi/client";
import { useSaathiBus } from "@/lib/saathi/bus";
import { useRecognition } from "@/lib/voice/useRecognition";
import { useSpeaker } from "@/lib/voice/useSpeaker";
import { Icon } from "@/components/ui/Icon";
import { Rich, plain } from "@/components/ui/Rich";
import { ListenButton } from "@/components/ui/ListenButton";
import { cn } from "@/components/ui/cn";
import { toast } from "@/components/ui/Toast";
import { SaathiOrb, type OrbState } from "./SaathiOrb";
import { Blocks } from "./Blocks";

export type ChatVariant = "panel" | "sheet" | "page";

function Greeting({ variant, onSpeak, onType }: { variant: ChatVariant; onSpeak: () => void; onType: () => void }) {
  const { t } = useT();
  const name = useApp((s) => s.profile.name);
  const { speak } = useSpeaker();
  const title = name ? t("saathi.greeting.titleName", { name }) : t("saathi.greeting.title");
  const body = t("saathi.greeting.body");
  const big = variant === "page";
  const actions = [
    { key: "speak", icon: "Mic", onClick: onSpeak, primary: true },
    { key: "type", icon: "Keyboard", onClick: onType },
    { key: "listen", icon: "Volume2", onClick: () => speak(`${plain(title)}. ${body}`, "greeting") },
  ] as const;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className={cn("flex flex-col", big ? "items-center py-6 text-center" : "py-2")}>
      <h2 className={cn("font-display leading-[1.08]", big ? "text-5xl sm:text-6xl" : "text-[2rem]")}>
        <Rich text={title} />
      </h2>
      <p className={cn("mt-3 leading-relaxed text-muted", big ? "max-w-xl text-lg" : "text-[0.95rem]")}>{body}</p>
      <div className={cn("mt-6 grid w-full grid-cols-3 gap-2.5", big && "max-w-lg")}>
        {actions.map((a, i) => (
          <motion.button
            key={a.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            whileTap={{ scale: 0.96 }}
            onClick={a.onClick}
            className={cn(
              "flex flex-col items-center justify-center gap-2.5 rounded-[1.25rem] text-sm transition-colors", big ? "aspect-square" : "aspect-[6/5]",
              "primary" in a && a.primary ? "bg-gold text-gold-ink shadow-[0_14px_36px_-16px_var(--gold)]" : "glass gold-edge text-fg hover:bg-glass-2",
            )}
          >
            <Icon name={a.icon} className={big ? "size-8" : "size-6"} />
            {t(`saathi.greeting.${a.key}`)}
          </motion.button>
        ))}
      </div>
      <div data-secondary className={cn("mt-6 w-full", big && "max-w-lg")}>
        <div className="eyebrow mb-2">{t("saathi.ui.suggestions")}</div>
        <Examples center={big} />
      </div>
    </motion.div>
  );
}

function Examples({ center }: { center?: boolean }) {
  const { tl } = useT();
  const { send } = useSaathiChat();
  return (
    <div className={cn("flex flex-wrap gap-2", center && "justify-center")}>
      {tl("saathi.ui.examples").map((ex) => (
        <button key={ex} onClick={() => send(ex)} className="rounded-full border border-line px-3.5 py-2 text-[0.82rem] text-muted transition-colors hover:border-line-strong hover:text-fg">
          “{ex}”
        </button>
      ))}
    </div>
  );
}

function Typing() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="size-1.5 rounded-full bg-gold" animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </span>
  );
}

export function SaathiChat({ variant, active = true, onClose, autoFocus }: { variant: ChatVariant; active?: boolean; onClose?: () => void; autoFocus?: boolean }) {
  const { t } = useT();
  const { chat, busy, send, reset } = useSaathiChat();
  const streamingId = useSaathiSession((s) => s.streamingId);
  const engine = useSaathiSession((s) => s.engine);
  const spokenAt = useSaathiSession((s) => s.spokenAt);
  const handsFree = useApp((s) => s.settings.handsFree);
  const speakerState = useSpeaker();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const voiceTurn = useRef(false);

  const rec = useRecognition({
    onFinal: (text) => {
      voiceTurn.current = true;
      setInput("");
      send(text, { voice: true });
    },
    onInterim: (text) => setInput(text),
  });

  const startMic = useCallback(() => {
    if (!rec.supported) {
      toast.warn(t("saathi.ui.micUnsupported"));
      inputRef.current?.focus();
      return;
    }
    speakerState.stop(); // barge-in
    rec.start();
  }, [rec, speakerState, t]);

  // Hands-free: listen again after Saathi finishes speaking a voice turn.
  useEffect(() => {
    if (!active || !handsFree || !spokenAt) return;
    const tm = setTimeout(() => rec.start(), 350);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenAt]);

  useEffect(() => {
    if (rec.error === "not-allowed" || rec.error === "denied") toast.warn(t("common.voice.micDenied"));
  }, [rec.error, t]);

  // Pending "Ask Saathi" requests from elsewhere in the app.
  const pending = useSaathiBus((s) => s.pending);
  useEffect(() => {
    if (!active || !pending) return;
    useSaathiBus.getState().clear();
    if (pending.prompt) send(pending.prompt, { context: pending.context });
    else setTimeout(() => inputRef.current?.focus(), 120);
  }, [active, pending, send]);

  useEffect(() => {
    if (autoFocus && active) setTimeout(() => inputRef.current?.focus(), 200);
  }, [autoFocus, active]);

  // Keep the newest message in view.
  const last = chat[chat.length - 1];
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.length, last?.text, last?.blocks?.length]);

  const onChip = useCallback(
    (label: string, value: string) => send(label, { chip: value || undefined, display: label, voice: voiceTurn.current }),
    [send],
  );

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (rec.listening) rec.stop();
    voiceTurn.current = false;
    const v = input;
    setInput("");
    send(v);
  };

  const orb: OrbState = rec.listening ? "listening" : busy ? "thinking" : speakerState.speaking ? "speaking" : "idle";
  const status = rec.listening ? t("saathi.ui.listening") : busy ? t("saathi.ui.thinking") : speakerState.speaking ? t("saathi.ui.speaking") : t("saathi.role");
  const page = variant === "page";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className={cn("flex items-center gap-3 px-5 pb-3", page ? "pt-2" : "pt-5")}>
        <SaathiOrb state={orb} level={rec.listening ? rec.level : speakerState.level} size={page ? 52 : 42} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl leading-none">
            KAABIL <em className="text-gold">Saathi</em>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-subtle" aria-live="polite">
            <span className={cn("size-1.5 rounded-full", rec.listening ? "bg-danger" : busy ? "bg-gold" : "bg-ok")} />
            {status}
            {engine === "fallback" && <span className="hidden opacity-70 sm:inline">· {t("saathi.ui.offlineEngine")}</span>}
          </div>
        </div>
        {chat.length > 0 && (
          <button onClick={reset} aria-label={t("saathi.ui.clear")} title={t("saathi.ui.clear")} className="grid size-10 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-fg">
            <Icon name="RotateCcw" className="size-4" />
          </button>
        )}
        {onClose && (
          <button onClick={onClose} aria-label={t("saathi.ui.close")} className="grid size-10 place-items-center rounded-full border border-line text-muted hover:text-fg">
            <Icon name="X" className="size-4" />
          </button>
        )}
      </div>
      <div className="hairline mx-5" />

      {/* Messages */}
      <div ref={listRef} className={cn("@container thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5", page && "mx-auto w-full max-w-3xl")} aria-live="polite">
        {chat.length === 0 ? (
          <Greeting variant={variant} onSpeak={startMic} onType={() => inputRef.current?.focus()} />
        ) : (
          <ol className="space-y-5">
            <AnimatePresence initial={false}>
              {chat.map((m, idx) => {
                const isLast = idx === chat.length - 1;
                const streaming = m.id === streamingId;
                return (
                  <motion.li key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                    {m.role === "user" ? (
                      <div className="max-w-[85%] rounded-[1.25rem] rounded-br-md border border-gold/25 bg-gold/10 px-4 py-2.5 text-[0.95rem] leading-relaxed">{m.text}</div>
                    ) : (
                      <div className="w-full">
                        <div className="flex items-start gap-2">
                          <div className={cn("min-w-0 flex-1 whitespace-pre-line leading-relaxed text-fg", page ? "text-lg" : "text-[0.95rem]")}>
                            {m.text ? m.text : streaming ? <Typing /> : null}
                            {streaming && m.text && <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-gold" />}
                          </div>
                          {!streaming && m.text && <ListenButton text={m.text} />}
                        </div>
                        <Blocks blocks={m.blocks ?? []} onChip={onChip} interactive={isLast && !busy} />
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        )}
      </div>

      {/* Composer */}
      <div className={cn("px-4 pb-4 pt-2", page && "mx-auto w-full max-w-3xl")}>
        <AnimatePresence>
          {rec.listening && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-2 flex items-center gap-2 px-2 text-xs text-gold">
              <span className="flex h-3 items-end gap-0.5" aria-hidden>
                {[0.4, 0.8, 1, 0.6, 0.3].map((h, i) => (
                  <motion.span key={i} className="w-0.5 rounded-full bg-gold" animate={{ height: `${Math.max(20, h * (rec.level * 100 + 30))}%` }} />
                ))}
              </span>
              {t("saathi.ui.listening")}
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={submit} className="glass-strong flex items-center gap-2 rounded-[1.4rem] p-1.5 pl-4 transition-shadow focus-within:shadow-[0_0_0_1px_var(--line-strong)]">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={rec.listening ? t("saathi.ui.listening") : t("saathi.ui.placeholder")}
            aria-label={t("saathi.ui.placeholder")}
            maxLength={500}
            className="h-11 min-w-0 flex-1 bg-transparent text-[0.95rem] text-fg outline-none placeholder:text-subtle focus-visible:outline-none"
          />
          {input.trim() && !rec.listening ? (
            <button type="submit" disabled={busy} aria-label={t("saathi.ui.send")} className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-gold transition-colors hover:border-line-strong disabled:opacity-40">
              <Icon name="Send" className="size-4.5" />
            </button>
          ) : null}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => (rec.listening ? rec.stop() : startMic())}
            aria-label={rec.listening ? t("saathi.ui.micStop") : t("saathi.ui.mic")}
            aria-pressed={rec.listening}
            className={cn(
              "relative grid shrink-0 place-items-center rounded-full transition-colors",
              page ? "size-14" : "size-11",
              rec.listening ? "bg-danger text-white" : "bg-gold text-gold-ink",
            )}
          >
            {rec.listening && <span className="absolute inset-0 animate-ping rounded-full bg-danger/40" />}
            <Icon name={rec.listening ? "Pause" : "Mic"} className={cn("relative", page ? "size-6" : "size-5")} />
          </motion.button>
        </form>
        <p data-secondary className="mt-2 px-2 text-center text-[0.68rem] leading-snug text-subtle">
          {t("saathi.ui.trust")}
        </p>
      </div>
    </div>
  );
}
