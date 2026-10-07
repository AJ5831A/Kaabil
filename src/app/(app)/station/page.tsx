"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Pill } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Rich } from "@/components/ui/Rich";
import { ListenButton } from "@/components/ui/ListenButton";
import { speaker } from "@/lib/voice/speaker";
import { track } from "@/lib/track";
import { townById } from "@/lib/geo/towns";
import { useStations } from "@/components/station/useStation";
import { KIOSK_STEPS } from "@/components/station/KioskLayer";

export default function StationPage() {
  const { t, tl, pick } = useT();
  const router = useRouter();
  const stations = useStations();
  const kiosk = useApp((s) => s.kiosk);
  const setKiosk = useApp((s) => s.setKiosk);
  const resetSession = useApp((s) => s.resetSession);
  const [stationId, setStationId] = useState<string | undefined>(kiosk.stationId);
  const [assisted, setAssisted] = useState(false);
  const steps = tl("station.how.steps");

  const start = () => {
    if (!stationId) return;
    speaker.stop();
    resetSession();
    setKiosk({ active: true, stationId, assisted });
    track("kiosk_started", { station: stationId });
    router.push("/welcome");
  };

  return (
    <div className="space-y-12">
      <PageHeader eyebrow={t("station.eyebrow")} title={t("station.title")} lede={t("station.lede")} />

      <section aria-labelledby="pick">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="pick" className="font-display text-3xl">{t("station.pickStation")}</h2>
            <p data-secondary className="mt-1 text-sm text-muted">{t("station.pickStationLede")}</p>
          </div>
        </div>
        {stations === null ? (
          <TileGrid cols={3}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass aspect-square rounded-[var(--radius-tile)]"><div className="shimmer h-full w-full rounded-[inherit] opacity-40" /></div>
            ))}
          </TileGrid>
        ) : stations.length === 0 ? (
          <Glass className="p-6 text-muted">{t("station.noStations")}</Glass>
        ) : (
          <TileGrid cols={3}>
            {stations.map((s, i) => (
              <Tile
                key={s.id}
                index={i}
                size="lg"
                icon={s.kind === "school" ? "GraduationCap" : s.kind === "public_service" ? "Building2" : s.kind === "ngo" ? "HeartHandshake" : "Monitor"}
                label={pick(s.name).replace(/^KAABIL Station · |^काबिल स्टेशन · /, "")}
                sub={`${pick(townById(s.townId)?.name)} · ${t("station.hours", { hours: s.hours })}`}
                meta={
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name={s.hasPrinter ? "Printer" : "FileText"} className="size-3.5" />
                    {s.hasPrinter ? t("station.printer") : t("station.noPrinter")}
                  </span>
                }
                selected={stationId === s.id}
                onClick={() => setStationId(s.id)}
              />
            ))}
          </TileGrid>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Glass className="p-6 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl"><Rich text={t("station.how.title")} /></h2>
            <ListenButton text={steps.join(". ")} />
          </div>
          <ol className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {steps.map((label, i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                className="flex items-center gap-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-gold">
                  <Icon name={KIOSK_STEPS[i]?.icon ?? "Check"} className="size-4" />
                </span>
                <span className="text-sm">
                  <span className="mr-1.5 font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  {label}
                </span>
              </motion.li>
            ))}
          </ol>
        </Glass>

        <Glass strong className="flex flex-col p-6 lg:col-span-2">
          <button
            role="switch"
            aria-checked={assisted}
            onClick={() => setAssisted((a) => !a)}
            className="flex items-start gap-4 rounded-2xl border border-line p-4 text-left transition-colors hover:bg-glass-2"
          >
            <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border ${assisted ? "border-gold bg-gold text-gold-ink" : "border-line-strong"}`}>
              {assisted && <Icon name="Check" className="size-4" strokeWidth={2.5} />}
            </span>
            <span>
              <span className="block font-medium">{t("station.assistedLabel")}</span>
              <span className="mt-1 block text-sm text-muted">{t("station.assistedHint")}</span>
            </span>
          </button>
          <p data-secondary className="mt-5 flex gap-2 text-sm text-muted">
            <Icon name="ShieldCheck" className="mt-0.5 size-4 shrink-0 text-ok" />
            {t("station.privacy")}
          </p>
          <div className="mt-auto pt-6">
            <Button variant="gold" size="xl" className="w-full" icon="Monitor" disabled={!stationId} onClick={start}>
              {t("station.start")}
            </Button>
            {kiosk.active && (
              <div className="mt-3 text-center">
                <Pill tone="gold">{t("station.kiosk.active")}</Pill>
              </div>
            )}
          </div>
        </Glass>
      </section>
    </div>
  );
}
