"use client";

import { useT } from "@/lib/i18n/client";
import { useAdmin } from "../_components/AdminProvider";
import { AdminHeader, Bars, Card, Sparkline, Stat } from "../_components/ui";
import { Icon } from "@/components/ui/Icon";
import { LOCALES } from "@/lib/i18n/config";

export default function Overview() {
  const { t } = useT();
  const { data } = useAdmin();
  if (!data) return null;
  const s = data.stats;
  const name = data.session.email.split("@")[0];
  return (
    <>
      <AdminHeader title={t("admin.overview.title", { name })} lede={t("admin.overview.lede")} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("admin.overview.verifiedLive")} value={s.publicVerified} />
        <Stat label={t("admin.overview.openReports")} value={s.openReports} />
        <Stat label={t("admin.overview.parchi")} value={s.parchiIssued} sub={t("admin.overview.assisted", { n: s.assistedParchi })} />
        <Stat label={t("admin.overview.interests")} value={s.interests} sub={`${t("admin.overview.stations")}: ${s.activeStations}`} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={t("admin.overview.events")} right={<span className="font-mono text-xs text-subtle">{t("admin.overview.eventsTotal", { n: s.eventsTotal })}</span>}>
          <Sparkline series={s.series} />
          <div className="mt-2 flex justify-between font-mono text-[0.65rem] text-subtle">
            <span>{s.series[0]?.day}</span>
            <span>{s.series.at(-1)?.day}</span>
          </div>
        </Card>
        <Card title={t("admin.overview.languages")}>
          <Bars data={s.eventsByLocale} labels={(k) => LOCALES.find((l) => l.code === k)?.label ?? k} />
        </Card>
        <Card title={t("admin.overview.jobs")}>
          <Bars data={s.jobsByStatus} labels={(k) => t(`admin.status.${k}`)} />
        </Card>
        <Card title={t("admin.overview.employers")}>
          <Bars data={s.employersByStatus} labels={(k) => t(`admin.status.${k}`)} />
        </Card>
        <Card title={t("admin.overview.topEvents")}>
          <Bars data={Object.fromEntries(Object.entries(s.eventsByName).slice(0, 8))} labels={(k) => k.replace(/_/g, " ")} />
        </Card>
      </div>
      <p className="mt-6 flex items-center gap-2 text-xs text-subtle">
        <Icon name="ShieldCheck" className="size-3.5 text-ok" /> {t("admin.overview.privacy")}
      </p>
    </>
  );
}
