"use client";

import { useT } from "@/lib/i18n/client";
import { TOWNS } from "@/lib/geo/towns";
import { HOURS_BANDS, JOB_CATEGORIES, JOB_TYPES, SKILLS } from "@/lib/taxonomy";
import type { JobFilters } from "@/lib/jobs/filter";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block !text-[0.62rem]">{label}</span>
      {children}
    </label>
  );
}

const selectCls =
  "h-11 w-full appearance-none rounded-xl border border-line bg-glass px-3.5 pr-9 text-sm text-fg outline-none transition-colors hover:border-line-strong focus:border-gold/60 [&>option]:bg-bg-2";

function Select({ value, onChange, children, label }: { value: string; onChange: (v: string) => void; children: React.ReactNode; label: string }) {
  return (
    <div className="relative">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {children}
      </select>
      <Icon name="ChevronRight" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-subtle" />
    </div>
  );
}

export function FilterPanel({ value, onChange, className, showTown = true }: { value: JobFilters; onChange: (f: JobFilters) => void; className?: string; showTown?: boolean }) {
  const { t, pick } = useT();
  const set = <K extends keyof JobFilters>(k: K, v: JobFilters[K] | "") => onChange({ ...value, [k]: v === "" ? undefined : v });
  return (
    <div className={cn("space-y-4", className)}>
      {showTown && (
        <Field label={t("jobs.filters.town")}>
          <Select label={t("jobs.filters.town")} value={value.townId ?? ""} onChange={(v) => set("townId", v)}>
            <option value="">{t("jobs.filters.anyTown")}</option>
            {TOWNS.map((x) => (
              <option key={x.id} value={x.id}>{pick(x.name)}</option>
            ))}
          </Select>
        </Field>
      )}
      <Field label={t("jobs.filters.distance")}>
        <Select label={t("jobs.filters.distance")} value={value.maxDistanceKm ? String(value.maxDistanceKm) : ""} onChange={(v) => set("maxDistanceKm", v ? Number(v) : "")}>
          <option value="">{t("jobs.filters.anyDistance")}</option>
          {[5, 10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{t("jobs.guided.distance.km", { n })}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("jobs.filters.minPay")}>
        <Select label={t("jobs.filters.minPay")} value={value.minPay ? String(value.minPay) : ""} onChange={(v) => set("minPay", v ? Number(v) : "")}>
          <option value="">{t("jobs.filters.anyPay")}</option>
          {[6000, 8000, 10000, 12000, 15000].map((n) => (
            <option key={n} value={n}>₹{n.toLocaleString("en-IN")}+</option>
          ))}
        </Select>
      </Field>
      <Field label={t("jobs.filters.jobType")}>
        <Select label={t("jobs.filters.jobType")} value={value.category ?? ""} onChange={(v) => set("category", v)}>
          <option value="">{t("jobs.filters.anyCategory")}</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{t(`common.jobCategories.${c.key}`)}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("jobs.filters.skill")}>
        <Select label={t("jobs.filters.skill")} value={value.skill ?? ""} onChange={(v) => set("skill", v as JobFilters["skill"])}>
          <option value="">{t("jobs.filters.anySkill")}</option>
          {SKILLS.map((s) => (
            <option key={s} value={s}>{t(`common.skills.${s}`)}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("jobs.filters.hours")}>
        <Select label={t("jobs.filters.hours")} value={value.hoursBand ?? ""} onChange={(v) => set("hoursBand", v as JobFilters["hoursBand"])}>
          <option value="">{t("jobs.filters.anyHours")}</option>
          {HOURS_BANDS.map((h) => (
            <option key={h} value={h}>{t(`common.hours.${h}`)}</option>
          ))}
        </Select>
      </Field>
      <div>
        <span className="eyebrow mb-2 block !text-[0.62rem]">{t("jobs.filters.type")}</span>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-line p-1" role="radiogroup" aria-label={t("jobs.filters.type")}>
          {[undefined, ...JOB_TYPES].map((jt) => (
            <button
              key={jt ?? "any"}
              role="radio"
              aria-checked={value.type === jt}
              onClick={() => set("type", jt ?? "")}
              className={cn("h-9 rounded-lg text-xs transition-colors", value.type === jt ? "bg-gold text-gold-ink" : "text-muted hover:bg-glass hover:text-fg")}
            >
              {jt ? t(`common.jobType.${jt}`) : t("jobs.filters.anyType")}
            </button>
          ))}
        </div>
      </div>
      <Field label={t("jobs.filters.sort")}>
        <Select label={t("jobs.filters.sort")} value={value.sort ?? ""} onChange={(v) => set("sort", v as JobFilters["sort"])}>
          <option value="">{value.townId ? t("jobs.filters.sortDistance") : t("jobs.filters.sortPay")}</option>
          <option value="distance">{t("jobs.filters.sortDistance")}</option>
          <option value="pay">{t("jobs.filters.sortPay")}</option>
        </Select>
      </Field>
      <button
        role="switch"
        aria-checked={!!value.verifiedOnly}
        onClick={() => set("verifiedOnly", value.verifiedOnly ? "" : true)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-line px-3.5 text-sm hover:border-line-strong"
      >
        <span className="inline-flex items-center gap-2">
          <Icon name="ShieldCheck" className="size-4 text-ok" /> {t("jobs.filters.verifiedOnly")}
        </span>
        <span className={cn("relative h-6 w-10 rounded-full transition-colors", value.verifiedOnly ? "bg-gold" : "bg-glass-2")}>
          <span className={cn("absolute top-1 size-4 rounded-full bg-fg transition-all", value.verifiedOnly ? "left-5 !bg-gold-ink" : "left-1")} />
        </span>
      </button>
      <button onClick={() => onChange({ townId: value.townId })} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gold">
        <Icon name="RotateCcw" className="size-3.5" /> {t("jobs.filters.reset")}
      </button>
    </div>
  );
}
