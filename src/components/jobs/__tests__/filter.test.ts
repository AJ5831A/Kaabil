import { describe, expect, it } from "vitest";
import { filterJobs, JobFiltersSchema } from "@/lib/jobs/filter";
import { townById } from "@/lib/geo/towns";
import type { PublicJob } from "@/lib/types";

function job(p: Partial<PublicJob> & { id: string; townId: string }): PublicJob {
  const town = townById(p.townId)!;
  return {
    category: "kitchen_helper",
    description: { en: "" },
    employer: { id: "e", name: "Test Employer", verified: true },
    lat: town.lat,
    lng: town.lng,
    payMin: 8000,
    payMax: 10000,
    payPeriod: "month",
    type: "full_time",
    shift: { start: "09:00", end: "17:00" },
    hoursBand: "day",
    skills: ["cooking"],
    experience: "none",
    training: "provided",
    joining: { en: "" },
    contactNote: { en: "" },
    openings: 1,
    verified: true,
    ...p,
  };
}

const JOBS: PublicJob[] = [
  job({ id: "pilani-cook", townId: "pilani", payMax: 12000 }),
  job({ id: "chirawa-sew", townId: "chirawa", category: "tailoring_assistant", skills: ["sewing"], type: "part_time", hoursBand: "flexible", payMax: 7000 }),
  job({ id: "jaipur-pack", townId: "jaipur", category: "packing_helper", skills: ["packing"], hoursBand: "evening", payMax: 15000 }),
  job({ id: "pilani-unverified", townId: "pilani", verified: false, payMax: 20000, employer: { id: "x", name: "Unverified Co", verified: false } }),
];
const ids = (xs: PublicJob[]) => xs.map((j) => j.id);

describe("filterJobs", () => {
  it("computes distance from the chosen town and filters by radius", () => {
    const out = filterJobs(JOBS, { townId: "pilani", maxDistanceKm: 25 });
    expect(ids(out)).toEqual(["pilani-cook", "chirawa-sew", "pilani-unverified"]);
    expect(out.find((j) => j.id === "chirawa-sew")!.distanceKm).toBeGreaterThan(10);
    expect(out.find((j) => j.id === "chirawa-sew")!.distanceKm).toBeLessThan(20);
  });

  it("ignores the radius when no town is selected", () => {
    expect(filterJobs(JOBS, { maxDistanceKm: 5 })).toHaveLength(4);
  });

  it("filters by minimum pay against the top of the range", () => {
    expect(ids(filterJobs(JOBS, { minPay: 11000 }))).toEqual(["jaipur-pack", "pilani-cook", "pilani-unverified"]);
  });

  it("filters by full/part-time", () => {
    expect(ids(filterJobs(JOBS, { type: "part_time" }))).toEqual(["chirawa-sew"]);
  });

  it("treats flexible-hours jobs as matching any hours band", () => {
    expect(ids(filterJobs(JOBS, { hoursBand: "evening" })).sort()).toEqual(["chirawa-sew", "jaipur-pack"]);
  });

  it("filters by skill and category", () => {
    expect(ids(filterJobs(JOBS, { skill: "sewing" }))).toEqual(["chirawa-sew"]);
    expect(ids(filterJobs(JOBS, { category: "packing_helper" }))).toEqual(["jaipur-pack"]);
  });

  it("verifiedOnly removes unverified listings", () => {
    expect(ids(filterJobs(JOBS, { verifiedOnly: true }))).not.toContain("pilani-unverified");
  });

  it("always ranks verified listings above unverified ones, whatever the sort", () => {
    const byPay = filterJobs(JOBS, { sort: "pay" });
    expect(byPay.at(-1)!.id).toBe("pilani-unverified"); // highest pay, but unverified
    expect(ids(byPay).slice(0, 3)).toEqual(["jaipur-pack", "pilani-cook", "chirawa-sew"]);
    const byDistance = filterJobs(JOBS, { townId: "pilani", sort: "distance" });
    expect(byDistance.at(-1)!.id).toBe("pilani-unverified");
    expect(byDistance[0].id).toBe("pilani-cook");
  });

  it("parses query-string filters, including verifiedOnly=false", () => {
    expect(JobFiltersSchema.parse({ verifiedOnly: "false" }).verifiedOnly).toBe(false);
    expect(JobFiltersSchema.parse({ verifiedOnly: "true", maxDistanceKm: "25" })).toEqual({ verifiedOnly: true, maxDistanceKm: 25 });
    expect(JobFiltersSchema.safeParse({ type: "gig" }).success).toBe(false);
  });

  it("does not mutate its input", () => {
    const copy = structuredClone(JOBS);
    filterJobs(JOBS, { townId: "pilani", sort: "pay" });
    expect(JOBS).toEqual(copy);
  });
});
