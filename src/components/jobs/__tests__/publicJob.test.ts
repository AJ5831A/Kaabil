import { describe, expect, it } from "vitest";
import { toPublicJob } from "@/lib/db/repo";
import { createSeed } from "@/lib/db/seed";
import { isJobPublic } from "@/lib/verification";

describe("public job view", () => {
  const db = createSeed();
  const emp = new Map(db.employers.map((e) => [e.id, e]));
  const publicJobs = db.jobs.filter(isJobPublic).map((j) => toPublicJob(j, emp.get(j.employerId)));

  it("never exposes contact details for unverified listings", () => {
    const unverified = publicJobs.filter((j) => !j.verified);
    expect(unverified.length).toBeGreaterThan(0); // seed has an approved job from a pending employer
    for (const j of unverified) expect(j.contact).toBeUndefined();
  });

  it("includes contact details only when verified", () => {
    for (const j of publicJobs.filter((x) => x.verified)) expect(j.contact).toBeDefined();
  });

  it("keeps pending listings (e.g. the suspicious data-entry job) out of the public set", () => {
    expect(publicJobs.map((j) => j.id)).not.toContain("j14");
  });

  it("does not leak employer verification internals", () => {
    for (const j of publicJobs) {
      expect(Object.keys(j.employer).sort()).toEqual(["id", "name", "verified"]);
      expect(JSON.stringify(j)).not.toContain("verifiedBy");
    }
  });
});
