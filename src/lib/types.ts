import type { L10n } from "@/lib/i18n/config";
import type {
  ExperienceLevel, HoursBand, JobCategory, JobType, SkillKey, TrainingOption,
} from "@/lib/taxonomy";

export type ID = string;

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type JobStatus = "draft" | "pending" | "approved" | "rejected" | "archived";
export type Role = "admin" | "centre_worker";

export interface Employer {
  id: ID;
  name: string;
  townId: string;
  sector: L10n;
  about: L10n;
  /** Public contact shown on job parchi only once employer is verified. */
  contact: { phone?: string; address: L10n };
  verification: { status: VerificationStatus; verifiedBy?: string; verifiedAt?: string; notes?: string };
  createdAt: string;
}

export interface Job {
  id: ID;
  employerId: ID;
  category: JobCategory;
  /** Optional title override; default title is the localised category label. */
  title?: L10n;
  description: L10n;
  townId: string;
  lat: number;
  lng: number;
  payMin: number;
  payMax: number;
  payPeriod: "month" | "day";
  type: JobType;
  shift: { start: string; end: string }; // "09:00" 24h
  hoursBand: HoursBand;
  skills: SkillKey[];
  experience: ExperienceLevel;
  training: TrainingOption;
  joining: L10n;
  contactNote: L10n;
  openings: number;
  status: JobStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

/** What the public API returns: never raw employer internals. */
export interface PublicJob {
  id: ID;
  category: JobCategory;
  title?: L10n;
  description: L10n;
  employer: { id: ID; name: string; verified: boolean };
  townId: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  payMin: number;
  payMax: number;
  payPeriod: "month" | "day";
  type: JobType;
  shift: { start: string; end: string };
  hoursBand: HoursBand;
  skills: SkillKey[];
  experience: ExperienceLevel;
  training: TrainingOption;
  joining: L10n;
  contactNote: L10n;
  /** Phone/address only included when verified. */
  contact?: { phone?: string; address: L10n };
  openings: number;
  verified: boolean;
}

export interface TrainingProgramme {
  id: ID;
  name: L10n;
  provider: string;
  skill: SkillKey;
  townId: string;
  durationWeeks: number;
  fee: number; // 0 = free
  mode: "in_person" | "station" | "online";
  description: L10n;
  status: "pending" | "approved";
}

export interface Station {
  id: ID;
  name: L10n;
  kind: "community_centre" | "school" | "ngo" | "skill_centre" | "public_service";
  townId: string;
  address: L10n;
  hours: string;
  hasPrinter: boolean;
  active: boolean;
}

export interface Report {
  id: ID;
  jobId: ID;
  reason: "fake" | "wrong_info" | "asked_money" | "unsafe" | "other";
  note?: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}

export interface InterestRecord {
  id: ID; // KBL-XXXX application id
  jobId: ID;
  kaabilId: string;
  createdAt: string;
}

export interface ParchiIssue {
  id: ID;
  type: "profile" | "job" | "options";
  kaabilId?: string;
  jobIds?: ID[];
  assisted: boolean;
  createdAt: string;
}

export interface AuditEntry {
  id: ID;
  at: string;
  actor: string;
  role: Role;
  action: string;
  target: string;
  detail?: string;
}

export interface TranslationEntry {
  id: ID;
  /** e.g. "job:j1:description" or "lesson:cooking:1" */
  key: string;
  locale: string;
  source: string;
  draft: string;
  status: "machine_draft" | "reviewed" | "published";
  reviewedBy?: string;
  updatedAt: string;
}

export interface UsageEvent {
  at: string;
  name: string; // e.g. "parchi_printed", "saathi_message", "language_selected"
  locale?: string;
  station?: string;
}

export interface Database {
  employers: Employer[];
  jobs: Job[];
  training: TrainingProgramme[];
  stations: Station[];
  reports: Report[];
  interests: InterestRecord[];
  parchi: ParchiIssue[];
  audit: AuditEntry[];
  translations: TranslationEntry[];
  events: UsageEvent[];
  languages: { code: string; enabled: boolean }[];
}
