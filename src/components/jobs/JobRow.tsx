"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { categoryMeta } from "@/lib/taxonomy";
import type { PublicJob } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { ListenButton } from "@/components/ui/ListenButton";
import { VerificationBadge } from "@/components/ui/Badge";
import { useJobText } from "./useJobText";

/** Compact list row used by "Mere Paas Kaam". */
export function JobRow({ job, index = 0 }: { job: PublicJob; index?: number }) {
  const text = useJobText()(job);
  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 12) * 0.035 }} className="relative">
      <Link href={`/jobs/${job.id}`} className="glass gold-edge group flex items-center gap-4 rounded-2xl p-4 pr-16 transition-colors hover:bg-glass-2 sm:gap-5 sm:p-5 sm:pr-20">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line text-gold">
          <Icon name={categoryMeta(job.category).icon} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-lg font-medium">{text.title}</span>
            <VerificationBadge verified={job.verified} compact />
          </div>
          <div className="mt-0.5 truncate text-sm text-muted">
            {job.employer.name} · {text.town}
            {text.distance && ` · ${text.distance}`}
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <div className="font-display text-xl text-gold">{text.pay}</div>
          <div data-secondary className="text-xs text-subtle">{text.type} · {text.hours}</div>
        </div>
      </Link>
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <ListenButton text={text.speech} />
      </div>
      <div className="mt-1 pl-4 font-display text-lg text-gold sm:hidden">{text.pay}</div>
    </motion.li>
  );
}
