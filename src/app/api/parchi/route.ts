import { z } from "zod";
import { recordParchi } from "@/lib/db/repo";
import { parseJson } from "@/lib/server/http";
import { limitOr429 } from "@/lib/server/rateLimit";

const Body = z.object({
  type: z.enum(["profile", "job", "options"]),
  kaabilId: z.string().max(20).optional(),
  jobIds: z.array(z.string().max(40)).max(10).optional(),
  assisted: z.boolean().default(false),
});

/** POST /api/parchi — records that a slip was issued, returns its serial. */
export async function POST(req: Request) {
  const limited = await limitOr429(req, "parchi", 30);
  if (limited) return limited;
  const r = await parseJson(req, Body);
  if ("error" in r) return r.error;
  const rec = await recordParchi(r.data);
  return Response.json({ id: rec.id, createdAt: rec.createdAt });
}
