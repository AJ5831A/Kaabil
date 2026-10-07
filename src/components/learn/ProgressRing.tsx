"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";

export function ProgressRing({ value, size = 44, stroke = 3, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(v * 100)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[0.65rem] font-medium text-muted">
        {v >= 1 ? <Icon name="Star" className="size-4 text-gold" fill="currentColor" /> : `${Math.round(v * 100)}%`}
      </span>
    </span>
  );
}

export function Stars({ n, of = 3, className }: { n: number; of?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className ?? ""}`} aria-label={`${n}/${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15 * i, type: "spring", stiffness: 300, damping: 14 }}>
          <Icon name="Star" className={i < n ? "size-4 text-gold" : "size-4 text-subtle"} fill={i < n ? "currentColor" : "none"} />
        </motion.span>
      ))}
    </span>
  );
}

/** Quiz score 0..1 → 1–3 stars (finishing always earns one). */
export function starsFor(score: number | undefined) {
  if (score == null) return 1;
  return score >= 0.99 ? 3 : score >= 0.5 ? 2 : 1;
}
