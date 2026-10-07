import { z } from "zod";
import { createReport } from "@/lib/db/repo";
import { parseJson } from "@/lib/server/http";
import { limitOr429 } from "@/lib/server/rateLimit";

const Body = z.object({
  jobId: z.string().min(1).max(40),
  reason: z.enum(["fake", "wrong_info", "asked_money", "unsafe", "other"]),
  note: z.string().max(500).optional(),
});

/** POST /api/report — users flag suspicious or incorrect listings. */
export async function POST(req: Request) {
  const limited = await limitOr429(req, "report", 10);
  if (limited) return limited;
  const r = await parseJson(req, Body);
  if ("error" in r) return r.error;
  const rec = await createReport(r.data);
  return Response.json({ id: rec.id });
}
