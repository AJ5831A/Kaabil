import type { Employer, Job, PublicJob } from "@/lib/types";
import { isEmployerVerified, isJobVerified } from "@/lib/verification";

/** Mirror of repo.toPublicJob without the server-only database import. */
export function toPublicJobForTest(job: Job, employer: Employer | undefined): PublicJob {
  return {
    id: job.id, category: job.category, title: job.title, description: job.description,
    employer: { id: job.employerId, name: employer?.name ?? "—", verified: isEmployerVerified(employer) },
    townId: job.townId, lat: job.lat, lng: job.lng, payMin: job.payMin, payMax: job.payMax, payPeriod: job.payPeriod,
    type: job.type, shift: job.shift, hoursBand: job.hoursBand, skills: job.skills, experience: job.experience,
    training: job.training, joining: job.joining, contactNote: job.contactNote, openings: job.openings,
    verified: isJobVerified(job, employer),
  };
}
