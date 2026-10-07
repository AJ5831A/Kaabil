"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store/app";
import { cn } from "@/components/ui/cn";
import { SaathiChat } from "./SaathiChat";
import { useIsXL } from "./useIsXL";

/**
 * variant "panel": persistent right column on ≥xl (mounted by AppShell).
 * variant "sheet": content of the mobile/tablet bottom sheet (see SaathiLauncher).
 * variant "page": full-screen /saathi (Simple Mode, kiosk).
 */
export function SaathiPanel({ variant, onClose }: { variant: "panel" | "sheet" | "page"; onClose?: () => void }) {
  const isXL = useIsXL();
  const [flash, setFlash] = useState(0);

  // On desktop the panel is always visible: "open Saathi" just draws attention to it.
  useEffect(() => {
    if (variant !== "panel" || !isXL) return;
    const consume = (open: boolean) => {
      if (!open) return;
      useApp.getState().setSaathiOpen(false);
      setFlash(Date.now());
    };
    queueMicrotask(() => consume(useApp.getState().saathiOpen));
    return useApp.subscribe((s, prev) => s.saathiOpen !== prev.saathiOpen && consume(s.saathiOpen));
  }, [variant, isXL]);

  const active = variant === "page" || (variant === "panel" ? isXL : !isXL);

  return (
    <div className={cn("relative h-full", variant === "panel" && "bg-bg-2/30 backdrop-blur-xl")}>
      {variant === "panel" && flash > 0 && (
        <div key={flash} className="pointer-events-none absolute inset-0 animate-[pulse_1.2s_ease-out_1] border-l-2 border-gold/60" aria-hidden />
      )}
      <SaathiChat key={variant} variant={variant} active={active} onClose={onClose} autoFocus={variant === "panel" && flash > 0} />
    </div>
  );
}
