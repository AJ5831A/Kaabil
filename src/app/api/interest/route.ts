import { z } from "zod";
import { getPublicJob, recordInterest } from "@/lib/db/repo";
import { parseJson } from "@/lib/server/http";
import { limitOr429 } from "@/lib/server/rateLimit";

const Body = z.object({ jobId: z.string().min(1).max(40), kaabilId: z.string().regex(/^KB-[A-Z0-9]{4}-[A-Z0-9]{4}$/) });

/** POST /api/interest -> { id: "KBL-XXXXXX" } application id */
export async function POST(req: Request) {
  const limited = await limitOr429(req, "interest", 30);
  if (limited) return limited;
  const r = await parseJson(req, Body);
  if ("error" in r) return r.error;
  if (!(await getPublicJob(r.data.jobId))) return Response.json({ error: "not_found" }, { status: 404 });
  const rec = await recordInterest(r.data.jobId, r.data.kaabilId);
  return Response.json({ id: rec.id });
}
