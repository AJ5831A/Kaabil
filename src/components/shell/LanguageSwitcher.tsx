"use client";

import { useState } from "react";
import { LOCALES } from "@/lib/i18n/config";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { LanguageTiles } from "./LanguageTiles";
import { cn } from "@/components/ui/cn";

export function LanguageButton({ className, showLabel = true }: { className?: string; showLabel?: boolean }) {
  const [open, setOpen] = useState(false);
  const locale = useApp((s) => s.locale);
  const { t } = useT();
  const current = LOCALES.find((l) => l.code === locale);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("common.nav.language")}
        className={cn("glass inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm text-fg hover:bg-glass-2", className)}
      >
        <Icon name="Globe" className="size-4 text-gold" />
        {showLabel && <span>{current?.label}</span>}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("common.nav.language")} wide>
        <LanguageTiles onPick={() => setOpen(false)} />
      </Modal>
    </>
  );
}
