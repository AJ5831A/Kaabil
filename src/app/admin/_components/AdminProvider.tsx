"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminSnapshot } from "@/lib/db/admin";
import type { Role } from "@/lib/types";
import { toast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";

export type Snapshot = AdminSnapshot & { session: { email: string; role: Role; stationId?: string } };

interface Ctx {
  data: Snapshot | null;
  refresh: () => Promise<void>;
  /** POST to an admin API route; toasts errors; returns parsed result or null. */
  post: <T = unknown>(path: string, body: unknown, okMsg?: string) => Promise<T | null>;
  isAdmin: boolean;
}

const C = createContext<Ctx | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const router = useRouter();
  const { t } = useT();

  const refresh = useCallback(async () => {
    const r = await fetch("/api/admin/snapshot", { cache: "no-store" });
    if (r.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (r.ok) setData(await r.json());
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    refresh();
  }, [refresh]);

  const post = useCallback(
    async <T,>(path: string, body: unknown, okMsg?: string): Promise<T | null> => {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        router.replace("/admin/login");
        return null;
      }
      if (!r.ok) {
        toast.warn(r.status === 403 ? t("admin.common.forbidden") : (j.message as string) || t("admin.common.error"));
        return null;
      }
      if (okMsg !== "") toast.ok(okMsg ?? t("admin.common.saved"));
      await refresh();
      return (j.result ?? j) as T;
    },
    [refresh, router, t],
  );

  return <C.Provider value={{ data, refresh, post, isAdmin: data?.session.role === "admin" }}>{children}</C.Provider>;
}

export function useAdmin() {
  const c = useContext(C);
  if (!c) throw new Error("useAdmin outside AdminProvider");
  return c;
}
