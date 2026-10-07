"use client";

import { useEffect, useState } from "react";
import type { TrainingProgramme } from "@/lib/types";
import type { SkillKey } from "@/lib/taxonomy";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { townById } from "@/lib/geo/towns";
import { formatRupees } from "@/lib/format";
import { Rich } from "@/components/ui/Rich";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Badge";
import { ListenButton } from "@/components/ui/ListenButton";

export function TrainingList({ skill }: { skill: SkillKey }) {
  const { t, pick, locale } = useT();
  const townId = useApp((s) => s.profile.townId);
  const [items, setItems] = useState<TrainingProgramme[] | null>(null);

  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ skill, ...(townId ? { townId } : {}) });
    fetch(`/api/training?${qs}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => alive && setItems(d.items ?? []))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [skill, townId]);

  return (
    <section className="mt-14">
      <h2 className="font-display text-3xl">
        <Rich text={t("learn.training")} />
      </h2>
      <p className="mb-5 mt-1 text-sm text-muted">{t("learn.trainingSub")}</p>
      {items === null ? (
        <div className="glass h-28 overflow-hidden rounded-[var(--radius-tile)]"><div className="shimmer h-full opacity-40" /></div>
      ) : items.length === 0 ? (
        <p className="glass rounded-[var(--radius-tile)] p-5 text-muted">{t("learn.trainingNone")}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((p) => {
            const town = townById(p.townId);
            const text = `${pick(p.name)}. ${p.provider}. ${town ? pick(town.name) : ""}. ${pick(p.description)}`;
            return (
              <li key={p.id} className="glass gold-edge rounded-[var(--radius-tile)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{pick(p.name)}</div>
                    <div className="mt-0.5 text-sm text-muted">{p.provider}</div>
                  </div>
                  <ListenButton text={text} />
                </div>
                <p data-secondary className="mt-3 text-sm text-muted">{pick(p.description)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {town && (
                    <Pill>
                      <Icon name="MapPin" className="size-3.5" /> {pick(town.name)}
                    </Pill>
                  )}
                  <Pill>
                    <Icon name="CalendarClock" className="size-3.5" /> {t("learn.weeks", { n: p.durationWeeks })}
                  </Pill>
                  <Pill tone={p.fee === 0 ? "ok" : "neutral"}>{p.fee === 0 ? t("learn.free") : t("learn.fee", { amount: formatRupees(p.fee, locale) })}</Pill>
                  <Pill>{t(`learn.mode.${p.mode}`)}</Pill>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
