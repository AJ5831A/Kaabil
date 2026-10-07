"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { cn } from "@/components/ui/cn";

export function ParchiTabs() {
  const { t } = useT();
  const pathname = usePathname();
  const n = useApp((s) => s.parchiJobs.length);
  const tabs = [
    { href: "/parchi", label: t("parchi.tabs.profile") },
    { href: "/parchi/options", label: `${t("parchi.tabs.options")}${n ? ` · ${n}` : ""}` },
  ];
  return (
    <nav className="glass mb-8 inline-flex rounded-full p-1" aria-label={t("common.nav.parchi")}>
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={cn("relative h-10 rounded-full px-5 text-sm leading-10 transition-colors", active ? "text-gold-ink" : "text-muted hover:text-fg")}>
            {active && <motion.span layoutId="parchi-tab" className="absolute inset-0 rounded-full bg-gold" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className="relative">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
