import { z } from "zod";
import { logEvent } from "@/lib/db/repo";
import { parseJson } from "@/lib/server/http";
import { limitOr429 } from "@/lib/server/rateLimit";

const Body = z.object({
  name: z.string().regex(/^[a-z_]{2,40}$/),
  locale: z.string().max(5).optional(),
  station: z.string().max(20).optional(),
});

/** POST /api/events — anonymous usage counters (no identifiers). */
export async function POST(req: Request) {
  const limited = await limitOr429(req, "events", 60);
  if (limited) return limited;
  const r = await parseJson(req, Body);
  if ("error" in r) return r.error;
  await logEvent(r.data);
  return new Response(null, { status: 204 });
}
