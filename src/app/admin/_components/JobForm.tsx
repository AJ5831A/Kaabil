"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { Field, Input, L10nField, Select, SmallButton, type L10nValue } from "./ui";
import { useAdmin, type Snapshot } from "./AdminProvider";
import { TOWNS } from "@/lib/geo/towns";
import { EXPERIENCE_LEVELS, HOURS_BANDS, JOB_CATEGORIES, JOB_TYPES, SKILLS, TRAINING_OPTIONS, type SkillKey } from "@/lib/taxonomy";
import { cn } from "@/components/ui/cn";

type AdminJob = Snapshot["jobs"][number];

function initial(job?: AdminJob, employerId?: string) {
  return {
    employerId: job?.employerId ?? employerId ?? "",
    category: job?.category ?? "kitchen_helper",
    title: (job?.title ?? { en: "" }) as L10nValue,
    description: (job?.description ?? { en: "" }) as L10nValue,
    townId: job?.townId ?? "pilani",
    payMin: job?.payMin ?? 8000,
    payMax: job?.payMax ?? 10000,
    payPeriod: job?.payPeriod ?? "month",
    type: job?.type ?? "full_time",
    start: job?.shift.start ?? "09:00",
    end: job?.shift.end ?? "17:00",
    hoursBand: job?.hoursBand ?? "day",
    skills: (job?.skills ?? []) as SkillKey[],
    experience: job?.experience ?? "none",
    training: job?.training ?? "provided",
    joining: (job?.joining ?? { en: "" }) as L10nValue,
    contactNote: (job?.contactNote ?? { en: "" }) as L10nValue,
    openings: job?.openings ?? 1,
  };
}

export function JobForm({ job, onDone }: { job?: AdminJob; onDone: () => void }) {
  const { t, pick } = useT();
  const { data, post } = useAdmin();
  const [f, setF] = useState(() => initial(job, data?.employers[0]?.id));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      employerId: f.employerId,
      category: f.category,
      title: f.title.en.trim() ? f.title : undefined,
      description: f.description,
      townId: f.townId,
      payMin: Number(f.payMin),
      payMax: Number(f.payMax),
      payPeriod: f.payPeriod,
      type: f.type,
      shift: { start: f.start, end: f.end },
      hoursBand: f.hoursBand,
      skills: f.skills,
      experience: f.experience,
      training: f.training,
      joining: f.joining,
      contactNote: f.contactNote,
      openings: Number(f.openings),
    };
    const ok = await post("/api/admin/jobs", job ? { action: "update", id: job.id, data: payload } : { action: "create", data: payload });
    if (ok) onDone();
  }

  const opt = (keys: readonly string[], ns: string) => keys.map((k) => ({ value: k, label: t(`${ns}.${k}`) }));

  return (
    <form onSubmit={submit} className="space-y-5">
      {job && <p className="rounded-xl bg-warn-bg px-3 py-2 text-xs text-warn">{t("admin.jobs.editWarning")}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("admin.jobs.employer")}>
          <Select
            value={f.employerId}
            onChange={(e) => set("employerId", e.target.value)}
            options={(data?.employers ?? []).map((e) => ({ value: e.id, label: `${e.name} · ${t(`admin.status.${e.verification.status}`)}` }))}
          />
        </Field>
        <Field label={t("admin.jobs.category")}>
          <Select value={f.category} onChange={(e) => set("category", e.target.value as typeof f.category)} options={opt(JOB_CATEGORIES.map((c) => c.key), "common.jobCategories")} />
        </Field>
        <Field label={t("admin.common.town")}>
          <Select value={f.townId} onChange={(e) => set("townId", e.target.value)} options={TOWNS.map((x) => ({ value: x.id, label: pick(x.name) }))} />
        </Field>
      </div>
      <L10nField label={t("admin.jobs.titleOverride")} value={f.title} onChange={(v) => set("title", v)} />
      <L10nField label={t("admin.jobs.description")} required multiline value={f.description} onChange={(v) => set("description", v)} />
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label={t("admin.jobs.payMin")}>
          <Input type="number" min={0} required value={f.payMin} onChange={(e) => set("payMin", Number(e.target.value))} />
        </Field>
        <Field label={t("admin.jobs.payMax")}>
          <Input type="number" min={0} required value={f.payMax} onChange={(e) => set("payMax", Number(e.target.value))} />
        </Field>
        <Field label={t("admin.jobs.payPeriod")}>
          <Select value={f.payPeriod} onChange={(e) => set("payPeriod", e.target.value as "month" | "day")} options={opt(["month", "day"], "common.pay")} />
        </Field>
        <Field label={t("admin.jobs.openings")}>
          <Input type="number" min={1} required value={f.openings} onChange={(e) => set("openings", Number(e.target.value))} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label={t("admin.jobs.type")}>
          <Select value={f.type} onChange={(e) => set("type", e.target.value as typeof f.type)} options={opt(JOB_TYPES, "common.jobType")} />
        </Field>
        <Field label={t("admin.jobs.hoursBand")}>
          <Select value={f.hoursBand} onChange={(e) => set("hoursBand", e.target.value as typeof f.hoursBand)} options={opt(HOURS_BANDS, "common.hours")} />
        </Field>
        <Field label={t("admin.jobs.shiftStart")}>
          <Input type="time" required value={f.start} onChange={(e) => set("start", e.target.value)} />
        </Field>
        <Field label={t("admin.jobs.shiftEnd")}>
          <Input type="time" required value={f.end} onChange={(e) => set("end", e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.jobs.experience")}>
          <Select value={f.experience} onChange={(e) => set("experience", e.target.value as typeof f.experience)} options={opt(EXPERIENCE_LEVELS, "common.experience")} />
        </Field>
        <Field label={t("admin.jobs.training")}>
          <Select value={f.training} onChange={(e) => set("training", e.target.value as typeof f.training)} options={opt(TRAINING_OPTIONS, "common.training")} />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-muted">{t("admin.jobs.skills")}</legend>
        <div className="flex flex-wrap gap-1.5">
          {SKILLS.map((s) => {
            const on = f.skills.includes(s);
            return (
              <button
                type="button"
                key={s}
                aria-pressed={on}
                onClick={() => set("skills", on ? f.skills.filter((x) => x !== s) : [...f.skills, s])}
                className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", on ? "border-gold/50 bg-gold/15 text-gold" : "border-line text-muted hover:text-fg")}
              >
                {t(`common.skills.${s}`)}
              </button>
            );
          })}
        </div>
      </fieldset>
      <L10nField label={t("admin.jobs.joining")} required value={f.joining} onChange={(v) => set("joining", v)} />
      <L10nField label={t("admin.jobs.contactNote")} required value={f.contactNote} onChange={(v) => set("contactNote", v)} />
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <SmallButton type="button" onClick={onDone}>
          {t("admin.common.cancel")}
        </SmallButton>
        <SmallButton type="submit" tone="gold" disabled={!f.skills.length || !f.employerId}>
          {t("admin.common.save")}
        </SmallButton>
      </div>
    </form>
  );
}
