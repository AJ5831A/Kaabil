"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useAdmin } from "../../_components/AdminProvider";
import { AdminHeader, Card, Table } from "../../_components/ui";
import { cn } from "@/components/ui/cn";

type Row = { code: string; label: string; english: string; covered: number; total: number };

export default function LanguagesPage() {
  const { t } = useT();
  const { data, post, isAdmin } = useAdmin();
  const [coverage, setCoverage] = useState<Row[]>([]);
  useEffect(() => {
    fetch("/api/admin/languages")
      .then((r) => r.json())
      .then((j) => setCoverage(j.coverage ?? []));
  }, []);
  if (!data) return null;

  return (
    <>
      <AdminHeader title={t("admin.languages.title")} lede={t("admin.languages.lede")} />
      <Card>
        <Table head={[t("admin.nav.languages"), t("admin.languages.coverageHead"), t("admin.languages.enabled")]}>
          {coverage.map((c) => {
            const pct = Math.round((c.covered / Math.max(1, c.total)) * 100);
            const enabled = data.languages.find((l) => l.code === c.code)?.enabled ?? true;
            const locked = c.code === "en" || c.code === "hi";
            return (
              <tr key={c.code}>
                <td>
                  <div className="font-medium">{c.label}</div>
                  <div className="font-mono text-xs text-subtle">
                    {c.english} · {c.code}
                  </div>
                </td>
                <td className="w-1/2">
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-glass-2">
                      <span className={cn("block h-full rounded-full", pct === 100 ? "bg-ok" : "bg-gold")} style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-12 text-right font-mono text-xs tabular-nums">{pct}%</span>
                  </div>
                  <div className="mt-1 text-[0.7rem] text-subtle">{t("admin.languages.coverage", { covered: c.covered, total: c.total })}</div>
                </td>
                <td>
                  {locked ? (
                    <span className="text-xs text-subtle">{t("admin.languages.locked")}</span>
                  ) : (
                    <button
                      role="switch"
                      aria-checked={enabled}
                      disabled={!isAdmin}
                      aria-label={`${c.english} ${t("admin.languages.enabled")}`}
                      onClick={() => post("/api/admin/languages", { code: c.code, enabled: !enabled })}
                      className={cn("relative h-6 w-11 rounded-full border transition-colors disabled:opacity-40", enabled ? "border-gold/50 bg-gold/30" : "border-line bg-glass")}
                    >
                      <span className={cn("absolute top-0.5 size-[1.15rem] rounded-full transition-all", enabled ? "left-[1.4rem] bg-gold" : "left-0.5 bg-subtle")} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
        <p className="mt-4 text-xs text-subtle">{t("admin.languages.addHint")}</p>
      </Card>
    </>
  );
}
