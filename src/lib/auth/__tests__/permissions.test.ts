import { describe, expect, it } from "vitest";
import { can, PERMISSIONS, type Permission } from "../permissions";

describe("role permissions", () => {
  it("admin can do everything", () => {
    for (const p of Object.keys(PERMISSIONS) as Permission[]) expect(can("admin", p)).toBe(true);
  });

  it("centre worker can add but never verify or approve", () => {
    expect(can("centre_worker", "jobs.create")).toBe(true);
    expect(can("centre_worker", "employers.create")).toBe(true);
    expect(can("centre_worker", "reports.manage")).toBe(true);
    expect(can("centre_worker", "stats.view")).toBe(true);
    for (const p of ["employers.verify", "jobs.approve", "jobs.edit", "listing.archive", "translations.publish", "languages.manage", "stations.manage", "audit.view"] as Permission[])
      expect(can("centre_worker", p)).toBe(false);
  });

  it("no role means no access", () => {
    expect(can(null, "stats.view")).toBe(false);
    expect(can(undefined, "jobs.view")).toBe(false);
  });
});
