"use client";

import { motion } from "motion/react";
import { Rich, plain } from "./Rich";
import { ListenButton } from "./ListenButton";

/** Eyebrow + serif display title (with *italic* emphasis) + lede. */
export function PageHeader({ eyebrow, title, lede, actions }: { eyebrow?: string; title: string; lede?: string; actions?: React.ReactNode }) {
  return (
    <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
        <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
          <Rich text={title} />
        </h1>
        {lede && <p data-secondary className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-muted">{lede}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <ListenButton size="md" text={[plain(title), lede].filter(Boolean).join(". ")} />
      </div>
    </motion.header>
  );
}
