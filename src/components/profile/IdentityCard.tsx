"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { ProgressRing } from "@/components/learn/ProgressRing";
import { profileCompleteness } from "./completeness";
import { formatDate } from "@/lib/format";
import { townById } from "@/lib/geo/towns";

/** The premium identity card — the on-screen twin of the printed KAABIL Parchi. */
export function IdentityCard({ onEditName }: { onEditName: () => void }) {
  const { t, pick, locale } = useT();
  const p = useApp((s) => s.profile);
  const pct = profileCompleteness(p);
  const town = townById(p.townId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="@container relative overflow-hidden rounded-[1.75rem] border border-line-strong p-6 [perspective:1000px] sm:p-7"
      style={{ background: "linear-gradient(150deg, color-mix(in oklab, var(--gold) 14%, var(--bg-2)), var(--bg-2) 45%, var(--bg-3))" }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full border border-gold/15" aria-hidden />
      <div className="pointer-events-none absolute -right-6 -top-6 size-36 rounded-full border border-gold/10" aria-hidden />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-xl tracking-[0.2em]">
            KAAB<span className="italic text-gold">I</span>L
          </div>
          <div className="eyebrow mt-1">{t("profile.card.title")}</div>
        </div>
        <ProgressRing value={pct} size={52} label={t("profile.complete", { n: Math.round(pct * 100) })} />
      </div>

      <button onClick={onEditName} className="group relative mt-8 block text-left">
        <span className="font-display text-4xl leading-tight sm:text-[2.6rem]">
          {p.name || <span className="italic text-muted">{t("profile.noName")}</span>}
        </span>
        <Icon name="Plus" className="ml-2 inline size-4 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
      <div className="relative mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span>
          {t("profile.kaabilId")} <span className="font-mono tracking-wider text-fg">{p.kaabilId}</span>
        </span>
        {town && (
          <span className="inline-flex items-center gap-1">
            <Icon name="MapPin" className="size-3.5" /> {pick(town.name)}
          </span>
        )}
      </div>

      <div className="hairline relative my-6" />

      <div className="relative grid gap-6 @xl:grid-cols-2">
      <div>
        <div className="eyebrow mb-3">{t("profile.card.strengths")}</div>
        {p.strengths.length ? (
          <ul className="grid gap-2">
            {p.strengths.map((s, i) => (
              <motion.li key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-2.5">
                <Icon name="Star" className="size-4 text-gold" fill="currentColor" />
                <span className="font-display text-xl">{t(`common.strengths.${s}`)}</span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-subtle">{t("profile.empty.strengths")}</p>
        )}
      </div>

      {p.skills.length > 0 && (
        <div>
          <div className="eyebrow mb-2">{t("profile.card.skills")}</div>
          <p className="text-sm leading-relaxed">{p.skills.map((s) => t(`common.skills.${s}`)).join(" · ")}</p>
        </div>
      )}
      </div>

      {p.profileCompletedAt && (
        <div className="relative mt-6 text-xs text-subtle">{t("profile.card.since", { date: formatDate(p.profileCompletedAt, locale) })}</div>
      )}
    </motion.div>
  );
}
