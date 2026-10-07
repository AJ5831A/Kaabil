"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { categoryMeta } from "@/lib/taxonomy";
import type { PublicJob } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/Button";
import { VerificationBadge } from "@/components/ui/Badge";
import { ParchiPrinter } from "@/components/parchi/ParchiPrinter";
import { ParchiTabs } from "@/components/parchi/ParchiTabs";
import { OptionsSlip } from "@/components/parchi/Slips";
import { useSerial } from "@/components/parchi/useParchi";
import { useJobsByIds } from "@/components/jobs/useJobs";
import { useJobText } from "@/components/jobs/useJobText";

async function registerAll(jobs: PublicJob[]) {
  const st = useApp.getState();
  for (const j of jobs) {
    if (st.interested[j.id]) continue;
    const r = await fetch("/api/interest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: j.id, kaabilId: st.profile.kaabilId }) });
    if (!r.ok) return false;
    st.setInterested(j.id, ((await r.json()) as { id: string }).id);
  }
  return true;
}

export default function OptionsParchiPage() {
  const { t } = useT();
  const ids = useApp((s) => s.parchiJobs);
  const toggle = useApp((s) => s.toggleParchiJob);
  const clear = useApp((s) => s.clearParchiJobs);
  const interested = useApp((s) => s.interested);
  const kaabilId = useApp((s) => s.profile.kaabilId);
  const { items, loading } = useJobsByIds(ids);
  const { serial, issue, assisted, stationId } = useSerial();
  const text = useJobText();

  return (
    <div>
      <PageHeader eyebrow={t("parchi.options.eyebrow")} title={t("parchi.options.title")} lede={t("parchi.options.lede")} />
      <ParchiTabs />
      {loading ? (
        <div className="glass h-96 rounded-[var(--radius-tile)]" aria-busy />
      ) : !items.length ? (
        <div className="glass gold-edge rounded-[var(--radius-tile)] p-8">
          <h2 className="font-display text-3xl">{t("parchi.options.empty")}</h2>
          <p className="mt-2 text-muted">{t("parchi.options.emptyBody")}</p>
          <LinkButton href="/jobs" variant="gold" icon="Briefcase" className="mt-6">{t("parchi.options.browse")}</LinkButton>
        </div>
      ) : (
        <ParchiPrinter
          type="options"
          prepare={async () => (await registerAll(items)) && issue({ type: "options", jobIds: items.map((j) => j.id) })}
          extra={
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">{t("parchi.options.manage")}</span>
                <button onClick={clear} className="text-xs text-muted hover:text-danger">{t("parchi.options.clear")}</button>
              </div>
              <ul className="space-y-2">
                {items.map((j) => (
                  <li key={j.id} className="glass flex items-center gap-3 rounded-2xl p-3">
                    <Icon name={categoryMeta(j.category).icon} className="size-5 shrink-0 text-gold" />
                    <Link href={`/jobs/${j.id}`} className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{text(j).title}</div>
                      <VerificationBadge verified={j.verified} compact />
                    </Link>
                    <button onClick={() => toggle(j.id)} aria-label={t("common.actions.remove")} className="grid size-9 place-items-center rounded-full border border-line text-muted hover:text-danger">
                      <Icon name="Trash2" className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <LinkButton href="/jobs" variant="ghost" icon="Plus" className="mt-3 w-full">{t("parchi.options.browse")}</LinkButton>
            </div>
          }
        >
          {(paper) => <OptionsSlip paper={paper} jobs={items} appIds={interested} serial={serial} kaabilId={kaabilId} assisted={assisted} stationId={stationId} />}
        </ParchiPrinter>
      )}
    </div>
  );
}
