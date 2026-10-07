"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { ListenButton } from "@/components/ui/ListenButton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { useT } from "@/lib/i18n/client";

// Display order of the (correctly ordered) steps — fixed so server and client render the same.
const SHUFFLE = [2, 0, 3, 1];

export function SequenceTask({ onResult }: { onResult: (r: { mistakes: number }) => void }) {
  const { t, tl } = useT();
  const steps = tl("discover.sequence.steps");
  const [picked, setPicked] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const done = picked.length === steps.length && steps.length > 0;

  const tap = (idx: number) => {
    if (picked.includes(idx) || done) return;
    if (idx === picked.length) {
      const next = [...picked, idx];
      setPicked(next);
      setWrong(null);
      if (next.length === steps.length) onResult({ mistakes });
    } else {
      setMistakes((m) => m + 1);
      setWrong(idx);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-3">
        {SHUFFLE.filter((i) => i < steps.length).map((i) => {
          const used = picked.includes(i);
          return (
            <motion.div
              key={i}
              role="button"
              tabIndex={used ? -1 : 0}
              onClick={() => tap(i)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), tap(i))}
              animate={wrong === i ? { x: [0, -6, 6, -3, 0] } : { x: 0, opacity: used ? 0.35 : 1 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "glass gold-edge flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl p-4 text-left",
                used && "pointer-events-none",
                wrong === i && "!border-danger/50",
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-gold">
                <Icon name="CookingPot" className="size-5" />
              </span>
              <span className="flex-1 text-[1.02rem]">{steps[i]}</span>
              <ListenButton text={steps[i]} />
            </motion.div>
          );
        })}
        <AnimatePresence>
          {wrong !== null && !done && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-warn" aria-live="polite">
              {t("discover.sequence.tryAgain")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="glass rounded-[var(--radius-tile)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="eyebrow">{t("discover.sequence.yourOrder")}</div>
          {picked.length > 0 && !done && (
            <Button variant="ghost" icon="RotateCcw" onClick={() => setPicked([])}>
              {t("discover.sequence.reset")}
            </Button>
          )}
        </div>
        <ol className="grid gap-2">
          {steps.map((_, n) => {
            const idx = picked[n];
            return (
              <li key={n} className={cn("flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3", idx !== undefined ? "border-gold/35 bg-gold/5" : "border-dashed border-line")}>
                <span className={cn("font-display text-2xl italic", idx !== undefined ? "text-gold" : "text-subtle")}>{n + 1}</span>
                {idx !== undefined && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                    {steps[idx]}
                  </motion.span>
                )}
              </li>
            );
          })}
        </ol>
        {done && <p className="mt-4 text-ok">{t("discover.sequence.done")}</p>}
      </div>
    </div>
  );
}
