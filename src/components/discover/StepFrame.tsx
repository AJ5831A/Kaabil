"use client";

import { motion } from "motion/react";
import { Rich, plain } from "@/components/ui/Rich";
import { ListenButton } from "@/components/ui/ListenButton";
import { useT } from "@/lib/i18n/client";

export function StepProgress({ step, total }: { step: number; total: number }) {
  const { t } = useT();
  return (
    <div className="mb-8" aria-label={t("discover.stepOf", { n: step, total })}>
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-subtle">
        <span>{t("discover.eyebrow")}</span>
        <span className="font-mono normal-case tracking-normal">{t("discover.stepOf", { n: step, total })}</span>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-line">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full bg-gold"
              initial={false}
              animate={{ width: i < step ? "100%" : "0%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/** One question per screen: serif title, hint, listen button, then the activity. */
export function StepFrame({ title, hint, children, footer }: { title: string; hint?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
            <Rich text={title} />
          </h1>
          {hint && <p className="mt-3 text-muted">{hint}</p>}
        </div>
        <ListenButton size="md" text={[plain(title), hint].filter(Boolean).join(". ")} />
      </div>
      {children}
      {footer && <div className="mt-8 flex flex-wrap items-center justify-between gap-3">{footer}</div>}
    </section>
  );
}
