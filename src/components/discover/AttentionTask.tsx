"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { useT } from "@/lib/i18n/client";

// Same icon, subtly changed: only rotation 0 + not mirrored is a match.
// [rotate, mirrored]
const CELLS: [number, boolean][] = [
  [90, false], [0, false], [180, false], [0, true],
  [0, false], [45, false], [270, false], [0, true],
  [135, false], [0, true], [0, false], [90, false],
  [180, false], [315, false], [45, false], [0, false],
];
const isMatch = ([r, m]: [number, boolean]) => r === 0 && !m;
export const ATTENTION_TOTAL = CELLS.filter(isMatch).length;

export function AttentionTask({ onResult }: { onResult: (r: { correct: number; wrong: number; total: number }) => void }) {
  const { t } = useT();
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const done = found.length === ATTENTION_TOTAL;

  const tap = (i: number) => {
    if (done || found.includes(i)) return;
    if (isMatch(CELLS[i])) {
      const next = [...found, i];
      setFound(next);
      onResult({ correct: next.length, wrong, total: ATTENTION_TOTAL });
    } else {
      setWrong((w) => {
        onResult({ correct: found.length, wrong: w + 1, total: ATTENTION_TOTAL });
        return w + 1;
      });
      setFlash(i);
      setTimeout(() => setFlash(null), 450);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:items-start">
      <div className="glass gold-edge flex items-center gap-4 rounded-[var(--radius-tile)] p-5 lg:flex-col lg:items-start">
        <div className="eyebrow">{t("discover.attention.target")}</div>
        <span className="grid size-20 place-items-center rounded-2xl border border-gold/40 bg-gold/10 text-gold">
          <Icon name="Scissors" className="size-10" />
        </span>
        <div className="ml-auto text-sm text-muted lg:ml-0" aria-live="polite">
          {done ? <span className="text-ok">{t("discover.attention.done")}</span> : t("discover.attention.found", { n: found.length, total: ATTENTION_TOTAL })}
        </div>
      </div>
      <div className="grid max-w-xl grid-cols-4 gap-2.5 sm:gap-3">
        {CELLS.map(([rot, mir], i) => {
          const hit = found.includes(i);
          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => tap(i)}
              aria-label={`${i + 1}`}
              aria-pressed={hit}
              animate={flash === i ? { x: [0, -5, 5, -3, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "glass grid aspect-square place-items-center rounded-2xl border transition-colors",
                hit ? "!border-gold/60 bg-gold/15 text-gold" : "text-fg hover:bg-glass-2",
                flash === i && "!border-danger/60 bg-danger-bg",
              )}
            >
              <Icon name="Scissors" className="size-8 sm:size-9" style={{ transform: `rotate(${rot}deg) scaleX(${mir ? -1 : 1})` }} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
