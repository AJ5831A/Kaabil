"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import type { JobFilters } from "@/lib/jobs/filter";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { FilterPanel } from "@/components/jobs/FilterPanel";
import { GuidedSearch } from "@/components/jobs/GuidedSearch";
import { JobResults } from "@/components/jobs/JobResults";
import { useJobs } from "@/components/jobs/useJobs";

function filtersFromProfile(p: ReturnType<typeof useApp.getState>["profile"]): JobFilters {
  return {
    townId: p.townId,
    maxDistanceKm: p.townId ? p.maxDistanceKm : undefined,
    category: p.preferredWork[0],
    type: p.jobType,
    hoursBand: p.hoursBand,
  };
}

export default function JobsPage() {
  const { t } = useT();
  const hydrated = useApp((s) => s.hydrated);
  const compare = useApp((s) => s.compare);
  const profile = useApp((s) => s.profile);
  const [modeState, setMode] = useState<"intro" | "guided" | "results" | null>(null);
  const [override, setFilters] = useState<JobFilters | null>(null);
  const [sheet, setSheet] = useState(false);

  // Until the user changes anything, filters come from their saved profile;
  // returning users with a town go straight to results.
  const filters = override ?? (hydrated ? filtersFromProfile(profile) : null);
  const mode = modeState ?? (hydrated && profile.townId ? "results" : "intro");

  const { items, loading, error } = useJobs(mode === "results" ? filters : null);
  const activeCount = filters ? Object.entries(filters).filter(([k, v]) => k !== "townId" && v !== undefined).length : 0;

  return (
    <div>
      <PageHeader
        eyebrow={t("jobs.eyebrow")}
        title={t("jobs.title")}
        lede={t("jobs.lede")}
        actions={
          <>
            <LinkButton href="/jobs/nearby" icon="MapPin" variant="glass">
              <span className="hidden sm:inline">{t("jobs.nearbyLink")}</span>
            </LinkButton>
            {compare.length > 0 && (
              <LinkButton href="/jobs/compare" icon="Scale" variant="glass">
                {t("jobs.compareLink", { n: compare.length })}
              </LinkButton>
            )}
          </>
        }
      />

      <AnimatePresence mode="wait">
        {mode === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 sm:grid-cols-2">
            <button onClick={() => setMode("guided")} className="glass-strong gold-edge group flex min-h-56 flex-col rounded-[1.75rem] p-7 text-left">
              <span className="grid size-14 place-items-center rounded-2xl bg-gold text-gold-ink">
                <Icon name="MessageCircle" className="size-7" />
              </span>
              <span className="mt-auto font-display text-3xl">{t("jobs.startGuided")}</span>
              <span className="mt-1 text-sm text-muted">{t("jobs.guided.step", { n: 1, total: 6 })} · {t("jobs.guided.work.q").replace(/\*/g, "")}</span>
            </button>
            <button onClick={() => setMode("results")} className="glass gold-edge group flex min-h-56 flex-col rounded-[1.75rem] p-7 text-left hover:bg-glass-2">
              <span className="grid size-14 place-items-center rounded-2xl border border-line text-gold">
                <Icon name="LayoutGrid" className="size-7" />
              </span>
              <span className="mt-auto font-display text-3xl">{t("jobs.skipToResults")}</span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                <Icon name="ShieldCheck" className="size-4 text-ok" /> {t("common.trust.neverPay")}
              </span>
            </button>
          </motion.div>
        )}

        {mode === "guided" && (
          <motion.div key="guided" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GuidedSearch
              onCancel={() => setMode("intro")}
              onDone={(f) => {
                setFilters(f);
                setMode("results");
              }}
            />
          </motion.div>
        )}

        {mode === "results" && filters && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="@container/jobs">
          <div className="grid gap-6 @2xl/jobs:grid-cols-[14rem_1fr] @2xl/jobs:gap-7">
            <aside className="hidden self-start @2xl/jobs:sticky @2xl/jobs:top-24 @2xl/jobs:block">
              <div className="glass gold-edge rounded-[var(--radius-tile)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl">{t("jobs.filters.title")}</h2>
                  <Icon name="Filter" className="size-4 text-gold" />
                </div>
                <FilterPanel value={filters} onChange={setFilters} />
              </div>
            </aside>
            <div className="@container min-w-0">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Button size="md" variant="glass" icon="Filter" className="@2xl/jobs:hidden" onClick={() => setSheet(true)}>
                  {t("jobs.filters.show")}
                  {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-gold text-[0.65rem] text-gold-ink">{activeCount}</span>}
                </Button>
                <Button size="md" variant="ghost" icon="MessageCircle" onClick={() => setMode("guided")}>
                  {t("jobs.startGuided")}
                </Button>
              </div>
              <JobResults
                items={items}
                loading={loading}
                error={error}
                onWiden={filters.maxDistanceKm ? () => setFilters({ ...filters, maxDistanceKm: Math.min(200, (filters.maxDistanceKm ?? 25) * 2) }) : undefined}
                onClear={() => setFilters({ townId: filters.townId })}
              />
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={sheet} onClose={() => setSheet(false)} title={t("jobs.filters.title")}>
        {filters && <FilterPanel value={filters} onChange={setFilters} />}
        <Button variant="gold" className="mt-6 w-full" onClick={() => setSheet(false)}>
          {t("common.actions.done")}
        </Button>
      </Modal>
    </div>
  );
}
