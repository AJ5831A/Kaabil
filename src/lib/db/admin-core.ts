/**
 * Pure admin domain logic over the Database document. No I/O, no "server-only",
 * so it is unit-testable. `admin.ts` wraps these with persistence.
 *
 * Trust invariants enforced here:
 *  - Nothing is ever auto-verified. New employers start "pending"; new/edited jobs start "pending".
 *  - Only roles with the permission may verify employers or approve listings (see permissions.ts).
 *  - Machine translations can be published only after a human review step.
 */
import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";
import { LOCALE_CODES } from "@/lib/i18n/config";
import type { AuditEntry, Database, Employer, Job, Report, Station, TrainingProgramme, TranslationEntry } from "@/lib/types";
import { EXPERIENCE_LEVELS, HOURS_BANDS, JOB_CATEGORIES, JOB_TYPES, SKILLS, TRAINING_OPTIONS } from "@/lib/taxonomy";
import { TOWNS, townById } from "@/lib/geo/towns";
import { can, type Permission } from "@/lib/auth/permissions";
import type { Session } from "@/lib/auth/session";
import { isEmployerVerified, isJobVerified } from "@/lib/verification";

export type Actor = Pick<Session, "email" | "role" | "stationId">;

export class AdminError extends Error {
  constructor(
    public code: "forbidden" | "not_found" | "invalid" | "conflict",
    message?: string,
  ) {
    super(message ?? code);
  }
}

export function assertCan(actor: Actor, perm: Permission) {
  if (!can(actor.role, perm)) throw new AdminError("forbidden", `Role ${actor.role} lacks ${perm}`);
}

let seq = 0;
export function newId(prefix: string) {
  seq = (seq + 1) % 1000;
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

const now = () => new Date().toISOString();

export function audit(db: Database, actor: Actor, action: string, target: string, detail?: string) {
  const e: AuditEntry = { id: newId("a"), at: now(), actor: actor.email, role: actor.role, action, target, detail: detail?.slice(0, 300) };
  db.audit.push(e);
  if (db.audit.length > 5000) db.audit.splice(0, db.audit.length - 5000);
  return e;
}

/* ------------------------------------------------------------------ schemas */
const townIds = TOWNS.map((t) => t.id) as [string, ...string[]];
const text = (max = 600) => z.string().trim().max(max);
export const L10nInput = z.object({ en: text().min(1) }).catchall(text()).transform((v) => {
  const out: Record<string, string> = { en: v.en };
  for (const l of LOCALE_CODES) if (l !== "en" && v[l]) out[l] = v[l] as string;
  return out as { en: string } & Partial<Record<Locale, string>>;
});
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const EmployerInput = z.object({
  name: text(120).min(2),
  townId: z.enum(townIds),
  sector: L10nInput,
  about: L10nInput,
  contact: z.object({ phone: text(30).optional(), address: L10nInput }),
});
export type EmployerInput = z.input<typeof EmployerInput>;

export const JobInput = z
  .object({
    employerId: z.string().min(1).max(40),
    category: z.enum(JOB_CATEGORIES.map((c) => c.key) as [string, ...string[]]),
    title: L10nInput.optional(),
    description: L10nInput,
    townId: z.enum(townIds),
    payMin: z.coerce.number().int().min(0).max(500000),
    payMax: z.coerce.number().int().min(0).max(500000),
    payPeriod: z.enum(["month", "day"]),
    type: z.enum(JOB_TYPES),
    shift: z.object({ start: hhmm, end: hhmm }),
    hoursBand: z.enum(HOURS_BANDS),
    skills: z.array(z.enum(SKILLS)).min(1).max(6),
    experience: z.enum(EXPERIENCE_LEVELS),
    training: z.enum(TRAINING_OPTIONS),
    joining: L10nInput,
    contactNote: L10nInput,
    openings: z.coerce.number().int().min(1).max(500),
  })
  .refine((j) => j.payMax >= j.payMin, { message: "payMax must be ≥ payMin", path: ["payMax"] });
export type JobInput = z.input<typeof JobInput>;

export const TrainingInput = z.object({
  name: L10nInput,
  provider: text(120).min(2),
  skill: z.enum(SKILLS),
  townId: z.enum(townIds),
  durationWeeks: z.coerce.number().int().min(1).max(104),
  fee: z.coerce.number().int().min(0).max(200000),
  mode: z.enum(["in_person", "station", "online"]),
  description: L10nInput,
});

export const StationInput = z.object({
  name: L10nInput,
  kind: z.enum(["community_centre", "school", "ngo", "skill_centre", "public_service"]),
  townId: z.enum(townIds),
  address: L10nInput,
  hours: text(40).min(1),
  hasPrinter: z.boolean(),
  active: z.boolean(),
});

/* ------------------------------------------------------------------ employers */
export function createEmployer(db: Database, actor: Actor, raw: unknown): Employer {
  assertCan(actor, "employers.create");
  const input = EmployerInput.parse(raw);
  const e: Employer = {
    id: newId("e"),
    ...input,
    // Never auto-verified, even when an admin creates it.
    verification: { status: "pending" },
    createdAt: now(),
  };
  db.employers.push(e);
  audit(db, actor, "employer.create", e.id, e.name);
  return e;
}

export function updateEmployer(db: Database, actor: Actor, id: string, raw: unknown): Employer {
  assertCan(actor, "employers.verify");
  const e = db.employers.find((x) => x.id === id);
  if (!e) throw new AdminError("not_found");
  Object.assign(e, EmployerInput.parse(raw));
  audit(db, actor, "employer.update", id, e.name);
  return e;
}

export function decideEmployer(db: Database, actor: Actor, id: string, decision: "verified" | "rejected" | "pending", notes?: string): Employer {
  assertCan(actor, "employers.verify");
  const e = db.employers.find((x) => x.id === id);
  if (!e) throw new AdminError("not_found");
  e.verification =
    decision === "verified"
      ? { status: "verified", verifiedBy: actor.email, verifiedAt: now(), notes: notes?.slice(0, 300) }
      : { status: decision, notes: notes?.slice(0, 300) };
  audit(db, actor, `employer.${decision}`, id, notes);
  return e;
}

/* ------------------------------------------------------------------ jobs */
export function createJob(db: Database, actor: Actor, raw: unknown): Job {
  assertCan(actor, "jobs.create");
  const input = JobInput.parse(raw);
  if (!db.employers.some((e) => e.id === input.employerId)) throw new AdminError("invalid", "Unknown employer");
  const town = townById(input.townId)!;
  const job: Job = {
    id: newId("j"),
    ...(input as Omit<Job, "id" | "lat" | "lng" | "status" | "createdAt">),
    lat: town.lat,
    lng: town.lng,
    status: "pending",
    createdAt: now(),
  };
  db.jobs.push(job);
  audit(db, actor, "job.create", job.id, `${job.category} @ ${job.townId}`);
  return job;
}

/** Editing content of a listing sends it back to the review queue. */
export function updateJob(db: Database, actor: Actor, id: string, raw: unknown): Job {
  assertCan(actor, "jobs.edit");
  const job = db.jobs.find((j) => j.id === id);
  if (!job) throw new AdminError("not_found");
  const input = JobInput.parse(raw);
  if (!db.employers.some((e) => e.id === input.employerId)) throw new AdminError("invalid", "Unknown employer");
  const town = townById(input.townId)!;
  Object.assign(job, input, { lat: town.lat, lng: town.lng, status: "pending" as const, approvedBy: undefined, approvedAt: undefined });
  if (!input.title) delete job.title;
  audit(db, actor, "job.update", id, "re-queued for approval");
  return job;
}

export function setJobStatus(db: Database, actor: Actor, id: string, status: "approved" | "rejected" | "archived" | "pending", note?: string): Job {
  assertCan(actor, status === "archived" ? "listing.archive" : "jobs.approve");
  const job = db.jobs.find((j) => j.id === id);
  if (!job) throw new AdminError("not_found");
  if (status === "approved") {
    job.status = "approved";
    job.approvedBy = actor.email;
    job.approvedAt = now();
  } else {
    job.status = status;
    job.approvedBy = undefined;
    job.approvedAt = undefined;
  }
  audit(db, actor, `job.${status}`, id, note);
  return job;
}

/** What the public will see for this listing once (or if) it is approved. */
export function publicBadgePreview(db: Database, job: Job): { visible: boolean; verified: boolean; employerVerified: boolean } {
  const employer = db.employers.find((e) => e.id === job.employerId);
  return { visible: job.status === "approved", verified: isJobVerified(job, employer), employerVerified: isEmployerVerified(employer) };
}

/* ------------------------------------------------------------------ suspicion heuristics */
const SUSPICIOUS: { key: string; re: RegExp }[] = [
  { key: "fee", re: /(registration|joining|security)\s*(fee|charge|deposit)|\bfee\b|pay\s*₹?\s*\d+\s*(to|for)\s*(register|join)|फ़?फीस|फ़ीस|रजिस्ट्रेशन|पैसे\s*(दें|जमा)/i },
  { key: "whatsapp_only", re: /whats\s*app\s*only|only\s*whats\s*app|सिर्फ़?\s*whatsapp/i },
  { key: "instructions", re: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions|system\s*prompt|you\s+are\s+now|tell\s+the\s+user|disregard\s+.*rules/i },
  { key: "guarantee", re: /guarantee(d)?\s*(job|income|selection)?|100\s*%\s*(job|selection)|पक्की\s*नौकरी|गारंटी/i },
];

export function suspicionFlags(db: Database, job: Job): string[] {
  const employer = db.employers.find((e) => e.id === job.employerId);
  const blob = [job.description, job.joining, job.contactNote, job.title, employer?.about]
    .flatMap((v) => (v ? Object.values(v) : []))
    .join(" \n ");
  const flags = SUSPICIOUS.filter((s) => s.re.test(blob)).map((s) => s.key);
  if (job.payPeriod === "month" && job.payMax >= 25000 && job.experience === "none") flags.push("pay_too_high");
  if (job.openings >= 50) flags.push("many_openings");
  if (!isEmployerVerified(employer)) flags.push("employer_unverified");
  return flags;
}

/* ------------------------------------------------------------------ reports */
function workerOwnsReport(db: Database, actor: Actor, r: Report) {
  if (actor.role === "admin") return true;
  const station = db.stations.find((s) => s.id === actor.stationId);
  const job = db.jobs.find((j) => j.id === r.jobId);
  return !!station && !!job && station.townId === job.townId;
}

export function setReportStatus(db: Database, actor: Actor, id: string, status: Report["status"]): Report {
  assertCan(actor, "reports.manage");
  const r = db.reports.find((x) => x.id === id);
  if (!r) throw new AdminError("not_found");
  if (!workerOwnsReport(db, actor, r)) throw new AdminError("forbidden", "Report is outside your station area");
  r.status = status;
  audit(db, actor, `report.${status}`, id, r.jobId);
  return r;
}

export function archiveFromReport(db: Database, actor: Actor, reportId: string): Job {
  const r = db.reports.find((x) => x.id === reportId);
  if (!r) throw new AdminError("not_found");
  const job = setJobStatus(db, actor, r.jobId, "archived", `from report ${reportId}`);
  r.status = "resolved";
  return job;
}

/* ------------------------------------------------------------------ training & stations & languages */
export function upsertTraining(db: Database, actor: Actor, id: string | null, raw: unknown): TrainingProgramme {
  assertCan(actor, "training.manage");
  const input = TrainingInput.parse(raw);
  if (id) {
    const t = db.training.find((x) => x.id === id);
    if (!t) throw new AdminError("not_found");
    Object.assign(t, input, { status: "pending" as const });
    audit(db, actor, "training.update", id);
    return t;
  }
  const t: TrainingProgramme = { id: newId("t"), ...input, status: "pending" };
  db.training.push(t);
  audit(db, actor, "training.create", t.id, t.provider);
  return t;
}

export function setTrainingStatus(db: Database, actor: Actor, id: string, status: TrainingProgramme["status"]) {
  assertCan(actor, "training.manage");
  const t = db.training.find((x) => x.id === id);
  if (!t) throw new AdminError("not_found");
  t.status = status;
  audit(db, actor, `training.${status}`, id);
  return t;
}

export function deleteTraining(db: Database, actor: Actor, id: string) {
  assertCan(actor, "training.manage");
  const i = db.training.findIndex((x) => x.id === id);
  if (i < 0) throw new AdminError("not_found");
  db.training.splice(i, 1);
  audit(db, actor, "training.delete", id);
}

export function upsertStation(db: Database, actor: Actor, id: string | null, raw: unknown): Station {
  assertCan(actor, "stations.manage");
  const input = StationInput.parse(raw);
  if (id) {
    const s = db.stations.find((x) => x.id === id);
    if (!s) throw new AdminError("not_found");
    Object.assign(s, input);
    audit(db, actor, "station.update", id);
    return s;
  }
  const s: Station = { id: newId("s"), ...input };
  db.stations.push(s);
  audit(db, actor, "station.create", s.id);
  return s;
}

export function setLanguageEnabled(db: Database, actor: Actor, code: string, enabled: boolean) {
  assertCan(actor, "languages.manage");
  const l = db.languages.find((x) => x.code === code);
  if (!l) throw new AdminError("not_found");
  if (!enabled && (code === "en" || code === "hi")) throw new AdminError("conflict", "Hindi and English cannot be disabled");
  l.enabled = enabled;
  audit(db, actor, enabled ? "language.enable" : "language.disable", code);
  return l;
}

/* ------------------------------------------------------------------ translations (B4) */
export const TRANSLATABLE = {
  job: ["title", "description", "joining", "contactNote"],
  employer: ["about", "sector"],
  training: ["name", "description"],
} as const;

type Kind = keyof typeof TRANSLATABLE;

export function parseTranslationKey(key: string): { kind: Kind; id: string; field: string } {
  const [kind, id, field] = key.split(":");
  if (!(kind in TRANSLATABLE) || !id || !(TRANSLATABLE[kind as Kind] as readonly string[]).includes(field))
    throw new AdminError("invalid", "Unknown translation key");
  return { kind: kind as Kind, id, field };
}

function resolveRecord(db: Database, key: string): Record<string, unknown> {
  const { kind, id } = parseTranslationKey(key);
  const rec = (kind === "job" ? db.jobs : kind === "employer" ? db.employers : db.training).find((x) => x.id === id);
  if (!rec) throw new AdminError("not_found");
  return rec as unknown as Record<string, unknown>;
}

export function sourceText(db: Database, key: string): string {
  const { field } = parseTranslationKey(key);
  const v = resolveRecord(db, key)[field] as { en?: string } | undefined;
  return v?.en ?? "";
}

export function addTranslationDraft(
  db: Database,
  actor: Actor,
  input: { key: string; locale: Locale; draft: string; origin: "machine" | "human" },
): TranslationEntry {
  assertCan(actor, "translations.draft");
  if (input.locale === "en") throw new AdminError("invalid", "English is the source language");
  const source = sourceText(db, input.key);
  if (!source) throw new AdminError("invalid", "Source text is empty");
  const draft = input.draft.trim().slice(0, 2000);
  if (!draft) throw new AdminError("invalid", "Empty translation");
  // A human-authored entry IS a human review; a machine draft is not.
  const human = input.origin === "human";
  const existing = db.translations.find((t) => t.key === input.key && t.locale === input.locale && t.status !== "published");
  const entry: TranslationEntry = existing ?? { id: newId("tr"), key: input.key, locale: input.locale, source, draft, status: "machine_draft", updatedAt: now() };
  Object.assign(entry, {
    source,
    draft,
    status: human ? "reviewed" : "machine_draft",
    reviewedBy: human ? actor.email : undefined,
    updatedAt: now(),
  });
  if (!existing) db.translations.push(entry);
  audit(db, actor, human ? "translation.manual" : "translation.machine_draft", `${input.key}@${input.locale}`);
  return entry;
}

export function reviewTranslation(db: Database, actor: Actor, id: string, draft: string): TranslationEntry {
  assertCan(actor, "translations.review");
  const t = db.translations.find((x) => x.id === id);
  if (!t) throw new AdminError("not_found");
  if (t.status === "published") throw new AdminError("conflict", "Already published");
  const d = draft.trim().slice(0, 2000);
  if (!d) throw new AdminError("invalid", "Empty translation");
  t.draft = d;
  t.status = "reviewed";
  t.reviewedBy = actor.email;
  t.updatedAt = now();
  audit(db, actor, "translation.review", `${t.key}@${t.locale}`);
  return t;
}

/** Publishing requires a prior human review. Machine drafts are rejected. */
export function publishTranslation(db: Database, actor: Actor, id: string): TranslationEntry {
  assertCan(actor, "translations.publish");
  const t = db.translations.find((x) => x.id === id);
  if (!t) throw new AdminError("not_found");
  if (t.status !== "reviewed" || !t.reviewedBy) throw new AdminError("conflict", "A human must review this translation before publishing");
  const { field } = parseTranslationKey(t.key);
  const rec = resolveRecord(db, t.key);
  const cur = (rec[field] as Record<string, string> | undefined) ?? { en: t.source };
  rec[field] = { ...cur, [t.locale]: t.draft };
  t.status = "published";
  t.updatedAt = now();
  audit(db, actor, "translation.publish", `${t.key}@${t.locale}`, `reviewed by ${t.reviewedBy}`);
  return t;
}

/* ------------------------------------------------------------------ stats */
export function computeStats(db: Database, days = 14) {
  const count = <T,>(xs: T[], f: (x: T) => string) => xs.reduce<Record<string, number>>((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {});
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * 86400000);
    return { day: d.toISOString().slice(0, 10), n: 0 };
  });
  const idx = new Map(series.map((s, i) => [s.day, i]));
  for (const e of db.events) {
    const i = idx.get(e.at.slice(0, 10));
    if (i != null) series[i].n++;
  }
  return {
    jobsByStatus: count(db.jobs, (j) => j.status),
    employersByStatus: count(db.employers, (e) => e.verification.status),
    openReports: db.reports.filter((r) => r.status === "open").length,
    parchiIssued: db.parchi.length,
    parchiByType: count(db.parchi, (p) => p.type),
    assistedParchi: db.parchi.filter((p) => p.assisted).length,
    interests: db.interests.length,
    eventsTotal: db.events.length,
    eventsByName: count(db.events, (e) => e.name),
    eventsByLocale: count(db.events.filter((e) => e.locale), (e) => e.locale!),
    series,
    activeStations: db.stations.filter((s) => s.active).length,
    publicVerified: db.jobs.filter((j) => isJobVerified(j, db.employers.find((e) => e.id === j.employerId))).length,
  };
}
