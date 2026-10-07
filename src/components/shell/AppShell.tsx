"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mesh } from "./Mesh";
import { Logo } from "./Logo";
import { NAV, isActive } from "./nav";
import { LanguageButton } from "./LanguageSwitcher";
import { ScreenReaderButton } from "./ScreenReaderButton";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { useT } from "@/lib/i18n/client";
import { useApp } from "@/lib/store/app";
import { SaathiPanel } from "@/components/saathi/SaathiPanel";
import { SaathiLauncher } from "@/components/saathi/SaathiLauncher";
import { KioskLayer } from "@/components/station/KioskLayer";

function SimpleToggle() {
  const simple = useApp((s) => s.settings.simpleMode);
  const update = useApp((s) => s.updateSettings);
  const { t } = useT();
  return (
    <button
      onClick={() => update({ simpleMode: !simple })}
      aria-pressed={simple}
      aria-label={t("common.nav.simpleMode")}
      className={cn("glass inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm hover:bg-glass-2", simple && "!border-gold/50 text-gold")}
    >
      <Icon name="Accessibility" className="size-4 text-gold" />
      <span className="hidden sm:inline">{t("common.nav.simpleMode")}</span>
    </button>
  );
}

function SideRail() {
  const pathname = usePathname();
  const { t } = useT();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-4 py-6 lg:flex">
      <div className="px-2">
        <Logo />
        <p className="mt-3 text-[0.72rem] leading-snug text-subtle">हर हुनर को मिले सही दिशा</p>
      </div>
      <nav aria-label="Primary" className="mt-10 flex flex-col gap-1">
        {NAV.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-xl px-3 text-[0.94rem] transition-colors",
                active ? "text-fg" : "text-muted hover:bg-glass hover:text-fg",
              )}
            >
              {active && (
                <motion.span layoutId="rail-active" className="glass absolute inset-0 rounded-xl" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              )}
              <Icon name={n.icon} className={cn("relative size-[1.1rem]", active && "text-gold")} />
              <span className="relative">{t(`common.nav.${n.key}`)}</span>
              {active && <span className="relative ml-auto size-1.5 rounded-full bg-gold" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <Link href="/station" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-glass hover:text-fg">
          <Icon name="Monitor" className="size-4" /> {t("common.nav.station")}
        </Link>
        <Link href="/settings" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-glass hover:text-fg">
          <Icon name="Settings" className="size-4" /> {t("common.nav.settings")}
        </Link>
      </div>
    </aside>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const { t } = useT();
  const items = NAV.filter((n) => n.key !== "profile");
  return (
    <nav aria-label="Primary" className="glass-strong fixed inset-x-3 bottom-3 z-40 flex h-16 items-stretch justify-around rounded-[1.4rem] px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {items.map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("relative flex min-w-14 flex-1 flex-col items-center justify-center gap-1 text-[0.68rem]", active ? "text-gold" : "text-muted")}>
            {active && <motion.span layoutId="bn-active" className="absolute inset-x-3 top-1.5 h-0.5 rounded-full bg-gold" />}
            <Icon name={n.icon} className="size-5" />
            {t(`common.nav.${n.key}`)}
          </Link>
        );
      })}
    </nav>
  );
}

function TopBar() {
  const { t } = useT();
  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line/60 bg-bg/40 px-4 backdrop-blur-xl sm:px-6 lg:h-[4.5rem] lg:border-transparent lg:bg-bg/30">
      <div className="lg:hidden">
        <Logo />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span data-secondary className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-subtle md:inline-flex">
          <span className="size-1.5 rounded-full bg-warn" /> {t("common.demo")}
        </span>
        <ScreenReaderButton inline />
        <SimpleToggle />
        <LanguageButton />
        <Link href="/settings" aria-label={t("common.nav.settings")} className="glass grid size-10 place-items-center rounded-full lg:hidden">
          <Icon name="Settings" className="size-4" />
        </Link>
      </div>
    </header>
  );
}

/** Redirect first-time visitors to the language-first onboarding. */
function OnboardingGate() {
  const hydrated = useApp((s) => s.hydrated);
  const chosen = useApp((s) => s.localeChosen);
  const kiosk = useApp((s) => s.kiosk.active);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (hydrated && !chosen && !kiosk && pathname !== "/welcome" && !pathname.startsWith("/p/")) router.replace("/welcome");
  }, [hydrated, chosen, kiosk, pathname, router]);
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const { t } = useT();
  const saathiPage = pathname.startsWith("/saathi");

  // Move focus to main content on route change (screen readers + keyboard).
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh">
      <Mesh />
      <OnboardingGate />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-gold-ink">
        {t("common.nav.skipToContent")}
      </a>
      <SideRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            id="main"
            ref={mainRef}
            tabIndex={-1}
            data-screen
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-6 outline-none sm:px-6 lg:px-10 lg:pb-16"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
      {!saathiPage && (
        <aside className="no-print sticky top-0 hidden h-dvh w-[25rem] shrink-0 border-l border-line xl:block" aria-label={t("common.brand.saathi")}>
          <SaathiPanel variant="panel" />
        </aside>
      )}
      {!saathiPage && <SaathiLauncher />}
      <ScreenReaderButton />
      <BottomNav />
      <KioskLayer />
    </div>
  );
}
