"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useAdmin, type Snapshot } from "../../_components/AdminProvider";
import { AdminHeader, Card, SmallButton, StatusPill, Table } from "../../_components/ui";
import { useLabels } from "../../_components/labels";
import { JobForm } from "../../_components/JobForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pill, VerificationBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatPayRange } from "@/lib/format";
import { cn } from "@/components/ui/cn";

type AdminJob = Snapshot["jobs"][number];
const FILTERS = ["all", "pending", "approved", "rejected", "archived"] as const;

export default function JobsPage() {
  const { t, locale } = useT();
  const { data, post, isAdmin } = useAdmin();
  const L = useLabels();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [editing, setEditing] = useState<AdminJob | "new" | null>(null);
  if (!data) return null;

  const rows = data.jobs.filter((j) => filter === "all" || j.status === filter);
  const empName = (id: string) => data.employers.find((e) => e.id === id)?.name ?? id;
  const setStatus = (id: string, status: string) => post("/api/admin/jobs", { action: "status", id, status });

  return (
    <>
      <AdminHeader
        title={t("admin.jobs.title")}
        lede={t("admin.jobs.lede")}
        actions={
          <Button variant="gold" icon="Plus" onClick={() => setEditing("new")}>
            {t("admin.jobs.add")}
          </Button>
        }
      />
      <Card
        right={
          <div className="flex gap-1" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn("rounded-full px-3 py-1.5 text-xs", filter === f ? "bg-glass-2 text-gold" : "text-muted hover:text-fg")}
              >
                {f === "all" ? t("admin.common.all") : t(`admin.status.${f}`)}{" "}
                <span className="font-mono text-subtle">{f === "all" ? data.jobs.length : data.jobs.filter((j) => j.status === f).length}</span>
              </button>
            ))}
          </div>
        }
      >
        <Table head={[t("admin.jobs.title").replace(/\*/g, ""), t("admin.jobs.pay"), t("admin.common.status"), t("admin.jobs.publicPreview"), t("admin.common.actions")]} empty={!rows.length}>
          {rows.map((j) => (
            <tr key={j.id}>
              <td>
                <div className="font-medium">{L.jobTitle(j)}</div>
                <div className="text-xs text-subtle">
                  {empName(j.employerId)} · {L.town(j.townId)} · {t(`common.jobType.${j.type}`)}
                </div>
                {j.flags.filter((f) => f !== "employer_unverified").length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {j.flags
                      .filter((f) => f !== "employer_unverified")
                      .map((f) => (
                        <Pill key={f} tone="danger" className="!py-0.5 !text-[0.65rem]">
                          <Icon name="ShieldAlert" className="size-3" /> {t(`admin.review.flags.${f}`)}
                        </Pill>
                      ))}
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap text-muted">
                {formatPayRange(j.payMin, j.payMax, locale)} <span className="text-subtle">{t(`common.pay.${j.payPeriod}`)}</span>
              </td>
              <td>
                <StatusPill status={j.status} />
                {j.approvedBy && <div className="mt-1 text-[0.7rem] text-subtle">{t("admin.common.by", { who: j.approvedBy })}</div>}
              </td>
              <td title={t("admin.jobs.previewHint")}>
                {j.preview.visible ? <VerificationBadge verified={j.preview.verified} compact /> : <span className="text-xs text-subtle">{t("admin.jobs.hidden")}</span>}
                {!j.preview.employerVerified && <div className="mt-1 text-[0.7rem] text-subtle">{t("admin.review.flags.employer_unverified")}</div>}
              </td>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  {isAdmin && j.status !== "approved" && (
                    <SmallButton tone="ok" onClick={() => setStatus(j.id, "approved")}>
                      {t("admin.jobs.approve")}
                    </SmallButton>
                  )}
                  {isAdmin && j.status === "pending" && (
                    <SmallButton tone="danger" onClick={() => setStatus(j.id, "rejected")}>
                      {t("admin.jobs.reject")}
                    </SmallButton>
                  )}
                  {isAdmin && j.status === "approved" && (
                    <SmallButton onClick={() => setStatus(j.id, "pending")}>{t("admin.jobs.requeue")}</SmallButton>
                  )}
                  {isAdmin && j.status !== "archived" && (
                    <SmallButton tone="danger" onClick={() => setStatus(j.id, "archived")}>
                      {t("admin.jobs.archive")}
                    </SmallButton>
                  )}
                  {isAdmin && (
                    <SmallButton onClick={() => setEditing(j)}>
                      <Icon name="FileText" className="size-3.5" /> {t("admin.common.edit")}
                    </SmallButton>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
        <p className="mt-4 text-xs text-subtle">{t("admin.jobs.previewHint")}</p>
      </Card>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? t("admin.jobs.add") : t("admin.jobs.editTitle")} wide>
        {editing && <JobForm job={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
