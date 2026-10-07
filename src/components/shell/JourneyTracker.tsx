"use client";

import { motion } from "motion/react";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";

export function useJourney() {
  const profile = useApp((s) => s.profile);
  const learning = useApp((s) => s.learning);
  const interested = useApp((s) => s.interested);
  const parchiJobs = useApp((s) => s.parchiJobs);
  const discover = profile.strengths.length > 0;
  const learn = Object.values(learning).some((l) => l.completedLessons.length > 0);
  const connect = Object.keys(interested).length > 0 || parchiJobs.length > 0;
  return { discover, learn, connect };
}

/** Discover → Learn → Connect */
export function JourneyTracker({ className }: { className?: string }) {
  const j = useJourney();
  const { t } = useT();
  const steps = [
    { key: "discover", done: j.discover, icon: "Search" as const },
    { key: "learn", done: j.learn, icon: "BookOpen" as const },
    { key: "connect", done: j.connect, icon: "Briefcase" as const },
  ];
  const current = steps.findIndex((s) => !s.done);
  return (
    <ol aria-label={t("common.journey.label")} className={cn("flex items-center gap-2", className)}>
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors",
              s.done ? "border-gold/40 bg-gold/10 text-gold" : i === current ? "border-line-strong text-fg" : "border-line text-subtle",
            )}
          >
            <Icon name={s.done ? "Check" : s.icon} className="size-3.5" />
            {t(`common.journey.${s.key}`)}
          </span>
          {i < steps.length - 1 && (
            <span className="relative h-px w-6 overflow-hidden bg-line sm:w-10">
              <motion.span className="absolute inset-y-0 left-0 bg-gold" initial={{ width: 0 }} animate={{ width: s.done ? "100%" : "0%" }} transition={{ duration: 0.8 }} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
