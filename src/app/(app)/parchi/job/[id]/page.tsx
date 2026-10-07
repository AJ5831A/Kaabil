"use client";

import { use } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/Button";
import { ParchiPrinter } from "@/components/parchi/ParchiPrinter";
import { JobSlip } from "@/components/parchi/Slips";
import { useSerial } from "@/components/parchi/useParchi";
import { useJob } from "@/components/jobs/useJobs";
import { useInterest } from "@/components/jobs/useInterest";

export default function JobParchiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useT();
  const { job, loading } = useJob(id);
  const { appId, register } = useInterest(id);
  const { serial, issue, assisted, stationId } = useSerial();

  return (
    <div>
      <Link href={`/jobs/${id}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-gold">
        <Icon name="ArrowLeft" className="size-4" /> {t("common.actions.back")}
      </Link>
      <PageHeader eyebrow={t("parchi.job.eyebrow")} title={t("parchi.job.title")} lede={t("parchi.job.lede")} />
      {loading ? (
        <div className="glass h-96 rounded-[var(--radius-tile)]" aria-busy />
      ) : !job ? (
        <div className="glass gold-edge rounded-[var(--radius-tile)] p-8">
          <h2 className="font-display text-3xl">{t("jobs.detail.notFound")}</h2>
          <LinkButton href="/jobs" variant="gold" className="mt-6" icon="Briefcase">{t("jobs.detail.back")}</LinkButton>
        </div>
      ) : (
        <ParchiPrinter
          type="job"
          prepare={async () => {
            const a = appId ?? (await register());
            if (!a) return false;
            return issue({ type: "job", jobIds: [id] });
          }}
        >
          {(paper) => <JobSlip paper={paper} job={job} appId={appId} serial={serial} assisted={assisted} stationId={stationId} />}
        </ParchiPrinter>
      )}
    </div>
  );
}
