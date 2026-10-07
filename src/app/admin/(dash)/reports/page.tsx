"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { useAdmin } from "../../_components/AdminProvider";
import { AdminHeader, Card, SmallButton, StatusPill, Table } from "../../_components/ui";
import { useLabels } from "../../_components/labels";
import { cn } from "@/components/ui/cn";
import { can } from "@/lib/auth/permissions";

const FILTERS = ["open", "resolved", "dismissed"] as const;

export default function ReportsPage() {
  const { t } = useT();
  const { data, post } = useAdmin();
  const L = useLabels();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("open");
  if (!data) return null;
  const rows = data.reports.filter((r) => r.status === filter).slice().reverse();
  const canArchive = can(data.session.role, "listing.archive");

  return (
    <>
      <AdminHeader title={t("admin.reports.title")} lede={t("admin.reports.lede")} />
      {data.session.role === "centre_worker" && <p className="mb-4 text-xs text-subtle">{t("admin.reports.stationScope")}</p>}
      <Card
        right={
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={cn("rounded-full px-3 py-1.5 text-xs", filter === f ? "bg-glass-2 text-gold" : "text-muted hover:text-fg")}>
                {t(`admin.status.${f}`)} <span className="font-mono text-subtle">{data.reports.filter((r) => r.status === f).length}</span>
              </button>
            ))}
          </div>
        }
      >
        <Table head={[t("admin.reports.reason"), t("admin.reports.listing"), t("admin.common.createdAt"), t("admin.common.status"), t("admin.common.actions")]} empty={!rows.length}>
          {rows.map((r) => {
            const job = data.jobs.find((j) => j.id === r.jobId);
            return (
              <tr key={r.id}>
                <td>
                  <div className="font-medium">{t(`admin.reports.reasons.${r.reason}`)}</div>
                  {r.note && <div className="mt-1 max-w-sm text-xs text-muted">“{r.note}”</div>}
                  <div className="mt-1 font-mono text-[0.65rem] text-subtle">{r.id}</div>
                </td>
                <td>
                  {job ? (
                    <Link href={`/jobs/${job.id}`} className="text-gold hover:underline" target="_blank">
                      {L.jobTitle(job)}
                    </Link>
                  ) : (
                    r.jobId
                  )}
                  {job && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
                      {L.town(job.townId)} · <StatusPill status={job.status} />
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap text-muted">{L.dateTime(r.createdAt)}</td>
                <td>
                  <StatusPill status={r.status} />
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {r.status === "open" ? (
                      <>
                        <SmallButton tone="ok" onClick={() => post("/api/admin/reports", { action: "status", id: r.id, status: "resolved" })}>
                          {t("admin.reports.resolve")}
                        </SmallButton>
                        <SmallButton onClick={() => post("/api/admin/reports", { action: "status", id: r.id, status: "dismissed" })}>{t("admin.reports.dismiss")}</SmallButton>
                      </>
                    ) : (
                      <SmallButton onClick={() => post("/api/admin/reports", { action: "status", id: r.id, status: "open" })}>{t("admin.reports.reopen")}</SmallButton>
                    )}
                    {canArchive && job?.status === "approved" && (
                      <SmallButton tone="danger" onClick={() => post("/api/admin/reports", { action: "archive", id: r.id })}>
                        {t("admin.reports.archiveListing")}
                      </SmallButton>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
