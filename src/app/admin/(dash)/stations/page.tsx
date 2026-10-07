"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useAdmin, type Snapshot } from "../../_components/AdminProvider";
import { AdminHeader, Card, Field, Input, L10nField, Select, SmallButton, StatusPill, Table, type L10nValue } from "../../_components/ui";
import { useLabels } from "../../_components/labels";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { TOWNS } from "@/lib/geo/towns";

type S = Snapshot["stations"][number];
const KINDS = ["community_centre", "school", "ngo", "skill_centre", "public_service"] as const;

function blank(s?: S) {
  return {
    name: (s?.name ?? { en: "" }) as L10nValue,
    kind: s?.kind ?? "community_centre",
    townId: s?.townId ?? "pilani",
    address: (s?.address ?? { en: "" }) as L10nValue,
    hours: s?.hours ?? "10:00–17:00",
    hasPrinter: s?.hasPrinter ?? true,
    active: s?.active ?? true,
  };
}

export default function StationsPage() {
  const { t, pick } = useT();
  const { data, post, isAdmin } = useAdmin();
  const L = useLabels();
  const [editing, setEditing] = useState<S | "new" | null>(null);
  const [f, setF] = useState(blank());
  if (!data) return null;

  const open = (s: S | "new") => {
    setEditing(s);
    setF(blank(s === "new" ? undefined : s));
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await post("/api/admin/stations", { action: "upsert", id: editing === "new" ? null : editing?.id, data: f })) setEditing(null);
  };
  const toggleActive = (s: S) => post("/api/admin/stations", { action: "upsert", id: s.id, data: { ...blank(s), active: !s.active } });

  return (
    <>
      <AdminHeader
        title={t("admin.stations.title")}
        lede={t("admin.stations.lede")}
        actions={
          isAdmin && (
            <Button variant="gold" icon="Plus" onClick={() => open("new")}>
              {t("admin.stations.add")}
            </Button>
          )
        }
      />
      <Card>
        <Table head={[t("admin.stations.name"), t("admin.stations.kind"), t("admin.stations.hours"), t("admin.common.status"), t("admin.common.actions")]} empty={!data.stations.length}>
          {data.stations.map((s) => (
            <tr key={s.id}>
              <td>
                <div className="font-medium">{pick(s.name)}</div>
                <div className="text-xs text-subtle">
                  {pick(s.address)} · {L.town(s.townId)}
                </div>
              </td>
              <td className="text-muted">
                {t(`admin.stations.kinds.${s.kind}`)}
                {s.hasPrinter && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-subtle">
                    <Icon name="Printer" className="size-3" /> {t("admin.stations.printer")}
                  </div>
                )}
              </td>
              <td className="font-mono text-xs text-muted">{s.hours}</td>
              <td>
                <StatusPill status={s.active ? "approved" : "archived"} />
              </td>
              <td>
                {isAdmin && (
                  <div className="flex gap-1.5">
                    <SmallButton onClick={() => open(s)}>{t("admin.common.edit")}</SmallButton>
                    <SmallButton tone={s.active ? "danger" : "ok"} onClick={() => toggleActive(s)}>
                      {s.active ? t("admin.jobs.archive") : t("admin.stations.active")}
                    </SmallButton>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? t("admin.stations.add") : t("admin.common.edit")} wide>
        <form onSubmit={save} className="space-y-4">
          <L10nField label={t("admin.stations.name")} required value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("admin.stations.kind")}>
              <Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as S["kind"] })} options={KINDS.map((k) => ({ value: k, label: t(`admin.stations.kinds.${k}`) }))} />
            </Field>
            <Field label={t("admin.common.town")}>
              <Select value={f.townId} onChange={(e) => setF({ ...f, townId: e.target.value })} options={TOWNS.map((x) => ({ value: x.id, label: pick(x.name) }))} />
            </Field>
            <Field label={t("admin.stations.hours")}>
              <Input required value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} />
            </Field>
          </div>
          <L10nField label={t("admin.stations.address")} required value={f.address} onChange={(v) => setF({ ...f, address: v })} />
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-[var(--gold)]" checked={f.hasPrinter} onChange={(e) => setF({ ...f, hasPrinter: e.target.checked })} /> {t("admin.stations.printer")}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-[var(--gold)]" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> {t("admin.stations.active")}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <SmallButton type="button" onClick={() => setEditing(null)}>
              {t("admin.common.cancel")}
            </SmallButton>
            <SmallButton type="submit" tone="gold">
              {t("admin.common.save")}
            </SmallButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
