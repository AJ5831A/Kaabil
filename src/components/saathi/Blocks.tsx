"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { JobTile } from "@/components/jobs/JobTile";
import { Icon } from "@/components/ui/Icon";
import { VerificationBadge } from "@/components/ui/Badge";
import { ListenButton } from "@/components/ui/ListenButton";
import { cn } from "@/components/ui/cn";
import { useT } from "@/lib/i18n/client";
import { formatPayRange, formatShift, formatRupees } from "@/lib/format";
import { townById } from "@/lib/geo/towns";
import type { SaathiBlock } from "@/lib/store/app";
import type { PublicJob, Station, TrainingProgramme } from "@/lib/types";
import { useFeedback } from "@/lib/feedback";

const ICON_FOR_SKILL: Record<string, string> = {
  cooking: "ChefHat", cleaning: "Sparkles", sewing: "Scissors", repair: "Wrench", gardening: "Sprout", plant_care: "Sprout",
  packing: "Package", sales: "Store", digital_basics: "Keyboard", caregiving: "HeartHandshake", tools: "Hammer", craft: "Palette",
  driving: "Route", customer_service: "Users",
};

// Small client caches so re-renders during streaming don't refetch.
const jobCache = new Map<string, PublicJob | null>();
let trainingCache: Promise<TrainingProgramme[]> | null = null;
let stationCache: Promise<Station[]> | null = null;

function useJobs(ids: string[]) {
  const key = ids.join(",");
  const [, bump] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const missing = key ? key.split(",").filter((id) => !jobCache.has(id)) : [];
    if (!missing.length) return;
    let alive = true;
    fetch(`/api/jobs?ids=${encodeURIComponent(missing.join(","))}`)
      .then((r) => r.json())
      .then((d: { items: PublicJob[] }) => {
        for (const id of missing) jobCache.set(id, d.items.find((j) => j.id === id) ?? null);
        if (alive) bump((n) => n + 1);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [key]);
  if (failed) return [];
  return ids.every((id) => jobCache.has(id)) ? ids.map((id) => jobCache.get(id) ?? null) : null;
}

function BlockTitle({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow mb-2.5 mt-1">{children}</div>;
}

function JobsBlock({ ids }: { ids: string[] }) {
  const { t } = useT();
  const jobs = useJobs(ids);
  if (!jobs) return <div className="shimmer h-40 rounded-[var(--radius-tile)] border border-line" aria-label={t("saathi.blocks.loading")} />;
  const real = jobs.filter((j): j is PublicJob => !!j);
  if (!real.length) return <p className="text-sm text-muted">{t("saathi.blocks.gone")}</p>;
  return (
    <div>
      <BlockTitle>{t("saathi.blocks.jobs")}</BlockTitle>
      <div className="grid grid-cols-1 gap-2.5 @[22rem]:grid-cols-2">
        {real.map((j, i) => (
          <JobTile key={j.id} job={j} compact index={i} />
        ))}
      </div>
    </div>
  );
}

function CompareBlock({ ids }: { ids: string[] }) {
  const { t, pick, locale } = useT();
  const jobs = useJobs(ids)?.filter((j): j is PublicJob => !!j);
  if (!jobs) return <div className="shimmer h-32 rounded-2xl border border-line" />;
  const rows: [string, (j: PublicJob) => React.ReactNode][] = [
    [t("saathi.blocks.pay"), (j) => `${formatPayRange(j.payMin, j.payMax, locale)} ${t(`common.pay.${j.payPeriod}`)}`],
    [t("saathi.blocks.place"), (j) => pick(townById(j.townId)?.name)],
    [t("saathi.blocks.hours"), (j) => formatShift(j.shift, locale)],
    [t("saathi.blocks.type"), (j) => t(`common.jobType.${j.type}`)],
    [t("saathi.blocks.training_row"), (j) => t(`common.training.${j.training}`)],
    [t("saathi.blocks.trust"), (j) => <VerificationBadge verified={j.verified} compact />],
  ];
  return (
    <div>
      <BlockTitle>{t("saathi.blocks.compare")}</BlockTitle>
      <div className="glass overflow-x-auto rounded-2xl thin-scroll">
        <table className="w-full min-w-[18rem] text-left text-[0.8rem]">
          <thead>
            <tr className="border-b border-line">
              <th className="p-2.5" />
              {jobs.map((j) => (
                <th key={j.id} className="p-2.5 font-medium">
                  <Link href={`/jobs/${j.id}`} className="hover:text-gold">
                    {j.title ? pick(j.title) : t(`common.jobCategories.${j.category}`)}
                  </Link>
                  <div className="text-[0.7rem] font-normal text-subtle">{j.employer.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label} className="border-b border-line/60 last:border-0">
                <td className="p-2.5 text-subtle">{label}</td>
                {jobs.map((j) => (
                  <td key={j.id} className="p-2.5 align-top">{fn(j)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChipsBlock({ options, onChip, disabled }: { options: { label: string; value: string }[]; onChip: (label: string, value: string) => void; disabled?: boolean }) {
  const fb = useFeedback();
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((o, i) => (
        <motion.button
          key={o.label + i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          whileTap={{ scale: 0.96 }}
          disabled={disabled}
          onClick={() => {
            fb.tap();
            onChip(o.label, o.value);
          }}
          className="glass min-h-12 rounded-2xl px-4 text-[0.9rem] text-fg transition-colors hover:border-line-strong hover:bg-glass-2 disabled:opacity-40"
        >
          {o.label}
        </motion.button>
      ))}
    </div>
  );
}

function SkillsBlock({ skills, onChip }: { skills: string[]; onChip: (label: string, value: string) => void }) {
  const { t } = useT();
  return (
    <div>
      <BlockTitle>{t("saathi.blocks.skills")}</BlockTitle>
      <div className="grid grid-cols-2 gap-2 @[22rem]:grid-cols-3">
        {skills.map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChip(t(`common.skills.${s}`), `learn:${s}`)}
            className="glass gold-edge flex aspect-[5/4] flex-col justify-between rounded-2xl p-3 text-left hover:bg-glass-2"
          >
            <span className="grid size-9 place-items-center rounded-xl border border-line text-gold">
              <Icon name={ICON_FOR_SKILL[s] ?? "BookOpen"} className="size-4.5" />
            </span>
            <span className="text-[0.85rem] leading-tight">{t(`common.skills.${s}`)}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function TrainingBlock({ ids }: { ids: string[] }) {
  const { t, pick, locale } = useT();
  const [items, setItems] = useState<TrainingProgramme[] | null>(null);
  useEffect(() => {
    trainingCache ??= fetch("/api/training").then((r) => r.json()).then((d) => d.items as TrainingProgramme[]).catch(() => []);
    trainingCache.then((all) => setItems(all.filter((x) => ids.includes(x.id))));
  }, [ids]);
  if (!items) return <div className="shimmer h-20 rounded-2xl border border-line" />;
  return (
    <div>
      <BlockTitle>{t("saathi.blocks.training")}</BlockTitle>
      <div className="space-y-2">
        {items.map((x) => (
          <div key={x.id} className="glass flex items-start gap-3 rounded-2xl p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-gold">
              <Icon name="GraduationCap" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[0.9rem] font-medium leading-snug">{pick(x.name)}</div>
              <div className="mt-0.5 text-xs text-muted">
                {x.provider} · {pick(townById(x.townId)?.name)}
              </div>
              <div className="mt-1.5 text-xs text-subtle">
                {t("saathi.blocks.weeks", { n: x.durationWeeks })} · {x.fee ? t("saathi.blocks.fee", { fee: formatRupees(x.fee, locale) }) : t("saathi.blocks.free")}
              </div>
            </div>
            <ListenButton text={`${pick(x.name)}. ${x.provider}. ${pick(x.description)}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StationsBlock({ ids }: { ids: string[] }) {
  const { t, pick } = useT();
  const [items, setItems] = useState<Station[] | null>(null);
  useEffect(() => {
    stationCache ??= fetch("/api/stations").then((r) => r.json()).then((d) => d.items as Station[]).catch(() => []);
    stationCache.then((all) => setItems(all.filter((x) => ids.includes(x.id))));
  }, [ids]);
  if (!items) return <div className="shimmer h-20 rounded-2xl border border-line" />;
  return (
    <div>
      <BlockTitle>{t("saathi.blocks.stations")}</BlockTitle>
      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="glass flex items-start gap-3 rounded-2xl p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-gold">
              <Icon name="Monitor" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[0.9rem] font-medium leading-snug">{pick(s.name)}</div>
              <div className="mt-0.5 text-xs text-muted">{pick(s.address)}</div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-subtle">
                <Icon name="Clock" className="size-3" /> {s.hours}
                {s.hasPrinter && (
                  <>
                    <span>·</span>
                    <Icon name="Printer" className="size-3" /> {t("saathi.blocks.printer")}
                  </>
                )}
              </div>
            </div>
            <ListenButton text={`${pick(s.name)}. ${pick(s.address)}. ${s.hours}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function NavBlock({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-12 items-center gap-2.5 rounded-2xl border border-gold/35 bg-gold/10 px-4 text-[0.9rem] text-gold transition-colors hover:bg-gold/15"
    >
      {label}
      <Icon name="ArrowRight" className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function Block({ block, onChip, interactive }: { block: SaathiBlock; onChip: (label: string, value: string) => void; interactive: boolean }) {
  switch (block.kind) {
    case "jobs":
      return <JobsBlock ids={block.jobIds} />;
    case "compare":
      return <CompareBlock ids={block.jobIds} />;
    case "chips":
      return interactive ? <ChipsBlock options={block.options} onChip={onChip} /> : null;
    case "skills":
      return <SkillsBlock skills={block.skills} onChip={onChip} />;
    case "training":
      return <TrainingBlock ids={block.ids} />;
    case "stations":
      return <StationsBlock ids={block.ids} />;
    case "nav":
      return <NavBlock href={block.href} label={block.label} />;
    default:
      return null;
  }
}

export function Blocks({ blocks, onChip, interactive, className }: { blocks: SaathiBlock[]; onChip: (label: string, value: string) => void; interactive: boolean; className?: string }) {
  if (!blocks.length) return null;
  // Chips always render last so they sit at the bottom of the turn.
  const ordered = [...blocks.filter((b) => b.kind !== "chips"), ...blocks.filter((b) => b.kind === "chips")];
  return (
    <div className={cn("mt-3 space-y-3", className)}>
      {ordered.map((b, i) => (
        <Block key={i} block={b} onChip={onChip} interactive={interactive} />
      ))}
    </div>
  );
}
