"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { categoryMeta, type ExperienceLevel, type TrainingOption } from "@/lib/taxonomy";
import { haversineKm, townById } from "@/lib/geo/towns";
import type { PublicJob } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { VerificationBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { ListenButton } from "@/components/ui/ListenButton";
import { cn } from "@/components/ui/cn";
import { useJobsByIds } from "@/components/jobs/useJobs";
import { useJobText } from "@/components/jobs/useJobText";
import { JobGridSkeleton } from "@/components/jobs/JobResults";

const monthly = (j: PublicJob) => (j.payPeriod === "day" ? j.payMax * 26 : j.payMax);
const hoursLen = (j: PublicJob) => {
  const [a, b] = [j.shift.start, j.shift.end].map((s) => s.split(":").map(Number)).map(([h, m]) => h + m / 60);
  return b - a;
};
const trainingRank: Record<TrainingOption, number> = { provided: 2, on_job: 1, not_provided: 0 };
const expRank: Record<ExperienceLevel, number> = { none: 2, preferred: 1, required: 0 };

export default function ComparePage() {
  const { t, pick } = useT();
  const ids = useApp((s) => s.compare);
  const toggle = useApp((s) => s.toggleCompare);
  const home = townById(useApp((s) => s.profile.townId));
  const { items, loading } = useJobsByIds(ids);
  const text = useJobText();

  const dist = (j: PublicJob) => (home ? Math.round(haversineKm(home, j)) : null);
  const best = <T,>(fn: (j: PublicJob) => T | null, better: (a: T, b: T) => boolean) => {
    const vals = items.map(fn).filter((v): v is T => v != null);
    if (items.length < 2 || !vals.length) return () => false;
    const top = vals.reduce((m, v) => (better(v, m) ? v : m));
    return (j: PublicJob) => fn(j) === top;
  };
  const isBest = {
    pay: best(monthly, (a, b) => a > b),
    hours: best(hoursLen, (a, b) => a < b),
    distance: best(dist, (a, b) => a < b),
    training: best((j) => trainingRank[j.training], (a, b) => a > b),
    experience: best((j) => expRank[j.experience], (a, b) => a > b),
    verification: (j: PublicJob) => items.length > 1 && j.verified,
  };

  const rows: { key: keyof typeof isBest | "type" | "employer"; icon: Parameters<typeof Icon>[0]["name"]; render: (j: PublicJob) => React.ReactNode }[] = [
    { key: "pay", icon: "Wallet", render: (j) => <span className="font-display text-xl text-gold">{text(j).pay}</span> },
    { key: "hours", icon: "Clock", render: (j) => text(j).hours },
    { key: "type", icon: "Briefcase", render: (j) => text(j).type },
    { key: "distance", icon: "MapPin", render: (j) => (dist(j) != null ? `${t("common.units.km", { n: dist(j)! })} · ${text(j).town}` : text(j).town) },
    { key: "training", icon: "GraduationCap", render: (j) => t(`common.training.${j.training}`) },
    { key: "experience", icon: "Award", render: (j) => t(`common.experience.${j.experience}`) },
    { key: "verification", icon: "ShieldCheck", render: (j) => <VerificationBadge verified={j.verified} compact /> },
    { key: "employer", icon: "Building2", render: (j) => j.employer.name },
  ];

  return (
    <div>
      <PageHeader eyebrow={t("jobs.compare.eyebrow")} title={t("jobs.compare.title")} lede={t("jobs.compare.lede")} />
      {loading ? (
        <JobGridSkeleton n={3} />
      ) : !items.length ? (
        <div className="glass gold-edge rounded-[var(--radius-tile)] p-8">
          <h2 className="font-display text-3xl">{t("jobs.compare.empty")}</h2>
          <p className="mt-2 text-muted">{t("jobs.compare.emptyBody")}</p>
          <LinkButton href="/jobs" variant="gold" icon="Briefcase" className="mt-6">{t("jobs.compare.browse")}</LinkButton>
        </div>
      ) : (
        <div className="thin-scroll -mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[40rem] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-40" />
                {items.map((j, i) => (
                  <th key={j.id} scope="col" className="p-2 align-top">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass gold-edge rounded-2xl p-4 text-left">
                      <div className="flex items-start justify-between">
                        <span className="grid size-10 place-items-center rounded-xl border border-line text-gold">
                          <Icon name={categoryMeta(j.category).icon} className="size-5" />
                        </span>
                        <div className="flex gap-1">
                          <ListenButton text={text(j).speech} />
                          <button onClick={() => toggle(j.id)} aria-label={t("jobs.compare.remove")} className="grid size-9 place-items-center rounded-full border border-line text-muted hover:text-danger">
                            <Icon name="X" className="size-4" />
                          </button>
                        </div>
                      </div>
                      <Link href={`/jobs/${j.id}`} className="mt-3 block text-lg font-medium leading-snug hover:text-gold">{text(j).title}</Link>
                      <div className="text-sm font-normal text-muted">{pick(townById(j.townId)?.name)}</div>
                    </motion.div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" className="border-t border-line py-4 pr-4 text-left align-middle">
                    <span className="inline-flex items-center gap-2 text-sm font-normal text-muted">
                      <Icon name={r.icon} className="size-4 text-gold" /> {t(`jobs.compare.rows.${r.key}`)}
                    </span>
                  </th>
                  {items.map((j) => {
                    const hi = r.key in isBest && isBest[r.key as keyof typeof isBest](j);
                    return (
                      <td key={j.id} className="border-t border-line p-2 align-middle">
                        <div className={cn("flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm", hi && "bg-gold/10 ring-1 ring-gold/30")}>
                          <span>{r.render(j)}</span>
                          {hi && <span className="eyebrow !text-[0.58rem] !text-gold">{t("jobs.compare.best")}</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
