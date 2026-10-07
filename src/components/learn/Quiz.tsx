"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { QuizItem } from "@/content/learn/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ListenButton } from "@/components/ui/ListenButton";
import { cn } from "@/components/ui/cn";
import { useT } from "@/lib/i18n/client";
import { useFeedback } from "@/lib/feedback";

/** One question at a time. Calls onDone(score 0..1). */
export function Quiz({ items, onDone }: { items: QuizItem[]; onDone: (score: number) => void }) {
  const { t } = useT();
  const fb = useFeedback();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const q = items[i];
  const answered = picked !== null;
  const right = answered && picked === q.answer;

  const choose = (o: number) => {
    if (answered) return;
    setPicked(o);
    if (o === q.answer) {
      setCorrect((c) => c + 1);
      fb.success();
    }
  };

  const next = () => {
    if (i + 1 < items.length) {
      setI(i + 1);
      setPicked(null);
    } else onDone(correct / items.length);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="eyebrow">{t("learn.question", { n: i + 1, total: items.length })}</div>
        <ListenButton text={`${q.q}. ${q.options.map((o, k) => `${k + 1}. ${o}`).join(". ")}`} />
      </div>
      <p className="mb-5 font-display text-2xl leading-snug sm:text-3xl">{q.q}</p>
      <div className="grid gap-3">
        {q.options.map((o, k) => {
          const isAnswer = answered && k === q.answer;
          const isWrongPick = answered && k === picked && k !== q.answer;
          return (
            <motion.button
              key={k}
              type="button"
              onClick={() => choose(k)}
              whileTap={{ scale: 0.985 }}
              animate={isWrongPick ? { x: [0, -6, 6, -3, 0] } : { x: 0 }}
              disabled={answered}
              className={cn(
                "glass flex min-h-16 items-center gap-4 rounded-2xl border px-5 py-4 text-left text-[1.02rem] transition-colors",
                !answered && "hover:bg-glass-2",
                isAnswer && "!border-ok/60 bg-ok-bg",
                isWrongPick && "!border-danger/50 bg-danger-bg",
              )}
            >
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border font-mono text-sm", isAnswer ? "border-ok text-ok" : "border-line text-muted")}>
                {isAnswer ? <Icon name="Check" className="size-4" /> : isWrongPick ? <Icon name="X" className="size-4 text-danger" /> : k + 1}
              </span>
              {o}
            </motion.button>
          );
        })}
      </div>
      {answered && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div aria-live="polite">
            <p className={right ? "text-ok" : "text-warn"}>{right ? t("learn.correct") : t("learn.notQuite")}</p>
            {q.explain && <p className="mt-1 text-sm text-muted">{q.explain}</p>}
          </div>
          <Button variant="gold" iconRight="ArrowRight" onClick={next}>
            {i + 1 < items.length ? t("learn.nextQuestion") : t("common.actions.done")}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
