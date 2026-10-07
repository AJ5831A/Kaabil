"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { TOWNS, nearestTown, townById } from "@/lib/geo/towns";
import { useT } from "@/lib/i18n/client";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/components/ui/cn";

const lat = TOWNS.map((t) => t.lat);
const lng = TOWNS.map((t) => t.lng);
const box = { minLat: Math.min(...lat) - 0.25, maxLat: Math.max(...lat) + 0.25, minLng: Math.min(...lng) - 0.25, maxLng: Math.max(...lng) + 0.25 };
const project = (t: { lat: number; lng: number }) => ({
  x: ((t.lng - box.minLng) / (box.maxLng - box.minLng)) * 100,
  y: (1 - (t.lat - box.minLat) / (box.maxLat - box.minLat)) * 100,
});

/** Stylised pilot-region map. Not a real map — a full map view is planned. */
export function PilotMap({ value, onPick, className }: { value?: string; onPick: (id: string) => void; className?: string }) {
  const { t, pick } = useT();
  return (
    <div className={cn("glass gold-edge relative overflow-hidden rounded-[var(--radius-tile)]", className)}>
      <svg viewBox="-6 -6 112 112" className="h-full w-full" role="group" aria-label={t("jobs.guided.place.q").replace(/\*/g, "")}>
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="var(--line)" strokeWidth="0.25" />
          </pattern>
        </defs>
        <rect x="-6" y="-6" width="112" height="112" fill="url(#grid)" />
        {value &&
          (() => {
            const c = project(townById(value)!);
            return [12, 24, 36].map((r) => <circle key={r} cx={c.x} cy={c.y} r={r} fill="none" stroke="var(--gold)" strokeOpacity={0.18} strokeWidth="0.3" />);
          })()}
        {TOWNS.map((town) => {
          const p = project(town);
          const sel = town.id === value;
          return (
            <g key={town.id} className="cursor-pointer" onClick={() => onPick(town.id)} role="button" aria-label={pick(town.name)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onPick(town.id)}>
              <circle cx={p.x} cy={p.y} r={sel ? 2.4 : 1.5} fill={sel ? "var(--gold)" : "var(--fg-muted)"} />
              {sel && <circle cx={p.x} cy={p.y} r="4.5" fill="none" stroke="var(--gold)" strokeWidth="0.4" />}
              <text x={p.x + 3.2} y={p.y + 1.3} fontSize="3.6" fill={sel ? "var(--gold)" : "var(--fg-muted)"} style={{ fontFamily: "var(--font-sans)" }}>
                {pick(town.name)}
              </text>
            </g>
          );
        })}
      </svg>
      <span className="absolute bottom-3 left-3 rounded-full border border-line bg-bg/60 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-subtle backdrop-blur">
        {t("jobs.mapSoon")}
      </span>
    </div>
  );
}

export function TownPicker({ value, onPick, showMap = true }: { value?: string; onPick: (id: string) => void; showMap?: boolean }) {
  const { t, pick } = useT();
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!("geolocation" in navigator)) return toast.warn(t("jobs.guided.place.locationFailed"));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const town = nearestTown({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.ok(t("jobs.guided.place.located", { town: pick(town.name) }));
        onPick(town.id);
      },
      () => {
        setLocating(false);
        toast.warn(t("jobs.guided.place.locationFailed"));
      },
      { timeout: 8000, maximumAge: 600000 },
    );
  };

  return (
    <div className="@container"><div className={cn("grid gap-4", showMap && "@3xl:grid-cols-[1fr_18rem]")}>
      <div>
        <TileGrid cols={3}>
          <Tile index={0} icon="Navigation" label={locating ? t("jobs.guided.place.locating") : t("jobs.guided.place.useLocation")} onClick={locate} square={false} listen={false} />
          {TOWNS.map((town, i) => (
            <Tile key={town.id} index={i + 1} icon="MapPin" label={pick(town.name)} sub={town.district} selected={value === town.id} onClick={() => onPick(town.id)} square={false} />
          ))}
        </TileGrid>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-subtle">
          <Icon name="CircleAlert" className="size-4" /> {t("jobs.guided.place.pilot")}
        </p>
      </div>
      {showMap && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden @3xl:block">
          <PilotMap value={value} onPick={onPick} className="aspect-square" />
        </motion.div>
      )}
    </div></div>
  );
}
