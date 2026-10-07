import { beforeEach, describe, expect, it } from "vitest";
import { createSeed } from "../seed";
import {
  AdminError, addTranslationDraft, archiveFromReport, createEmployer, createJob, decideEmployer, publishTranslation,
  reviewTranslation, setJobStatus, setReportStatus, suspicionFlags, updateJob, type Actor,
} from "../admin-core";
import { toPublicJobForTest } from "./helpers";
import type { Database } from "@/lib/types";

const admin: Actor = { email: "admin@kaabil.local", role: "admin" };
const worker: Actor = { email: "worker@kaabil.local", role: "centre_worker", stationId: "s1" };

const employerInput = {
  name: "Test Dhaba",
  townId: "pilani",
  sector: { en: "Food" },
  about: { en: "Roadside dhaba" },
  contact: { address: { en: "NH 52" } },
};
const jobInput = (employerId: string) => ({
  employerId,
  category: "cook",
  description: { en: "Cook rotis" },
  townId: "pilani",
  payMin: 9000,
  payMax: 11000,
  payPeriod: "month",
  type: "full_time",
  shift: { start: "08:00", end: "16:00" },
  hoursBand: "day",
  skills: ["cooking"],
  experience: "none",
  training: "on_job",
  joining: { en: "Join Monday" },
  contactNote: { en: "Ask for owner" },
  openings: 2,
});

let db: Database;
beforeEach(() => {
  db = createSeed();
});

describe("never auto-verify", () => {
  it("new employers and jobs start pending even when created by an admin", () => {
    const e = createEmployer(db, admin, employerInput);
    expect(e.verification.status).toBe("pending");
    const j = createJob(db, admin, jobInput(e.id));
    expect(j.status).toBe("pending");
    expect(j.approvedBy).toBeUndefined();
  });
});

describe("role enforcement", () => {
  it("centre worker can add, but cannot verify employers or approve jobs", () => {
    const e = createEmployer(db, worker, employerInput);
    const j = createJob(db, worker, jobInput(e.id));
    expect(() => decideEmployer(db, worker, e.id, "verified", "looked ok")).toThrow(AdminError);
    expect(() => setJobStatus(db, worker, j.id, "approved")).toThrow(AdminError);
    expect(() => updateJob(db, worker, j.id, jobInput(e.id))).toThrow(AdminError);
    expect(db.employers.find((x) => x.id === e.id)!.verification.status).toBe("pending");
    expect(db.jobs.find((x) => x.id === j.id)!.status).toBe("pending");
  });

  it("centre worker manages reports only in their station's town", () => {
    db.reports.push({ id: "r1", jobId: "j1", reason: "wrong_info", status: "open", createdAt: "" }); // pilani = s1 town
    db.reports.push({ id: "r2", jobId: "j11", reason: "fake", status: "open", createdAt: "" }); // sikar
    expect(setReportStatus(db, worker, "r1", "resolved").status).toBe("resolved");
    expect(() => setReportStatus(db, worker, "r2", "resolved")).toThrow(AdminError);
    expect(() => archiveFromReport(db, worker, "r1")).toThrow(AdminError);
  });

  it("every mutation is audited with the actor", () => {
    const before = db.audit.length;
    const e = createEmployer(db, worker, employerInput);
    decideEmployer(db, admin, e.id, "verified", "visited premises");
    expect(db.audit.length).toBe(before + 2);
    expect(db.audit.at(-1)).toMatchObject({ actor: admin.email, role: "admin", action: "employer.verified", target: e.id });
  });
});

describe("verification rule end-to-end", () => {
  it("approving a job of an unverified employer does NOT make it verified", () => {
    const e = createEmployer(db, admin, employerInput);
    const j = createJob(db, admin, jobInput(e.id));
    setJobStatus(db, admin, j.id, "approved");
    expect(toPublicJobForTest(db, j.id).verified).toBe(false);
  });

  it("verified employer + approved listing => verified; editing re-queues it", () => {
    const e = createEmployer(db, admin, employerInput);
    const j = createJob(db, admin, jobInput(e.id));
    decideEmployer(db, admin, e.id, "verified", "checked");
    expect(toPublicJobForTest(db, j.id).verified).toBe(false); // listing still pending
    setJobStatus(db, admin, j.id, "approved");
    const pub = toPublicJobForTest(db, j.id);
    expect(pub.verified).toBe(true);
    expect(db.employers.find((x) => x.id === e.id)!.verification.verifiedBy).toBe(admin.email);
    updateJob(db, admin, j.id, { ...jobInput(e.id), payMax: 12000 });
    expect(db.jobs.find((x) => x.id === j.id)!.status).toBe("pending");
    expect(toPublicJobForTest(db, j.id).verified).toBe(false);
  });

  it("un-verifying an employer immediately removes the badge from its listings", () => {
    expect(toPublicJobForTest(db, "j1").verified).toBe(true);
    decideEmployer(db, admin, "e1", "pending");
    expect(toPublicJobForTest(db, "j1").verified).toBe(false);
  });
});

describe("translation workflow (B4)", () => {
  it("a machine draft cannot be published without human review", () => {
    const d = addTranslationDraft(db, admin, { key: "job:j1:description", locale: "mr", draft: "मशीन अनुवाद", origin: "machine" });
    expect(d.status).toBe("machine_draft");
    expect(() => publishTranslation(db, admin, d.id)).toThrow(/review/i);
    expect(db.jobs.find((j) => j.id === "j1")!.description.mr).toBeUndefined();
  });

  it("after review, publishing writes into the listing", () => {
    const d = addTranslationDraft(db, admin, { key: "job:j1:description", locale: "mr", draft: "मशीन अनुवाद", origin: "machine" });
    reviewTranslation(db, admin, d.id, "स्वयंपाक्याला मदत करणे");
    const p = publishTranslation(db, admin, d.id);
    expect(p.status).toBe("published");
    expect(db.jobs.find((j) => j.id === "j1")!.description.mr).toBe("स्वयंपाक्याला मदत करणे");
    expect(() => publishTranslation(db, admin, d.id)).toThrow(AdminError);
  });

  it("centre workers cannot draft or publish translations", () => {
    expect(() => addTranslationDraft(db, worker, { key: "job:j1:description", locale: "mr", draft: "x", origin: "human" })).toThrow(AdminError);
  });

  it("rejects unknown keys (no arbitrary field writes)", () => {
    expect(() => addTranslationDraft(db, admin, { key: "job:j1:status", locale: "mr", draft: "approved", origin: "human" })).toThrow(AdminError);
    expect(() => addTranslationDraft(db, admin, { key: "employer:e1:verification", locale: "hi", draft: "x", origin: "human" })).toThrow(AdminError);
  });
});

describe("suspicion heuristics", () => {
  it("flags fee / whatsapp / injection text on the seeded scam listing", () => {
    const j14 = db.jobs.find((j) => j.id === "j14")!;
    const flags = suspicionFlags(db, j14);
    expect(flags).toEqual(expect.arrayContaining(["fee", "whatsapp_only", "instructions", "employer_unverified", "pay_too_high", "many_openings"]));
    expect(suspicionFlags(db, db.jobs.find((j) => j.id === "j1")!)).toEqual([]);
  });
});
