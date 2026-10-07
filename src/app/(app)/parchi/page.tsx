"use client";

import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Rich } from "@/components/ui/Rich";
import { ParchiPrinter } from "@/components/parchi/ParchiPrinter";
import { ParchiTabs } from "@/components/parchi/ParchiTabs";
import { ProfileSlip } from "@/components/parchi/Slips";
import { useProfileCode, useSerial } from "@/components/parchi/useParchi";

export default function ParchiPage() {
  const { t } = useT();
  const hydrated = useApp((s) => s.hydrated);
  const { data, code, completeness } = useProfileCode();
  const { serial, issue, assisted, stationId } = useSerial();

  const missing = [
    !completeness.discover && { icon: "Search", label: t("parchi.incomplete.discover"), href: "/discover" },
    !completeness.profile && { icon: "User", label: t("parchi.incomplete.profile"), href: "/profile" },
    !completeness.learn && { icon: "BookOpen", label: t("parchi.incomplete.learn"), href: "/learn" },
  ].filter(Boolean) as { icon: string; label: string; href: string }[];

  return (
    <div>
      <PageHeader eyebrow={t("parchi.eyebrow")} title={t("parchi.title")} lede={t("parchi.lede")} />
      <ParchiTabs />
      {hydrated && missing.length > 0 && (
        <section data-secondary className="glass gold-edge mb-8 rounded-[var(--radius-tile)] p-6">
          <h2 className="font-display text-2xl"><Rich text={t("parchi.incomplete.title")} /></h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{t("parchi.incomplete.body")}</p>
          <TileGrid cols={3} className="mt-5">
            {missing.map((m, i) => (
              <Tile key={m.href} index={i} icon={m.icon} label={m.label} href={m.href} square={false} size="sm" className="!min-h-28" />
            ))}
          </TileGrid>
        </section>
      )}
      {hydrated && (
        <ParchiPrinter type="profile" prepare={() => issue({ type: "profile" })}>
          {(paper) => <ProfileSlip paper={paper} data={data} serial={serial} qrUrl={`${window.location.origin}/p/${code}`} assisted={assisted} stationId={stationId} />}
        </ParchiPrinter>
      )}
    </div>
  );
}
