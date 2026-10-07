"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/components/ui/cn";
import { useT } from "@/lib/i18n/client";
import { useAdmin } from "./AdminProvider";
import { can, type Permission } from "@/lib/auth/permissions";

const NAV: { href: string; key: string; icon: IconName; perm: Permission; badge?: "review" | "reports" }[] = [
  { href: "/admin", key: "overview", icon: "LayoutGrid", perm: "stats.view" },
  { href: "/admin/review", key: "review", icon: "ShieldCheck", perm: "jobs.view", badge: "review" },
  { href: "/admin/employers", key: "employers", icon: "Building2", perm: "employers.view" },
  { href: "/admin/jobs", key: "jobs", icon: "Briefcase", perm: "jobs.view" },
  { href: "/admin/reports", key: "reports", icon: "Flag", perm: "reports.view", badge: "reports" },
  { href: "/admin/training", key: "training", icon: "GraduationCap", perm: "training.view" },
  { href: "/admin/learning", key: "learning", icon: "BookOpen", perm: "learning.view" },
  { href: "/admin/languages", key: "languages", icon: "Languages", perm: "stats.view" },
  { href: "/admin/translations", key: "translations", icon: "Globe", perm: "translations.draft" },
  { href: "/admin/stations", key: "stations", icon: "Monitor", perm: "stations.view" },
  { href: "/admin/audit", key: "audit", icon: "FileText", perm: "audit.view" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useT();
  const { data } = useAdmin();
  const role = data?.session.role;
  const counts = {
    review: data ? data.employers.filter((e) => e.verification.status === "pending").length + data.jobs.filter((j) => j.status === "pending").length : 0,
    reports: data ? data.reports.filter((r) => r.status === "open").length : 0,
  };

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-xl border border-line-strong bg-gradient-to-br from-gold/25 to-transparent">
            <span className="font-display text-lg italic leading-none text-gold">k</span>
          </span>
          <span>
            <span className="block font-display text-lg leading-none tracking-[0.16em]">KAABIL</span>
            <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.2em] text-subtle">{t("admin.subtitle")}</span>
          </span>
        </Link>
        <nav aria-label="Admin" className="thin-scroll mt-8 flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {NAV.filter((n) => can(role, n.perm)).map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            const badge = n.badge ? counts[n.badge] : 0;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors", active ? "text-fg" : "text-muted hover:bg-glass hover:text-fg")}
              >
                {active && <motion.span layoutId="admin-active" className="glass absolute inset-0 rounded-xl" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                <Icon name={n.icon} className={cn("relative size-4", active && "text-gold")} />
                <span className="relative">{t(`admin.nav.${n.key}`)}</span>
                {badge > 0 && <span className="relative ml-auto rounded-full bg-gold/15 px-2 py-0.5 font-mono text-[0.65rem] text-gold">{badge}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t border-line pt-4">
          {data && (
            <div className="mb-3 px-3">
              <div className="truncate text-sm">{data.session.email}</div>
              <div className="text-xs text-subtle">{t(`admin.roles.${data.session.role}`)}</div>
            </div>
          )}
          <Link href="/" className="flex h-9 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-glass hover:text-fg">
            <Icon name="ArrowLeft" className="size-4" /> {t("admin.nav.viewApp")}
          </Link>
          <button onClick={logout} className="flex h-9 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-glass hover:text-fg">
            <Icon name="LogOut" className="size-4" /> {t("admin.nav.logout")}
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {/* Compact nav for narrow screens */}
        <div className="thin-scroll sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-line bg-bg/70 px-3 py-2 backdrop-blur-xl md:hidden">
          {NAV.filter((n) => can(role, n.perm)).map((n) => (
            <Link key={n.href} href={n.href} className={cn("whitespace-nowrap rounded-full px-3 py-1.5 text-xs", pathname === n.href ? "bg-glass-2 text-gold" : "text-muted")}>
              {t(`admin.nav.${n.key}`)}
            </Link>
          ))}
        </div>
        <main className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-10">{data ? children : <p className="text-sm text-subtle">{t("admin.common.loading")}</p>}</main>
      </div>
    </div>
  );
}
