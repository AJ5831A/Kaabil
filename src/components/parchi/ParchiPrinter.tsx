"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { celebrate } from "@/lib/celebrate";
import { track } from "@/lib/track";
import { useFeedback } from "@/lib/feedback";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";
import { PAPERS, PAPER_SPEC, type Paper } from "./ParchiSheet";

const PAPER_PREF = "kaabil_paper";

const PRINT_CSS = `
.parchi-print-portal { display: none; }
@media print {
  body > *:not(.parchi-print-portal) { display: none !important; }
  .parchi-print-portal { display: block !important; position: static !important; }
  .parchi-print-portal .parchi-sheet { box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; }
  html, body { margin: 0 !important; padding: 0 !important; }
}`;

/** Sets @page to the slip's exact size (thermal height measured from the DOM). */
function setPageSize(paper: Paper, el: HTMLElement | null) {
  const spec = PAPER_SPEC[paper];
  const h = spec.height ?? Math.ceil(((el?.offsetHeight ?? 600) * 25.4) / 96) + 4;
  let tag = document.getElementById("parchi-page-style") as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "parchi-page-style";
    document.head.appendChild(tag);
  }
  tag.textContent = `@media print { @page { size: ${spec.width}mm ${h}mm; margin: 0; } }`;
}

/**
 * Preview + paper size + print. `prepare` runs once before the first print to
 * obtain a serial / application id; the slip re-renders with it before printing.
 */
export function ParchiPrinter({
  type,
  prepare,
  children,
  extra,
}: {
  type: "profile" | "job" | "options";
  prepare: () => Promise<boolean>;
  children: (paper: Paper) => React.ReactNode;
  extra?: React.ReactNode;
}) {
  const { t } = useT();
  const animations = useApp((s) => s.settings.animations);
  const kiosk = useApp((s) => s.kiosk);
  const fb = useFeedback();
  const [paper, setPaper] = useState<Paper>(() => {
    try {
      const p = localStorage.getItem(PAPER_PREF) as Paper | null;
      if (p && PAPERS.includes(p)) return p;
    } catch {
      /* storage blocked */
    }
    return useApp.getState().kiosk.active ? "80mm" : "a5";
  });
  const [busy, setBusy] = useState(false);
  const [readyOnce, setReadyOnce] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // Scale the true-size preview down to fit narrow columns (screen only).
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const fit = () => {
      const avail = frame.clientWidth - 48;
      const sheetPx = (PAPER_SPEC[paper].width * 96) / 25.4;
      setZoom(Math.min(1, Math.max(0.4, avail / sheetPx)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(frame);
    return () => ro.disconnect();
  }, [paper]);

  const choose = (p: Paper) => {
    setPaper(p);
    try {
      localStorage.setItem(PAPER_PREF, p);
    } catch {
      /* ignore */
    }
  };

  const print = async () => {
    setBusy(true);
    try {
      const ok = await prepare();
      if (!ok) {
        toast.warn(t("common.error"));
        return;
      }
      if (!readyOnce) {
        setReadyOnce(true);
        fb.success();
        celebrate(animations);
        toast.ok(t("parchi.ready"));
      }
      track("parchi_printed", { station: kiosk.active ? kiosk.stationId : undefined });
      // Let the serial render, then size the page and print.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      setPageSize(paper, document.querySelector(".parchi-print-portal .parchi-sheet"));
      try {
        window.print();
      } catch {
        setBlocked(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  return (
    <div className="@container">
      {/* Print copy lives directly under <body>: no transformed/clipping ancestors. */}
      {mounted &&
        createPortal(
          <div className="parchi-print-portal print-root" aria-hidden>
            {children(paper)}
          </div>,
          document.body,
        )}
      <style>{PRINT_CSS}</style>
    <div className="grid gap-6 @2xl:grid-cols-[1fr_16rem] @4xl:grid-cols-[1fr_18rem] @4xl:gap-8">
      <div className="glass relative min-w-0 overflow-hidden rounded-[var(--radius-tile)]">
        <div ref={frameRef} className="thin-scroll flex max-h-[80vh] min-h-[26rem] justify-center overflow-auto bg-[radial-gradient(circle_at_50%_0%,var(--glass-2),transparent_70%)] px-6 py-8">
          <motion.div key={paper} style={{ zoom }} initial={{ opacity: 0, y: 16, rotate: -0.6 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 24 }} className="parchi-zoom h-fit" data-testid={`parchi-${type}`}>
            {children(paper)}
          </motion.div>
        </div>
      </div>

      <aside className="no-print space-y-6 @2xl:sticky @2xl:top-24 @2xl:self-start">
        <div>
          <div className="eyebrow mb-3">{t("parchi.paper.label")}</div>
          <TileGrid cols={2}>
            {PAPERS.map((p, i) => (
              <Tile key={p} index={i} square={false} size="sm" icon={PAPER_SPEC[p].thermal ? "Printer" : "FileText"} label={t(`parchi.paper.${p}`)} sub={t(`parchi.paper.${p}Sub`)} selected={paper === p} onClick={() => choose(p)} listen={false} className="!min-h-28" />
            ))}
          </TileGrid>
        </div>
        <Button variant="gold" size="xl" icon="Printer" className="w-full" onClick={print} disabled={busy}>
          {busy ? t("parchi.preparing") : t("parchi.print")}
        </Button>
        <div className="space-y-2.5 text-sm text-muted">
          <p className="flex gap-2.5"><Icon name="FileText" className="mt-0.5 size-4 shrink-0 text-gold" />{t("parchi.pdfHint")}</p>
          <p className={blocked ? "flex gap-2.5 text-warn" : "flex gap-2.5"}><Icon name="CircleAlert" className="mt-0.5 size-4 shrink-0 text-gold" />{t("parchi.blockedHint")}</p>
        </div>
        {extra}
      </aside>
    </div>
    </div>
  );
}
