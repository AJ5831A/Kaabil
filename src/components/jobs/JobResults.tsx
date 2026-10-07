"use client";

import { useT } from "@/lib/i18n/client";
import type { PublicJob } from "@/lib/types";
import { Rich } from "@/components/ui/Rich";
import { Icon } from "@/components/ui/Icon";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { JobTile } from "./JobTile";

export function JobEmpty({ onWiden, onClear }: { onWiden?: () => void; onClear?: () => void }) {
  const { t } = useT();
  return (
    <div className="glass gold-edge rounded-[var(--radius-tile)] p-8">
      <h3 className="font-display text-3xl">
        <Rich text={t("jobs.results.emptyTitle")} />
      </h3>
      <p className="mt-2 max-w-lg text-muted">{t("jobs.results.emptyBody")}</p>
      <TileGrid cols={4} className="mt-6">
        {onWiden && <Tile index={0} icon="Route" label={t("jobs.results.widen")} onClick={onWiden} square={false} size="sm" />}
        {onClear && <Tile index={1} icon="RotateCcw" label={t("jobs.results.clear")} onClick={onClear} square={false} size="sm" />}
        <Tile index={2} icon="BookOpen" label={t("jobs.results.learn")} href="/learn" square={false} size="sm" />
        <Tile index={3} icon="Monitor" label={t("jobs.results.station")} href="/station" square={false} size="sm" />
      </TileGrid>
    </div>
  );
}

export function JobGridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 @xl:grid-cols-3" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="glass relative aspect-square overflow-hidden rounded-[var(--radius-tile)]">
          <div className="shimmer absolute inset-0 opacity-40" />
        </div>
      ))}
    </div>
  );
}

export function JobResults({ items, loading, error, onWiden, onClear }: { items: PublicJob[]; loading: boolean; error?: boolean; onWiden?: () => void; onClear?: () => void }) {
  const { t } = useT();
  if (loading)
    return (
      <div>
        <p className="mb-4 text-sm text-muted" role="status">{t("jobs.results.loading")}</p>
        <JobGridSkeleton />
      </div>
    );
  if (error) return <p className="text-danger" role="alert">{t("common.error")}</p>;
  if (!items.length) return <JobEmpty onWiden={onWiden} onClear={onClear} />;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-fg" role="status">
          {items.length === 1 ? t("jobs.results.countOne") : t("jobs.results.count", { n: items.length })}
        </p>
        <p data-secondary className="inline-flex items-center gap-1.5 text-xs text-subtle">
          <Icon name="ShieldCheck" className="size-3.5 text-ok" />
          {t("jobs.results.verifiedFirst")}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 @xl:grid-cols-3 @5xl:grid-cols-4">
        {items.map((j, i) => (
          <JobTile key={j.id} job={j} index={i} />
        ))}
      </div>
    </div>
  );
}
