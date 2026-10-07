"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { categoryMeta } from "@/lib/taxonomy";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { Icon } from "@/components/ui/Icon";
import { ListenButton } from "@/components/ui/ListenButton";
import { VerificationBadge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/cn";
import { toast } from "@/components/ui/Toast";
import { useFeedback } from "@/lib/feedback";
import type { PublicJob } from "@/lib/types";
import { useJobText } from "./useJobText";

/** One job = one square glass tile. Opens the full job page. */
export function JobTile({ job, compact, index = 0 }: { job: PublicJob; compact?: boolean; index?: number }) {
  const { t } = useT();
  const text = useJobText()(job);
  const saved = useApp((s) => s.parchiJobs.includes(job.id));
  const toggle = useApp((s) => s.toggleParchiJob);
  const fb = useFeedback();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.04, type: "spring", stiffness: 260, damping: 26 }}
      whileHover={{ y: -3 }}
      className="relative"
    >
      <Link
        href={`/jobs/${job.id}`}
        aria-label={`${text.title}, ${text.town}, ${text.pay}, ${text.verification}`}
        onClick={() => fb.tap()}
        className={cn(
          "glass gold-edge group flex flex-col rounded-[var(--radius-tile)] text-fg transition-colors hover:bg-glass-2",
          compact ? "min-h-48 p-4" : "aspect-square min-h-60 p-5",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className={cn("grid place-items-center rounded-2xl border border-line bg-glass text-gold", compact ? "size-10" : "size-12")}>
            <Icon name={categoryMeta(job.category).icon} className={compact ? "size-5" : "size-6"} />
          </span>
          <span className="size-9" aria-hidden />
        </div>
        <div className="mt-auto pt-4">
          <VerificationBadge verified={job.verified} compact />
          <div className={cn("mt-2.5 font-medium leading-snug", compact ? "text-base" : "text-lg")}>{text.title}</div>
          <div className="mt-0.5 truncate text-sm text-muted">{job.employer.name}</div>
          <div className={cn("mt-2 font-display leading-tight text-gold", compact ? "text-lg" : "text-xl")}>{text.pay}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
            <span className="inline-flex items-center gap-1">
              <Icon name="MapPin" className="size-3.5" />
              {text.town}
              {text.distance && ` · ${text.distance}`}
            </span>
            <span data-secondary className="inline-flex items-center gap-1">
              <Icon name="Clock" className="size-3.5" />
              {text.type}
            </span>
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3 flex items-center gap-1.5 sm:right-4 sm:top-4">
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? t("jobs.card.removeFromParchi") : t("jobs.card.addToParchi")}
          title={saved ? t("jobs.card.removeFromParchi") : t("jobs.card.addToParchi")}
          onClick={() => {
            fb.tap();
            toggle(job.id);
            toast.ok(saved ? t("jobs.card.removed") : t("jobs.card.added"));
          }}
          className={cn(
            "grid size-9 place-items-center rounded-full border transition-colors",
            saved ? "border-gold/50 bg-gold text-gold-ink" : "border-line text-muted hover:border-line-strong hover:text-gold",
          )}
        >
          <Icon name={saved ? "Check" : "Plus"} className="size-4" />
        </button>
        <ListenButton text={text.speech} />
      </div>
    </motion.div>
  );
}
