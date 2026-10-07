"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { townById } from "@/lib/geo/towns";
import type { JobFilters } from "@/lib/jobs/filter";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Rich } from "@/components/ui/Rich";
import { TownPicker, PilotMap } from "@/components/jobs/TownPicker";
import { FilterPanel } from "@/components/jobs/FilterPanel";
import { JobRow } from "@/components/jobs/JobRow";
import { JobEmpty, JobGridSkeleton } from "@/components/jobs/JobResults";
import { useJobs } from "@/components/jobs/useJobs";

export default function NearbyPage() {
  const { t, pick } = useT();
  const hydrated = useApp((s) => s.hydrated);
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const [extra, setExtra] = useState<JobFilters>({});
  const [pickTown, setPickTown] = useState(false);
  const [sheet, setSheet] = useState(false);

  const town = townById(profile.townId);
  const filters = useMemo<JobFilters | null>(
    () => (town ? { maxDistanceKm: profile.maxDistanceKm || 25, sort: "distance", ...extra, townId: town.id } : null),
    [town, profile.maxDistanceKm, extra],
  );
  const { items, loading } = useJobs(filters);

  if (!hydrated) return <JobGridSkeleton n={3} />;

  return (
    <div>
      <PageHeader
        eyebrow={t("jobs.nearby.eyebrow")}
        title={t("jobs.nearby.title")}
        lede={town ? t("jobs.nearby.lede", { town: pick(town.name) }) : undefined}
        actions={
          town && (
            <Button icon="MapPin" onClick={() => setPickTown(true)}>
              {t("jobs.nearby.changeTown")}
            </Button>
          )
        }
      />

      {!town || pickTown ? (
        <section>
          <h2 className="mb-5 font-display text-3xl">{t("jobs.nearby.pickTown")}</h2>
          <TownPicker
            value={profile.townId}
            onPick={(id) => {
              updateProfile({ townId: id });
              setPickTown(false);
            }}
          />
        </section>
      ) : (
        <div className="@container">
        <div className="grid gap-8 @3xl:grid-cols-[1fr_16rem]">
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl">
                <Rich text={t("jobs.nearby.heading")} />
                <span className="ml-3 align-middle text-sm text-subtle">{t("jobs.nearby.within", { n: filters?.maxDistanceKm ?? 25 })}</span>
              </h2>
              <Button icon="Filter" className="@3xl:hidden" onClick={() => setSheet(true)}>
                {t("jobs.filters.show")}
              </Button>
            </div>
            {loading ? (
              <JobGridSkeleton n={3} />
            ) : items.length ? (
              <ul className="space-y-3">
                {items.map((j, i) => (
                  <JobRow key={j.id} job={j} index={i} />
                ))}
              </ul>
            ) : (
              <JobEmpty onWiden={() => setExtra({ ...extra, maxDistanceKm: Math.min(200, (filters?.maxDistanceKm ?? 25) * 2) })} onClear={() => setExtra({})} />
            )}
          </section>
          <aside className="hidden space-y-4 @3xl:block">
            <PilotMap value={town.id} onPick={(id) => updateProfile({ townId: id })} className="aspect-square" />
            <div className="glass gold-edge rounded-[var(--radius-tile)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-xl">{t("jobs.filters.title")}</h3>
                <Icon name="Filter" className="size-4 text-gold" />
              </div>
              <FilterPanel value={filters!} onChange={(f) => setExtra({ ...f, townId: undefined })} showTown={false} />
            </div>
          </aside>
        </div>
        </div>
      )}

      <Modal open={sheet} onClose={() => setSheet(false)} title={t("jobs.filters.title")}>
        {filters && <FilterPanel value={filters} onChange={(f) => setExtra({ ...f, townId: undefined })} showTown={false} />}
        <Button variant="gold" className="mt-6 w-full" onClick={() => setSheet(false)}>
          {t("common.actions.done")}
        </Button>
      </Modal>
    </div>
  );
}
