"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSpeaker } from "@/lib/voice/useSpeaker";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";

/** Collects readable text from the current screen, skipping controls marked aria-hidden / data-noread. */
export function readScreenText(): string {
  const main = document.querySelector<HTMLElement>("[data-screen]");
  if (!main) return "";
  const clone = main.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[aria-hidden='true'],[data-noread],script,style,svg,button[aria-label]").forEach((n) => n.remove());
  return (clone.innerText || clone.textContent || "").replace(/\s+\n/g, "\n").replace(/\n{2,}/g, ". ").replace(/\s{2,}/g, " ").trim().slice(0, 1800);
}

export function ScreenReaderButton({ inline }: { inline?: boolean }) {
  const { speak, stop, speaking, id } = useSpeaker();
  const { t } = useT();
  const autoRead = useApp((s) => s.settings.autoRead);
  const pathname = usePathname();
  const active = speaking && id === "screen";

  useEffect(() => {
    if (!autoRead) return;
    const tm = setTimeout(() => speak(readScreenText(), "screen"), 700);
    return () => clearTimeout(tm);
  }, [autoRead, pathname, speak]);

  return (
    <button
      onClick={() => (active ? stop() : speak(readScreenText(), "screen"))}
      aria-label={t("common.voice.listenScreen")}
      className={cn(
        inline
          ? "glass hidden h-10 items-center gap-2 rounded-full px-3.5 text-sm hover:bg-glass-2 lg:inline-flex"
          : "no-print glass-strong fixed bottom-24 left-4 z-40 inline-flex size-12 items-center justify-center rounded-full lg:hidden",
        active && "!border-gold/60 text-gold",
      )}
    >
      <Icon name={active ? "Pause" : "Volume2"} className="size-4 text-gold" />
      {inline && <span>{t("common.voice.listenScreen")}</span>}
    </button>
  );
}
