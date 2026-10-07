"use client";

import { cn } from "./cn";
import { Icon } from "./Icon";
import { useT } from "@/lib/i18n/client";

export function Pill({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "gold" | "ok" | "warn" | "danger"; className?: string }) {
  const tones = {
    neutral: "border-line text-muted",
    gold: "border-gold/35 text-gold bg-gold/10",
    ok: "border-transparent text-ok bg-ok-bg",
    warn: "border-transparent text-warn bg-warn-bg",
    danger: "border-transparent text-danger bg-danger-bg",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

/**
 * The ONLY component that renders a verification label. `verified` must come
 * from server-computed PublicJob.verified (employer verified AND listing approved).
 * Shape + text + colour so it is colour-blind safe.
 */
export function VerificationBadge({ verified, compact }: { verified: boolean; compact?: boolean }) {
  const { t } = useT();
  return verified ? (
    <Pill tone="ok">
      <Icon name="ShieldCheck" className="size-3.5" />
      {compact ? t("common.trust.verifiedShort") : t("common.trust.verified")}
    </Pill>
  ) : (
    <Pill tone="warn">
      <Icon name="CircleAlert" className="size-3.5" />
      {compact ? t("common.trust.notVerifiedShort") : t("common.trust.notVerified")}
    </Pill>
  );
}
