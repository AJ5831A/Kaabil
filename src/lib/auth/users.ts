import type { Role } from "@/lib/types";
import { safeEqual } from "./session";

interface Account {
  email: string;
  password: string;
  role: Role;
  stationId?: string;
}

/**
 * Accounts come from env. Dev defaults exist ONLY outside production;
 * in production a missing env pair simply disables that login.
 */
export function accounts(): Account[] {
  const dev = process.env.NODE_ENV !== "production";
  const list: Account[] = [];
  const adminEmail = process.env.ADMIN_EMAIL || (dev ? "admin@kaabil.local" : "");
  const adminPass = process.env.ADMIN_PASSWORD || (dev ? "kaabil-admin" : "");
  if (adminEmail && adminPass) list.push({ email: adminEmail.toLowerCase(), password: adminPass, role: "admin" });
  const wEmail = process.env.CENTRE_WORKER_EMAIL || (dev ? "worker@kaabil.local" : "");
  const wPass = process.env.CENTRE_WORKER_PASSWORD || (dev ? "kaabil-worker" : "");
  if (wEmail && wPass)
    list.push({ email: wEmail.toLowerCase(), password: wPass, role: "centre_worker", stationId: process.env.CENTRE_WORKER_STATION || "s1" });
  return list;
}

export function checkCredentials(email: string, password: string): Omit<Account, "password"> | null {
  const e = email.trim().toLowerCase();
  let match: Account | null = null;
  // Compare against every account so timing doesn't reveal which emails exist.
  for (const a of accounts()) {
    const okE = safeEqual(a.email, e);
    const okP = safeEqual(a.password, password);
    if (okE && okP) match = a;
  }
  if (!match) return null;
  return { email: match.email, role: match.role, stationId: match.stationId };
}
