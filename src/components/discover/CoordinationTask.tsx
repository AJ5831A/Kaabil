"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { useT } from "@/lib/i18n/client";
import { useFeedback } from "@/lib/feedback";

const ROUNDS = 3;
const TARGET = 0.32; // gold circle size relative to the ring's start size
const DURATION = 2200; // ms for the ring to shrink from 1 → 0.12

type Verdict = "great" | "close" | "early" | "late";

export function CoordinationTask({ onResult }: { onResult: (r: { errors: number[] }) => void }) {
  const { t } = useT();
  const fb = useFeedback();
  const ringRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const scaleRef = useRef(1);
  const [running, setRunning] = useState(false);
  const [errors, setErrors] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const done = errors.length >= ROUNDS;

  const start = () => {
    setVerdict(null);
    setRunning(true);
    startRef.current = performance.now();
    const frame = (now: number) => {
      const p = ((now - startRef.current) % DURATION) / DURATION;
      const scale = 1 - p * 0.88;
      scaleRef.current = scale;
      if (ringRef.current) ringRef.current.style.transform = `scale(${scale})`;
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const tap = () => {
    if (!running) return;
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
    const diff = scaleRef.current - TARGET; // >0 early (ring still bigger), <0 late
    const err = Math.min(1, Math.abs(diff) / (1 - TARGET));
    const v: Verdict = err < 0.06 ? "great" : err < 0.15 ? "close" : diff > 0 ? "early" : "late";
    if (v === "great") fb.success();
    setVerdict(v);
    const next = [...errors, err];
    setErrors(next);
    onResult({ errors: next });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && running) {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_16rem]">
      <div
        className="glass gold-edge relative mx-auto grid aspect-square w-full max-w-sm cursor-pointer place-items-center overflow-hidden rounded-[2rem]"
        onPointerDown={tap}
        aria-hidden
      >
        <div className="absolute rounded-full border-2 border-gold bg-gold/10" style={{ width: `${TARGET * 80}%`, height: `${TARGET * 80}%` }} />
        <div ref={ringRef} className="absolute size-[80%] rounded-full border-2 border-fg/70" style={{ transform: "scale(1)" }} />
        {verdict && (
          <motion.div
            key={errors.length}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("absolute bottom-6 text-sm font-medium", verdict === "great" ? "text-ok" : verdict === "close" ? "text-gold" : "text-warn")}
          >
            {t(`discover.coordination.${verdict}`)}
          </motion.div>
        )}
      </div>
      <div className="flex flex-col items-center gap-4 lg:items-stretch">
        <div className="text-sm text-muted" aria-live="polite">
          {done ? t("discover.coordination.done") : t("discover.coordination.round", { n: Math.min(errors.length + 1, ROUNDS), total: ROUNDS })}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: ROUNDS }, (_, i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < errors.length ? (errors[i] < 0.15 ? "bg-gold" : "bg-fg/40") : "bg-line")} style={{ minWidth: 40 }} />
          ))}
        </div>
        {!done &&
          (running ? (
            <Button variant="gold" size="xl" onClick={tap} className="w-full">
              {t("discover.coordination.tap")}
            </Button>
          ) : (
            <Button variant="glass" size="xl" icon="Play" onClick={start} className="w-full">
              {t("discover.coordination.begin")}
            </Button>
          ))}
      </div>
    </div>
  );
}
