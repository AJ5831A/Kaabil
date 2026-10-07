"use client";

import { createContext, useContext } from "react";
import { cn } from "@/components/ui/cn";
import { useT } from "@/lib/i18n/client";

export type Paper = "a5" | "a6" | "58mm" | "80mm";
export const PAPERS: Paper[] = ["a5", "a6", "80mm", "58mm"];

/** Physical sizes. Thermal rolls have auto height (computed when printing). */
export const PAPER_SPEC: Record<Paper, { width: number; height?: number; pad: number; base: number; thermal: boolean; qr: number }> = {
  a5: { width: 148, height: 210, pad: 12, base: 3.6, thermal: false, qr: 30 },
  a6: { width: 105, height: 148, pad: 8, base: 2.85, thermal: false, qr: 22 },
  "80mm": { width: 80, pad: 4, base: 2.9, thermal: true, qr: 34 },
  "58mm": { width: 58, pad: 2.5, base: 2.35, thermal: true, qr: 30 },
};

const PaperCtx = createContext<Paper>("a5");
export const usePaper = () => useContext(PaperCtx);

/**
 * The printable slip. Sized in real millimetres so the on-screen preview
 * matches the paper. Ink-on-paper styling independent of the app theme.
 * Only `.print-root` is visible when printing (see globals.css).
 */
export function ParchiSheet({ paper, children }: { paper: Paper; children: React.ReactNode }) {
  const spec = PAPER_SPEC[paper];
  return (
    <PaperCtx.Provider value={paper}>
      <div
        data-paper={paper}
        className={cn("parchi-sheet relative mx-auto bg-[#fffdf8] text-[#111] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]", spec.thermal ? "rounded-sm" : "rounded-[2px]")}
        style={{
          width: `${spec.width}mm`,
          minHeight: spec.height ? `${spec.height}mm` : undefined,
          padding: `${spec.pad}mm`,
          fontSize: `${spec.base}mm`,
          lineHeight: 1.35,
          fontFamily: "var(--font-sans)",
          colorScheme: "light",
        }}
      >
        {children}
      </div>
    </PaperCtx.Provider>
  );
}

/* ---------------------------------------------------------------- slip parts */

export function SlipHeader({ title, serial }: { title: string; serial?: string }) {
  const paper = usePaper();
  const { t } = useT();
  const thermal = PAPER_SPEC[paper].thermal;
  return (
    <header className={cn("flex flex-col", thermal ? "items-center text-center" : "")}>
      <div className={cn("flex w-full gap-2", thermal ? "flex-col items-center" : "items-end justify-between")}>
        <div className={thermal ? "text-center" : ""}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "2.4em", letterSpacing: "0.16em", lineHeight: 1 }}>
            KAAB<span style={{ fontStyle: "italic", color: thermal ? "#111" : "#9a7330" }}>I</span>L
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.05em", marginTop: "0.35em", color: "#333" }}>
            Turning Ability into Opportunity
          </div>
          <div style={{ fontSize: "0.82em", color: "#555", marginTop: "0.1em" }}>हर हुनर को मिले सही दिशा</div>
        </div>
        {serial && !thermal && (
          <div className="text-right" style={{ fontSize: "0.72em", color: "#555" }}>
            <div style={{ letterSpacing: "0.2em", textTransform: "uppercase" }}>{t("parchi.serial")}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.15em", color: "#111" }}>{serial}</div>
          </div>
        )}
      </div>
      <div style={{ height: thermal ? "0.25mm" : "0.4mm", background: thermal ? "#111" : "linear-gradient(90deg,#b48c48,#d6b26e 50%,#b48c48)", margin: "1em 0 0.9em", width: "100%" }} />
      <div style={{ letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 700, fontSize: "0.86em" }}>{title}</div>
      {serial && thermal && <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85em", marginTop: "0.3em" }}>{serial}</div>}
    </header>
  );
}

export function SlipField({ label, children, mono, strong }: { label: string; children: React.ReactNode; mono?: boolean; strong?: boolean }) {
  const paper = usePaper();
  const thermal = PAPER_SPEC[paper].thermal;
  return (
    <div
      className={thermal ? "" : "grid"}
      style={{
        gridTemplateColumns: thermal ? undefined : "34% 1fr",
        gap: thermal ? undefined : "0.8em",
        padding: "0.42em 0",
        borderBottom: "0.2mm dotted #bbb",
        breakInside: "avoid",
      }}
    >
      <div style={{ fontSize: "0.72em", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", paddingTop: thermal ? 0 : "0.15em" }}>{label}</div>
      <div style={{ fontFamily: mono ? "var(--font-mono)" : undefined, fontWeight: strong ? 700 : 500, fontSize: strong ? "1.1em" : "1em" }}>{children}</div>
    </div>
  );
}

export function SlipFooter({ children, assisted, stationId }: { children?: React.ReactNode; assisted?: boolean; stationId?: string }) {
  const { t } = useT();
  return (
    <footer style={{ marginTop: "1em", fontSize: "0.74em", color: "#444" }}>
      {assisted && (
        <div style={{ border: "0.25mm solid #111", padding: "0.4em 0.6em", margin: "0.6em 0", fontWeight: 600, textAlign: "center" }}>
          {t("parchi.slip.assisted")}
          {stationId ? ` · ${t("parchi.slip.station")} ${stationId}` : ""}
        </div>
      )}
      {children}
    </footer>
  );
}
