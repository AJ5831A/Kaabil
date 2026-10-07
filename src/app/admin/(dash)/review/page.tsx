"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useAdmin, type Snapshot } from "../../_components/AdminProvider";
import { AdminHeader, Card, SmallButton } from "../../_components/ui";
import { VerifyModal } from "../../_components/VerifyModal";
import { useLabels } from "../../_components/labels";
import { Pill, VerificationBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatPayRange, formatShift } from "@/lib/format";

type AdminJob = Snapshot["jobs"][number];

function JobRow({ j }: { j: AdminJob }) {
  const { t, pick, locale } = useT();
  const { data, post, isAdmin } = useAdmin();
  const L = useLabels();
  const empName = data?.employers.find((e) => e.id === j.employerId)?.name ?? j.employerId;
  return (
    <li className="rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium">{L.jobTitle(j)}</div>
          <div className="text-sm text-muted">
            {empName} · {L.town(j.townId)} · {formatPayRange(j.payMin, j.payMax, locale)} {t(`common.pay.${j.payPeriod}`)} · {formatShift(j.shift, locale)}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-fg/90">{pick(j.description)}</p>
          <p className="mt-1 max-w-2xl text-xs text-subtle">
            {pick(j.joining)} · {pick(j.contactNote)}
          </p>
          {j.flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {j.flags.map((f) => (
                <Pill key={f} tone={f === "employer_unverified" ? "neutral" : "danger"}>
                  <Icon name="ShieldAlert" className="size-3" /> {t(`admin.review.flags.${f}`)}
                </Pill>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-xs text-subtle">
            {t("admin.jobs.publicPreview")}: <VerificationBadge verified={j.preview.employerVerified} compact />
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              {j.status !== "approved" && (
                <SmallButton tone="ok" onClick={() => post("/api/admin/jobs", { action: "status", id: j.id, status: "approved" })}>
                  <Icon name="Check" className="size-3.5" /> {t("admin.review.approve")}
                </SmallButton>
              )}
              <SmallButton tone="danger" onClick={() => post("/api/admin/jobs", { action: "status", id: j.id, status: j.status === "approved" ? "archived" : "rejected" })}>
                {j.status === "approved" ? t("admin.jobs.archive") : t("admin.review.reject")}
              </SmallButton>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export default function ReviewQueue() {
  const { t, pick } = useT();
  const { data, post, isAdmin } = useAdmin();
  const L = useLabels();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  if (!data) return null;

  const pendingEmployers = data.employers.filter((e) => e.verification.status === "pending" || e.verification.status === "unverified");
  const pendingJobs = data.jobs.filter((j) => j.status === "pending");
  const flagged = data.jobs.filter((j) => j.status === "approved" && j.flags.some((f) => f !== "employer_unverified"));
  const clear = !pendingEmployers.length && !pendingJobs.length && !flagged.length;

  return (
    <>
      <AdminHeader title={t("admin.review.title")} lede={t("admin.review.lede")} />
      {!isAdmin && <p className="mb-5 rounded-xl bg-warn-bg px-4 py-2.5 text-sm text-warn">{t("admin.common.adminOnly")}</p>}
      {clear && (
        <Card>
          <p className="py-8 text-center text-muted">{t("admin.review.clear")}</p>
        </Card>
      )}
      <div className="space-y-5">
        {pendingEmployers.length > 0 && (
          <Card title={t("admin.review.pendingEmployers")}>
            <ul className="space-y-3">
              {pendingEmployers.map((e) => (
                <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line p-4">
                  <div>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-sm text-muted">
                      {pick(e.sector)} · {L.town(e.townId)} · {e.contact.phone ?? "—"}
                    </div>
                    <p className="mt-1 text-sm text-fg/90">{pick(e.about)}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <SmallButton
                        tone="ok"
                        onClick={() => {
                          setVerifying(e.id);
                          setNotes("");
                        }}
                      >
                        <Icon name="BadgeCheck" className="size-3.5" /> {t("admin.review.verify")}
                      </SmallButton>
                      <SmallButton tone="danger" onClick={() => post("/api/admin/employers", { action: "decide", id: e.id, decision: "rejected" })}>
                        {t("admin.review.reject")}
                      </SmallButton>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
        {pendingJobs.length > 0 && (
          <Card title={t("admin.review.pendingJobs")}>
            <ul className="space-y-3">
              {pendingJobs.map((j) => (
                <JobRow key={j.id} j={j} />
              ))}
            </ul>
          </Card>
        )}
        {flagged.length > 0 && (
          <Card title={t("admin.review.flagged")}>
            <ul className="space-y-3">
              {flagged.map((j) => (
                <JobRow key={j.id} j={j} />
              ))}
            </ul>
          </Card>
        )}
      </div>
      <VerifyModal
        open={!!verifying}
        notes={notes}
        setNotes={setNotes}
        onClose={() => setVerifying(null)}
        onConfirm={async () => {
          await post("/api/admin/employers", { action: "decide", id: verifying, decision: "verified", notes });
          setVerifying(null);
        }}
      />
    </>
  );
}
