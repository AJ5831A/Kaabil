"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { HOURS_BANDS, JOB_CATEGORIES, type HoursBand, type JobType } from "@/lib/taxonomy";
import type { JobFilters } from "@/lib/jobs/filter";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Rich, plain } from "@/components/ui/Rich";
import { Button } from "@/components/ui/Button";
import { ListenButton } from "@/components/ui/ListenButton";
import { TownPicker } from "./TownPicker";

type Answers = { category?: string; townId?: string; maxDistanceKm?: number; type?: JobType | "any"; hoursBand?: HoursBand | "any"; experience?: "yes" | "some" | "no" };
const STEPS = ["work", "place", "distance", "type", "hours", "experience"] as const;

/** One question per screen: work → place → distance → full/part-time → hours → experience. */
export function GuidedSearch({ onDone, onCancel }: { onDone: (f: JobFilters) => void; onCancel: () => void }) {
  const { t } = useT();
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({
    category: profile.preferredWork[0],
    townId: profile.townId,
    maxDistanceKm: profile.maxDistanceKm,
    type: profile.jobType,
    hoursBand: profile.hoursBand,
  });

  const finish = (final: Answers) => {
    const preferredWork = final.category && final.category !== "any" ? [final.category, ...profile.preferredWork.filter((x) => x !== final.category)].slice(0, 4) : profile.preferredWork;
    updateProfile({
      preferredWork,
      townId: final.townId ?? profile.townId,
      maxDistanceKm: final.maxDistanceKm ?? profile.maxDistanceKm,
      jobType: final.type && final.type !== "any" ? final.type : undefined,
      hoursBand: final.hoursBand && final.hoursBand !== "any" ? final.hoursBand : undefined,
      experience: profile.experience || (final.experience === "yes" ? "Has previous work experience" : final.experience === "some" ? "Some experience" : profile.experience),
    });
    onDone({
      category: final.category && final.category !== "any" ? final.category : undefined,
      townId: final.townId,
      maxDistanceKm: final.townId ? final.maxDistanceKm : undefined,
      type: final.type && final.type !== "any" ? final.type : undefined,
      hoursBand: final.hoursBand && final.hoursBand !== "any" ? final.hoursBand : undefined,
    });
  };

  const answer = (patch: Answers) => {
    const next = { ...a, ...patch };
    setA(next);
    if (step < STEPS.length - 1) setTimeout(() => setStep(step + 1), 220);
    else finish(next);
  };

  const key = STEPS[step];
  const q = t(`jobs.guided.${key}.q`);

  return (
    <section aria-live="polite">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-label={t("jobs.guided.step", { n: step + 1, total: STEPS.length })}>
          {STEPS.map((s, i) => (
            <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-glass-2">
              <motion.span className="block h-full bg-gold" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
            </span>
          ))}
        </div>
        <span className="eyebrow">{t("jobs.guided.step", { n: step + 1, total: STEPS.length })}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={key} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: "spring", stiffness: 280, damping: 30 }}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="font-display text-3xl sm:text-4xl">
              <Rich text={q} />
            </h2>
            <ListenButton size="md" text={plain(q)} />
          </div>

          {key === "work" && (
            <TileGrid>
              <Tile index={0} icon="LayoutGrid" label={t("jobs.guided.work.any")} sub={t("jobs.guided.work.anySub")} selected={a.category === "any"} onClick={() => answer({ category: "any" })} />
              {JOB_CATEGORIES.map((c, i) => (
                <Tile key={c.key} index={i + 1} icon={c.icon} label={t(`common.jobCategories.${c.key}`)} selected={a.category === c.key} onClick={() => answer({ category: c.key })} />
              ))}
            </TileGrid>
          )}
          {key === "place" && <TownPicker value={a.townId} onPick={(id) => answer({ townId: id })} />}
          {key === "distance" && (
            <TileGrid cols={4}>
              {[5, 10, 25, 50].map((n, i) => (
                <Tile key={n} index={i} icon="Route" label={t("jobs.guided.distance.km", { n })} sub={t(`jobs.guided.distance.sub${n}`)} selected={a.maxDistanceKm === n} onClick={() => answer({ maxDistanceKm: n })} />
              ))}
            </TileGrid>
          )}
          {key === "type" && (
            <TileGrid cols={3}>
              <Tile index={0} icon="Clock" label={t("common.jobType.full_time")} selected={a.type === "full_time"} onClick={() => answer({ type: "full_time" })} />
              <Tile index={1} icon="Timer" label={t("common.jobType.part_time")} selected={a.type === "part_time"} onClick={() => answer({ type: "part_time" })} />
              <Tile index={2} icon="LayoutGrid" label={t("jobs.guided.type.any")} selected={a.type === "any"} onClick={() => answer({ type: "any" })} />
            </TileGrid>
          )}
          {key === "hours" && (
            <TileGrid cols={3}>
              {HOURS_BANDS.map((h, i) => (
                <Tile key={h} index={i} icon={h === "morning" ? "Sun" : h === "evening" ? "Moon" : h === "flexible" ? "CalendarClock" : "Clock"} label={t(`common.hours.${h}`)} selected={a.hoursBand === h} onClick={() => answer({ hoursBand: h })} />
              ))}
              <Tile index={4} icon="LayoutGrid" label={t("jobs.guided.hours.any")} selected={a.hoursBand === "any"} onClick={() => answer({ hoursBand: "any" })} />
            </TileGrid>
          )}
          {key === "experience" && (
            <TileGrid cols={3}>
              <Tile index={0} icon="Award" label={t("jobs.guided.experience.yes")} selected={a.experience === "yes"} onClick={() => answer({ experience: "yes" })} />
              <Tile index={1} icon="Star" label={t("jobs.guided.experience.some")} selected={a.experience === "some"} onClick={() => answer({ experience: "some" })} />
              <Tile index={2} icon="Sprout" label={t("jobs.guided.experience.no")} selected={a.experience === "no"} onClick={() => answer({ experience: "no" })} />
            </TileGrid>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button variant="ghost" icon="ArrowLeft" onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}>
          {t("jobs.guided.back")}
        </Button>
        <Button variant="glass" iconRight="ArrowRight" className="ml-auto" onClick={() => finish(a)}>
          {t("jobs.guided.showResults")}
        </Button>
      </div>
    </section>
  );
}
