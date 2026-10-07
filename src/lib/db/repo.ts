import "server-only";
import { readDb, mutateDb } from "./store";
import { isEmployerVerified, isJobPublic, isJobVerified } from "@/lib/verification";
import { filterJobs, type JobFilters } from "@/lib/jobs/filter";
import type { Employer, Job, PublicJob, Report, UsageEvent } from "@/lib/types";

export function toPublicJob(job: Job, employer: Employer | undefined): PublicJob {
  const verified = isJobVerified(job, employer);
  return {
    id: job.id,
    category: job.category,
    title: job.title,
    description: job.description,
    employer: { id: job.employerId, name: employer?.name ?? "—", verified: isEmployerVerified(employer) },
    townId: job.townId,
    lat: job.lat,
    lng: job.lng,
    payMin: job.payMin,
    payMax: job.payMax,
    payPeriod: job.payPeriod,
    type: job.type,
    shift: job.shift,
    hoursBand: job.hoursBand,
    skills: job.skills,
    experience: job.experience,
    training: job.training,
    joining: job.joining,
    contactNote: job.contactNote,
    // Do not expose contact details for unverified employers.
    contact: verified && employer ? employer.contact : undefined,
    openings: job.openings,
    verified,
  };
}

export async function listPublicJobs(): Promise<PublicJob[]> {
  const db = await readDb();
  const emp = new Map(db.employers.map((e) => [e.id, e]));
  return db.jobs.filter(isJobPublic).map((j) => toPublicJob(j, emp.get(j.employerId)));
}

export async function searchJobs(filters: JobFilters): Promise<PublicJob[]> {
  return filterJobs(await listPublicJobs(), filters);
}

export async function getPublicJob(id: string): Promise<PublicJob | null> {
  const db = await readDb();
  const job = db.jobs.find((j) => j.id === id);
  if (!job || !isJobPublic(job)) return null;
  return toPublicJob(job, db.employers.find((e) => e.id === job.employerId));
}

export async function getPublicJobs(ids: string[]): Promise<PublicJob[]> {
  const all = await listPublicJobs();
  return ids.map((id) => all.find((j) => j.id === id)).filter((j): j is PublicJob => !!j);
}

export async function listTraining(skill?: string, townId?: string) {
  const db = await readDb();
  return db.training
    .filter((t) => t.status === "approved")
    .filter((t) => !skill || t.skill === skill)
    .sort((a, b) => Number(b.townId === townId) - Number(a.townId === townId));
}

export async function listStations(townId?: string) {
  const db = await readDb();
  return db.stations.filter((s) => s.active).sort((a, b) => Number(b.townId === townId) - Number(a.townId === townId));
}

function shortId(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${s}`;
}

export async function recordInterest(jobId: string, kaabilId: string) {
  return mutateDb((db) => {
    const existing = db.interests.find((i) => i.jobId === jobId && i.kaabilId === kaabilId);
    if (existing) return existing;
    const rec = { id: shortId("KBL"), jobId, kaabilId, createdAt: new Date().toISOString() };
    db.interests.push(rec);
    return rec;
  });
}

export async function recordParchi(input: { type: "profile" | "job" | "options"; kaabilId?: string; jobIds?: string[]; assisted: boolean }) {
  return mutateDb((db) => {
    const rec = { id: shortId("PCH"), ...input, createdAt: new Date().toISOString() };
    db.parchi.push(rec);
    return rec;
  });
}

export async function createReport(input: Pick<Report, "jobId" | "reason" | "note">) {
  return mutateDb((db) => {
    const rec: Report = { id: shortId("RPT"), ...input, status: "open", createdAt: new Date().toISOString() };
    db.reports.push(rec);
    return rec;
  });
}

/** Anonymous usage only: no ids, no personal data. */
export async function logEvent(e: Omit<UsageEvent, "at">) {
  return mutateDb((db) => {
    db.events.push({ ...e, at: new Date().toISOString() });
    if (db.events.length > 5000) db.events.splice(0, db.events.length - 5000);
  });
}
