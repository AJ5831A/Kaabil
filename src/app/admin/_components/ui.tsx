"use client";

import { cn } from "@/components/ui/cn";
import { Rich } from "@/components/ui/Rich";
import { useT } from "@/lib/i18n/client";
import { Pill } from "@/components/ui/Badge";

export function AdminHeader({ title, lede, actions }: { title: string; lede?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl leading-tight">
          <Rich text={title} />
        </h1>
        {lede && <p className="mt-1.5 text-sm text-muted">{lede}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ className, children, title, right }: { className?: string; children: React.ReactNode; title?: string; right?: React.ReactNode }) {
  return (
    <section className={cn("glass gold-edge rounded-2xl p-5", className)}>
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="eyebrow !text-muted">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

const TONE: Record<string, "neutral" | "gold" | "ok" | "warn" | "danger"> = {
  approved: "ok", verified: "ok", resolved: "ok", published: "ok",
  pending: "warn", open: "warn", machine_draft: "warn", unverified: "neutral", draft: "neutral",
  reviewed: "gold", rejected: "danger", archived: "neutral", dismissed: "neutral",
};

export function StatusPill({ status }: { status: string }) {
  const { t } = useT();
  return <Pill tone={TONE[status] ?? "neutral"}>{t(`admin.status.${status}`)}</Pill>;
}

export function Field({ label, children, className, hint }: { label: string; children: React.ReactNode; className?: string; hint?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[0.7rem] text-subtle">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-glass px-3 py-2.5 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-gold/60";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cn(inputCls, "resize-y", props.className)} />;
}
export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <select {...props} className={cn(inputCls, "appearance-none bg-bg-2", props.className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export type L10nValue = { en: string; hi?: string };

/** English + Hindi inputs; other languages go through the translation workflow. */
export function L10nField({ label, value, onChange, multiline, required }: { label: string; value: L10nValue; onChange: (v: L10nValue) => void; multiline?: boolean; required?: boolean }) {
  const { t } = useT();
  const C = multiline ? Textarea : Input;
  return (
    <fieldset className="grid gap-2 sm:grid-cols-2">
      <legend className="mb-1.5 text-xs font-medium text-muted">{label}</legend>
      <C aria-label={`${label} · ${t("admin.common.english")}`} placeholder={t("admin.common.english")} required={required} value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} />
      <C aria-label={`${label} · ${t("admin.common.hindi")}`} placeholder={t("admin.common.hindi")} value={value.hi ?? ""} onChange={(e) => onChange({ ...value, hi: e.target.value })} />
    </fieldset>
  );
}

export function SmallButton({ tone = "glass", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "glass" | "gold" | "ok" | "danger" }) {
  const tones = {
    glass: "border border-line text-fg hover:bg-glass-2",
    gold: "bg-gold text-gold-ink hover:brightness-110",
    ok: "bg-ok-bg text-ok hover:brightness-110",
    danger: "bg-danger-bg text-danger hover:brightness-110",
  };
  return (
    <button
      {...props}
      className={cn("inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-40", tones[tone], className)}
    />
  );
}

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  const { t } = useT();
  return (
    <div className="thin-scroll overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="border-b border-line px-3 pb-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-subtle">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:border-b [&_td]:border-line/60 [&_td]:px-3 [&_td]:py-3 [&_td]:align-top">{children}</tbody>
      </table>
      {empty && <p className="py-10 text-center text-sm text-subtle">{t("admin.common.empty")}</p>}
    </div>
  );
}

/** Horizontal bars for a label → count map. */
export function Bars({ data, labels }: { data: Record<string, number>; labels?: (k: string) => string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  const { t } = useT();
  if (!entries.length) return <p className="text-sm text-subtle">{t("admin.common.empty")}</p>;
  return (
    <ul className="space-y-2.5">
      {entries.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate text-muted">{labels ? labels(k) : k}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-glass-2">
            <span className="block h-full rounded-full bg-gradient-to-r from-gold-2 to-gold" style={{ width: `${(v / max) * 100}%` }} />
          </span>
          <span className="text-right font-mono text-xs tabular-nums text-fg">{v}</span>
        </li>
      ))}
    </ul>
  );
}

/** Area sparkline for a day series. */
export function Sparkline({ series, height = 120 }: { series: { day: string; n: number }[]; height?: number }) {
  const w = 600;
  const max = Math.max(1, ...series.map((s) => s.n));
  const step = w / Math.max(1, series.length - 1);
  const pts = series.map((s, i) => [i * step, height - 8 - (s.n / max) * (height - 24)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-32 w-full" preserveAspectRatio="none" role="img" aria-label={series.map((s) => `${s.day}: ${s.n}`).join(", ")}>
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--gold)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={height * f} y2={height * f} stroke="var(--line)" strokeDasharray="3 5" />
      ))}
      <path d={area} fill="url(#spark)" />
      <path d={line} fill="none" stroke="var(--gold)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      {pts.map(([x, y], i) => (series[i].n ? <circle key={i} cx={x} cy={y} r="2.5" fill="var(--gold)" /> : null))}
    </svg>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="glass gold-edge rounded-2xl p-5">
      <div className="eyebrow">{label}</div>
      <div className="mt-3 font-display text-4xl tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-subtle">{sub}</div>}
    </div>
  );
}
