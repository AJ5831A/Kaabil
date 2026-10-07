"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useT } from "@/lib/i18n/client";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { ListenButton } from "@/components/ui/ListenButton";
import { decodeProfile } from "@/components/parchi/profileCode";
import { useProfileLabels } from "@/components/parchi/Slips";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid gap-1 border-t border-line py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
      <dt className="eyebrow !text-[0.62rem] sm:pt-1">{label}</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  );
}

/** Read-only view of a profile scanned from a KAABIL Parchi QR code. */
export default function PublicProfilePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { t, locale } = useT();
  const L = useProfileLabels();
  const data = useMemo(() => decodeProfile(decodeURIComponent(code)), [code]);

  if (!data)
    return (
      <div className="glass gold-edge rounded-[var(--radius-tile)] p-8 text-center">
        <Icon name="CircleAlert" className="mx-auto size-8 text-warn" />
        <p className="mt-4">{t("parchi.public.invalid")}</p>
        <Link href="/" className="mt-6 inline-block text-gold underline underline-offset-4">{t("parchi.public.visit")}</Link>
      </div>
    );

  const join = (xs?: string[]) => (xs && xs.length ? xs.join(", ") : undefined);
  const pref = [L.hours(data.h), L.jobType(data.jt)].filter(Boolean).join(" · ") || undefined;
  const speech = [data.n, join(data.s?.map(L.skill)), join(data.st?.map(L.strength))].filter(Boolean).join(". ");

  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <div className="mb-8 text-center">
        <div className="font-display text-4xl tracking-[0.16em]">KAAB<span className="italic text-gold">I</span>L</div>
        <div className="mt-1 font-display italic text-muted">Turning Ability into Opportunity</div>
      </div>
      <div className="glass-strong gold-edge rounded-[1.75rem] p-7 sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">{t("parchi.public.eyebrow")}</div>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">{data.n || <span className="font-mono text-3xl">{data.id}</span>}</h1>
            <div className="mt-2 font-mono text-sm text-gold">{data.id}</div>
          </div>
          <ListenButton size="md" text={speech} />
        </div>
        {data.st?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {data.st.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-sm text-gold">
                <Icon name="Star" className="size-3.5" /> {L.strength(s)}
              </span>
            ))}
          </div>
        ) : null}
        <dl className="mt-6">
          <Row label={t("parchi.slip.skills")} value={join(data.s?.map(L.skill))} />
          <Row label={t("parchi.slip.learning")} value={join(data.l?.map(L.skill))} />
          <Row label={t("parchi.slip.experience")} value={data.e} />
          <Row label={t("parchi.slip.preferredWork")} value={join(data.w?.map(L.category))} />
          <Row label={t("parchi.slip.location")} value={L.town(data.t) || undefined} />
          <Row label={t("parchi.slip.hours")} value={pref} />
          <Row label={t("parchi.slip.languages")} value={join(data.lg?.map(L.language))} />
          <Row label={t("parchi.slip.training")} value={join(data.tr?.map(L.skill))} />
          <Row label={t("parchi.slip.issued")} value={formatDate(data.d, locale)} />
        </dl>
        <p className="mt-6 flex gap-2.5 text-sm text-muted">
          <Icon name="ShieldCheck" className="mt-0.5 size-4 shrink-0 text-gold" />
          {t("parchi.public.note")} {t("parchi.slip.selfReported")}
        </p>
      </div>
      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-gold underline decoration-line-strong underline-offset-4">{t("parchi.public.visit")}</Link>
      </div>
    </motion.article>
  );
}
