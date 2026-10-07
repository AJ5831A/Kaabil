"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useAdmin } from "../../_components/AdminProvider";
import { AdminHeader, Card, Field, Select, SmallButton, StatusPill, Textarea } from "../../_components/ui";
import { useLabels } from "../../_components/labels";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { toast } from "@/components/ui/Toast";

const FIELDS = { job: ["description", "joining", "contactNote", "title"], employer: ["about", "sector"], training: ["name", "description"] } as const;
type Kind = keyof typeof FIELDS;

export default function TranslationsPage() {
  const { t, pick } = useT();
  const { data, post, refresh } = useAdmin();
  const L = useLabels();
  const [kind, setKind] = useState<Kind>("job");
  const [recordId, setRecordId] = useState("");
  const [field, setField] = useState<string>("description");
  const [targets, setTargets] = useState<Locale[]>(["mr", "gu"]);
  const [busy, setBusy] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [manual, setManual] = useState<{ locale: Locale; text: string }>({ locale: "mr", text: "" });
  const [edits, setEdits] = useState<Record<string, string>>({});

  const records = useMemo(() => {
    if (!data) return [];
    if (kind === "job") return data.jobs.map((j) => ({ id: j.id, label: `${L.jobTitle(j)} · ${data.employers.find((e) => e.id === j.employerId)?.name ?? ""}`, rec: j as unknown as Record<string, unknown> }));
    if (kind === "employer") return data.employers.map((e) => ({ id: e.id, label: e.name, rec: e as unknown as Record<string, unknown> }));
    return data.training.map((x) => ({ id: x.id, label: pick(x.name), rec: x as unknown as Record<string, unknown> }));
  }, [data, kind, L, pick]);

  if (!data) return null;
  const rid = recordId || records[0]?.id || "";
  const current = records.find((r) => r.id === rid);
  const l10n = (current?.rec[field] as Record<string, string> | undefined) ?? undefined;
  const key = `${kind}:${rid}:${field}`;
  const drafts = data.translations.filter((x) => x.status !== "published").slice().reverse();
  const published = data.translations.filter((x) => x.status === "published").slice(-8).reverse();
  const nonEn = LOCALES.filter((l) => l.code !== "en");

  async function machine() {
    setBusy(true);
    const r = await fetch("/api/admin/translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "machine", key, locales: targets }) });
    setBusy(false);
    const j = await r.json().catch(() => ({}));
    if (r.status === 503) {
      setNotConfigured(true);
      toast.warn(t("admin.translations.notConfigured"));
      return;
    }
    if (!r.ok) {
      toast.warn(j.message ?? t("admin.common.error"));
      return;
    }
    toast.ok(t("admin.common.saved"));
    await refresh();
  }

  const step = (n: number, label: string) => (
    <div className="mb-4 flex items-center gap-3">
      <span className="grid size-7 place-items-center rounded-full border border-line-strong font-mono text-xs text-gold">{n}</span>
      <span className="eyebrow !text-muted">{label}</span>
    </div>
  );

  return (
    <>
      <AdminHeader title={t("admin.translations.title")} lede={t("admin.translations.lede")} />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          {step(1, t("admin.translations.step1"))}
          <div className="space-y-3">
            <div className="flex gap-1">
              {(Object.keys(FIELDS) as Kind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setKind(k);
                    setRecordId("");
                    setField(FIELDS[k][0]);
                  }}
                  aria-pressed={kind === k}
                  className={cn("rounded-full px-3 py-1.5 text-xs", kind === k ? "bg-glass-2 text-gold" : "text-muted hover:text-fg")}
                >
                  {t(`admin.translations.kinds.${k}`)}
                </button>
              ))}
            </div>
            <Field label={t("admin.translations.record")}>
              <Select value={rid} onChange={(e) => setRecordId(e.target.value)} options={records.map((r) => ({ value: r.id, label: r.label }))} />
            </Field>
            <Field label={t("admin.translations.field")}>
              <Select value={field} onChange={(e) => setField(e.target.value)} options={FIELDS[kind].map((f) => ({ value: f, label: t(`admin.translations.fields.${f}`) }))} />
            </Field>
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted">{t("admin.translations.source")}</div>
              <p className="rounded-xl border border-line bg-glass p-3 text-sm">{l10n?.en ?? "—"}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {nonEn.map((l) => (
                <span key={l.code} className={cn("rounded-full px-2 py-0.5 font-mono text-[0.65rem]", l10n?.[l.code] ? "bg-ok-bg text-ok" : "bg-glass-2 text-subtle")}>
                  {l.code}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-3">
          {step(2, t("admin.translations.step2"))}
          <div className="mb-1.5 text-xs font-medium text-muted">{t("admin.translations.targets")}</div>
          <div className="flex flex-wrap gap-1.5">
            {nonEn.map((l) => {
              const on = targets.includes(l.code);
              return (
                <button
                  key={l.code}
                  aria-pressed={on}
                  onClick={() => setTargets(on ? targets.filter((x) => x !== l.code) : [...targets, l.code])}
                  className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", on ? "border-gold/50 bg-gold/15 text-gold" : "border-line text-muted hover:text-fg")}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SmallButton tone="gold" className="!h-10 !px-5 !text-sm" disabled={busy || !targets.length || !l10n?.en} onClick={machine}>
              <Icon name="Sparkles" className="size-4" /> {busy ? t("admin.translations.translating") : t("admin.translations.translate")}
            </SmallButton>
            {notConfigured && <span className="text-xs text-warn">{t("admin.translations.notConfigured")}</span>}
          </div>
          <div className="hairline my-5" />
          <div className="text-xs font-medium text-muted">{t("admin.translations.manual")}</div>
          <p className="mb-2 text-[0.7rem] text-subtle">{t("admin.translations.manualHint")}</p>
          <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
            <Select value={manual.locale} onChange={(e) => setManual({ ...manual, locale: e.target.value as Locale })} options={nonEn.map((l) => ({ value: l.code, label: l.label }))} />
            <Textarea rows={2} value={manual.text} onChange={(e) => setManual({ ...manual, text: e.target.value })} aria-label={t("admin.translations.manual")} />
            <SmallButton
              className="self-start"
              disabled={!manual.text.trim()}
              onClick={async () => {
                if (await post("/api/admin/translations", { action: "manual", key, locale: manual.locale, draft: manual.text })) setManual({ ...manual, text: "" });
              }}
            >
              {t("admin.common.save")}
            </SmallButton>
          </div>
        </Card>
      </div>

      <Card className="mt-4" title={`3 · ${t("admin.translations.step3")}`} right={<span className="font-mono text-xs text-subtle">{drafts.length}</span>}>
        {!drafts.length && <p className="py-6 text-center text-sm text-subtle">{t("admin.common.empty")}</p>}
        <ul className="space-y-3">
          {drafts.map((d) => {
            const value = edits[d.id] ?? d.draft;
            const lang = LOCALES.find((l) => l.code === d.locale);
            return (
              <li key={d.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{lang?.label}</span>
                    <span className="font-mono text-xs text-subtle">{d.key}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={d.status} />
                    {d.reviewedBy && <span className="text-xs text-subtle">{t("admin.translations.reviewedBy", { who: d.reviewedBy })}</span>}
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <p className="rounded-xl bg-glass p-3 text-sm text-muted">{d.source}</p>
                  <Textarea value={value} onChange={(e) => setEdits({ ...edits, [d.id]: e.target.value })} aria-label={`${lang?.english} translation`} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  {d.status === "machine_draft" && <span className="mr-auto text-xs text-warn">{t("admin.translations.needsReview")}</span>}
                  <SmallButton onClick={() => post("/api/admin/translations", { action: "review", id: d.id, draft: value })}>
                    <Icon name="Eye" className="size-3.5" /> {t("admin.translations.review")}
                  </SmallButton>
                  <SmallButton
                    tone="gold"
                    disabled={d.status !== "reviewed" || (edits[d.id] != null && edits[d.id] !== d.draft)}
                    onClick={() => post("/api/admin/translations", { action: "publish", id: d.id }, t("admin.translations.published"))}
                  >
                    {t("admin.translations.publish")}
                  </SmallButton>
                </div>
              </li>
            );
          })}
        </ul>
        {published.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="eyebrow mb-2">{t("admin.status.published")}</div>
            <ul className="space-y-1 text-xs text-muted">
              {published.map((p) => (
                <li key={p.id} className="flex gap-2">
                  <span className="font-mono text-subtle">{p.locale}</span> {p.key} — {p.draft.slice(0, 80)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </>
  );
}
