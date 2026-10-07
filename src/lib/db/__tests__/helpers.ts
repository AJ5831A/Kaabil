import type { Database } from "@/lib/types";
import { toPublicJob } from "../repo";

/** Runs the real public projection used by /api/jobs. */
export function toPublicJobForTest(db: Database, id: string) {
  const job = db.jobs.find((j) => j.id === id)!;
  return toPublicJob(job, db.employers.find((e) => e.id === job.employerId));
}
