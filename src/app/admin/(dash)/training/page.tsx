"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useAdmin, type Snapshot } from "../../_components/AdminProvider";
import { AdminHeader, Card, Field, Input, L10nField, Select, SmallButton, StatusPill, Table, type L10nValue } from "../../_components/ui";
import { useLabels } from "../../_components/labels";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TOWNS } from "@/lib/geo/towns";
import { SKILLS } from "@/lib/taxonomy";

type T = Snapshot["training"][number];
const MODES = ["in_person", "station", "online"] as const;

function blank(x?: T) {
  return {
    name: (x?.name ?? { en: "" }) as L10nValue,
    provider: x?.provider ?? "",
    skill: x?.skill ?? "sewing",
    townId: x?.townId ?? "pilani",
    durationWeeks: x?.durationWeeks ?? 4,
    fee: x?.fee ?? 0,
    mode: x?.mode ?? "in_person",
    description: (x?.description ?? { en: "" }) as L10nValue,
  };
}

export default function TrainingPage() {
  const { t, pick } = useT();
  const { data, post, isAdmin } = useAdmin();
  const L = useLabels();
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [f, setF] = useState(blank());
  if (!data) return null;

  const open = (x: T | "new") => {
    setEditing(x);
    setF(blank(x === "new" ? undefined : x));
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const ok = await post("/api/admin/training", { action: "upsert", id: editing === "new" ? null : editing?.id, data: { ...f, durationWeeks: Number(f.durationWeeks), fee: Number(f.fee) } });
    if (ok) setEditing(null);
  }

  return (
    <>
      <AdminHeader
        title={t("admin.training.title")}
        lede={t("admin.training.lede")}
        actions={
          isAdmin && (
            <Button variant="gold" icon="Plus" onClick={() => open("new")}>
              {t("admin.training.add")}
            </Button>
          )
        }
      />
      <Card>
        <Table head={[t("admin.training.name"), t("admin.training.skill"), t("admin.common.town"), t("admin.common.status"), t("admin.common.actions")]} empty={!data.training.length}>
          {data.training.map((x) => (
            <tr key={x.id}>
              <td>
                <div className="font-medium">{pick(x.name)}</div>
                <div className="text-xs text-subtle">
                  {x.provider} · {t("common.units.weeks", { n: x.durationWeeks })} · {x.fee ? `₹${x.fee}` : t("common.units.free")} · {t(`admin.training.modes.${x.mode}`)}
                </div>
              </td>
              <td className="text-muted">{t(`common.skills.${x.skill}`)}</td>
              <td className="text-muted">{L.town(x.townId)}</td>
              <td>
                <StatusPill status={x.status} />
              </td>
              <td>
                {isAdmin && (
                  <div className="flex flex-wrap gap-1.5">
                    {x.status === "pending" ? (
                      <SmallButton tone="ok" onClick={() => post("/api/admin/training", { action: "status", id: x.id, status: "approved" })}>
                        {t("admin.training.approve")}
                      </SmallButton>
                    ) : (
                      <SmallButton onClick={() => post("/api/admin/training", { action: "status", id: x.id, status: "pending" })}>{t("admin.training.unpublish")}</SmallButton>
                    )}
                    <SmallButton onClick={() => open(x)}>{t("admin.common.edit")}</SmallButton>
                    <SmallButton tone="danger" onClick={() => post("/api/admin/training", { action: "delete", id: x.id })}>
                      {t("admin.common.delete")}
                    </SmallButton>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? t("admin.training.add") : t("admin.common.edit")} wide>
        <form onSubmit={save} className="space-y-4">
          <L10nField label={t("admin.training.name")} required value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("admin.training.provider")}>
              <Input required value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} />
            </Field>
            <Field label={t("admin.training.skill")}>
              <Select value={f.skill} onChange={(e) => setF({ ...f, skill: e.target.value as T["skill"] })} options={SKILLS.map((s) => ({ value: s, label: t(`common.skills.${s}`) }))} />
            </Field>
            <Field label={t("admin.common.town")}>
              <Select value={f.townId} onChange={(e) => setF({ ...f, townId: e.target.value })} options={TOWNS.map((x) => ({ value: x.id, label: pick(x.name) }))} />
            </Field>
            <Field label={t("admin.training.weeks")}>
              <Input type="number" min={1} value={f.durationWeeks} onChange={(e) => setF({ ...f, durationWeeks: Number(e.target.value) })} />
            </Field>
            <Field label={t("admin.training.fee")}>
              <Input type="number" min={0} value={f.fee} onChange={(e) => setF({ ...f, fee: Number(e.target.value) })} />
            </Field>
            <Field label={t("admin.training.mode")}>
              <Select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as T["mode"] })} options={MODES.map((m) => ({ value: m, label: t(`admin.training.modes.${m}`) }))} />
            </Field>
          </div>
          <L10nField label={t("admin.training.description")} required multiline value={f.description} onChange={(v) => setF({ ...f, description: v })} />
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
