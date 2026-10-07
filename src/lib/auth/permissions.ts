import type { Role } from "@/lib/types";

export const PERMISSIONS = {
  "stats.view": ["admin", "centre_worker"],
  "jobs.view": ["admin", "centre_worker"],
  "jobs.create": ["admin", "centre_worker"],
  "jobs.edit": ["admin"],
  "jobs.approve": ["admin"],
  "employers.view": ["admin", "centre_worker"],
  "employers.create": ["admin", "centre_worker"],
  "employers.verify": ["admin"],
  "reports.view": ["admin", "centre_worker"],
  "reports.manage": ["admin", "centre_worker"],
  "listing.archive": ["admin"],
  "training.view": ["admin", "centre_worker"],
  "training.manage": ["admin"],
  "learning.view": ["admin", "centre_worker"],
  "languages.manage": ["admin"],
  "translations.draft": ["admin"],
  "translations.review": ["admin"],
  "translations.publish": ["admin"],
  "stations.view": ["admin", "centre_worker"],
  "stations.manage": ["admin"],
  "audit.view": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, perm: Permission): boolean {
  return !!role && (PERMISSIONS[perm] as readonly Role[]).includes(role);
}
