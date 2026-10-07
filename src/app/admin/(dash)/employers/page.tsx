"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useAdmin } from "../../_components/AdminProvider";
import { AdminHeader, Card, Field, Input, L10nField, Select, SmallButton, StatusPill, Table, type L10nValue } from "../../_components/ui";
import { useLabels } from "../../_components/labels";
import { VerifyModal } from "../../_components/VerifyModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TOWNS } from "@/lib/geo/towns";

const blank = { name: "", townId: "pilani", sector: { en: "" } as L10nValue, about: { en: "" } as L10nValue, phone: "", address: { en: "" } as L10nValue };

export default function EmployersPage() {
  const { t, pick } = useT();
  const { data, post, isAdmin } = useAdmin();
  const L = useLabels();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [q, setQ] = useState("");
  if (!data) return null;

  const rows = data.employers.filter((e) => !q || e.name.toLowerCase().includes(q.toLowerCase()));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const ok = await post("/api/admin/employers", {
      action: "create",
      data: { name: form.name, townId: form.townId, sector: form.sector, about: form.about, contact: { phone: form.phone || undefined, address: form.address } },
    });
    if (ok) {
      setOpen(false);
      setForm(blank);
    }
  }

  return (
    <>
      <AdminHeader
        title={t("admin.employers.title")}
        lede={t("admin.employers.lede")}
        actions={
          <Button variant="gold" icon="Plus" onClick={() => setOpen(true)}>
            {t("admin.employers.add")}
          </Button>
        }
      />
      <Card right={<Input className="!w-56" placeholder={t("admin.common.search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("admin.common.search")} />}>
        <Table head={[t("admin.employers.name"), t("admin.common.town"), t("admin.employers.verification"), t("admin.common.actions")]} empty={!rows.length}>
          {rows.map((e) => {
            const nJobs = data.jobs.filter((j) => j.employerId === e.id).length;
            return (
              <tr key={e.id}>
                <td>
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-subtle">
                    {pick(e.sector)} · {t("admin.employers.jobs", { n: nJobs })}
                  </div>
                </td>
                <td className="text-muted">{L.town(e.townId)}</td>
                <td>
                  <StatusPill status={e.verification.status} />
                  {e.verification.verifiedBy && (
                    <div className="mt-1 text-[0.7rem] text-subtle">{t("admin.employers.verifiedBy", { who: e.verification.verifiedBy, date: L.date(e.verification.verifiedAt) })}</div>
                  )}
                  {e.verification.notes && <div className="mt-0.5 max-w-xs text-[0.7rem] italic text-subtle">“{e.verification.notes}”</div>}
                </td>
                <td>
                  {isAdmin ? (
                    <div className="flex flex-wrap gap-1.5">
                      {e.verification.status !== "verified" && (
                        <SmallButton
                          tone="ok"
                          onClick={() => {
                            setVerifying(e.id);
                            setNotes("");
                          }}
                        >
                          {t("admin.review.verify")}
                        </SmallButton>
                      )}
                      {e.verification.status !== "rejected" && (
                        <SmallButton tone="danger" onClick={() => post("/api/admin/employers", { action: "decide", id: e.id, decision: "rejected" })}>
                          {t("admin.review.reject")}
                        </SmallButton>
                      )}
                      {e.verification.status === "verified" && (
                        <SmallButton onClick={() => post("/api/admin/employers", { action: "decide", id: e.id, decision: "pending" })}>{t("admin.employers.unverify")}</SmallButton>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-subtle">{t("admin.common.adminOnly")}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t("admin.employers.add")} wide>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("admin.employers.name")}>
              <Input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t("admin.common.town")}>
              <Select value={form.townId} onChange={(e) => setForm({ ...form, townId: e.target.value })} options={TOWNS.map((x) => ({ value: x.id, label: pick(x.name) }))} />
            </Field>
          </div>
          <L10nField label={t("admin.employers.sector")} required value={form.sector} onChange={(v) => setForm({ ...form, sector: v })} />
          <L10nField label={t("admin.employers.about")} required multiline value={form.about} onChange={(v) => setForm({ ...form, about: v })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("admin.employers.phone")}>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <L10nField label={t("admin.employers.address")} required value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <p className="text-xs text-subtle">{t("admin.employers.lede")}</p>
          <div className="flex justify-end gap-2">
            <SmallButton type="button" onClick={() => setOpen(false)}>
              {t("admin.common.cancel")}
            </SmallButton>
            <SmallButton type="submit" tone="gold">
              {t("admin.common.save")}
            </SmallButton>
          </div>
        </form>
      </Modal>
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
