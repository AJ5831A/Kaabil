"use client";

import { useId } from "react";
import { cn } from "./cn";
import { Icon } from "./Icon";
import { useSpeaker } from "@/lib/voice/useSpeaker";
import { useT } from "@/lib/i18n/client";

/** 🔊 control available on every tile, card, lesson step and message. */
export function ListenButton({
  text,
  className,
  size = "sm",
  label,
}: {
  text: string | (() => string);
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  const id = useId();
  const { speak, stop, speaking, id: activeId } = useSpeaker();
  const { t } = useT();
  const active = speaking && activeId === id;
  return (
    <button
      type="button"
      aria-label={label ?? (active ? t("common.voice.stop") : t("common.voice.listen"))}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (active) stop();
        else speak(typeof text === "function" ? text() : text, id);
      }}
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-gold",
        size === "sm" ? "size-9" : "size-11",
        active && "border-line-strong text-gold",
        className,
      )}
    >
      {active && <span className="absolute inset-0 animate-ping rounded-full border border-gold/40" />}
      <Icon name={active ? "Pause" : "Volume2"} className={size === "sm" ? "size-4" : "size-5"} />
    </button>
  );
}
