import type { Employer, Job } from "@/lib/types";

/**
 * Trust rule (enforced in code, never by the model):
 * an employer is verified only when an authorised admin approved it, and a
 * listing shows "Verified" only when BOTH the employer is verified AND an admin
 * approved that listing.
 */
export function isEmployerVerified(e: Employer | undefined | null): boolean {
  return !!e && e.verification.status === "verified" && !!e.verification.verifiedBy && !!e.verification.verifiedAt;
}

export function isJobApproved(j: Job | undefined | null): boolean {
  return !!j && j.status === "approved" && !!j.approvedBy && !!j.approvedAt;
}

export function isJobVerified(job: Job | undefined | null, employer: Employer | undefined | null): boolean {
  return isJobApproved(job) && isEmployerVerified(employer) && job!.employerId === employer!.id;
}

/** Only approved listings are publicly visible at all. */
export function isJobPublic(job: Job): boolean {
  return isJobApproved(job);
}
