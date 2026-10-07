import { describe, expect, it } from "vitest";
import { isEmployerVerified, isJobApproved, isJobPublic, isJobVerified } from "@/lib/verification";
import type { Employer, Job } from "@/lib/types";

const employer = (over: Partial<Employer["verification"]> = {}, id = "e1"): Employer => ({
  id,
  name: "Test Employer",
  townId: "pilani",
  sector: { en: "Food" },
  about: { en: "About" },
  contact: { address: { en: "Pilani" } },
  verification: { status: "verified", verifiedBy: "admin@kaabil.local", verifiedAt: "2026-09-01T00:00:00Z", ...over },
  createdAt: "2026-09-01T00:00:00Z",
});

const job = (over: Partial<Job> = {}): Job => ({
  id: "j1",
  employerId: "e1",
  category: "kitchen_helper",
  description: { en: "Help in kitchen" },
  townId: "pilani",
  lat: 28.367,
  lng: 75.604,
  payMin: 10000,
  payMax: 12000,
  payPeriod: "month",
  type: "full_time",
  shift: { start: "09:00", end: "18:00" },
  hoursBand: "day",
  skills: ["cooking"],
  experience: "none",
  training: "provided",
  joining: { en: "" },
  contactNote: { en: "" },
  openings: 1,
  status: "approved",
  approvedBy: "admin@kaabil.local",
  approvedAt: "2026-09-01T00:00:00Z",
  createdAt: "2026-09-01T00:00:00Z",
  ...over,
});

describe("verification rule: employer verified AND listing approved", () => {
  it("is verified only when both are approved by an admin", () => {
    expect(isJobVerified(job(), employer())).toBe(true);
  });

  it.each([
    ["employer pending", job(), employer({ status: "pending" })],
    ["employer unverified", job(), employer({ status: "unverified" })],
    ["employer rejected", job(), employer({ status: "rejected" })],
    ["employer verified without verifiedBy", job(), employer({ verifiedBy: undefined })],
    ["employer verified without verifiedAt", job(), employer({ verifiedAt: undefined })],
    ["listing pending", job({ status: "pending" }), employer()],
    ["listing draft", job({ status: "draft" }), employer()],
    ["listing rejected", job({ status: "rejected" }), employer()],
    ["listing archived", job({ status: "archived" }), employer()],
    ["listing approved without approvedBy", job({ approvedBy: undefined }), employer()],
    ["listing approved without approvedAt", job({ approvedAt: undefined }), employer()],
    ["employer id mismatch", job({ employerId: "e2" }), employer()],
  ])("is NOT verified when %s", (_label, j, e) => {
    expect(isJobVerified(j, e)).toBe(false);
  });

  it("handles missing records", () => {
    expect(isJobVerified(null, employer())).toBe(false);
    expect(isJobVerified(job(), undefined)).toBe(false);
    expect(isEmployerVerified(null)).toBe(false);
    expect(isJobApproved(undefined)).toBe(false);
  });

  it("only approved listings are public", () => {
    expect(isJobPublic(job())).toBe(true);
    for (const status of ["draft", "pending", "rejected", "archived"] as const) {
      expect(isJobPublic(job({ status }))).toBe(false);
    }
  });
});
