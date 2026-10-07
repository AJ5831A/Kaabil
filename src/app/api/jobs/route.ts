import { JobFiltersSchema } from "@/lib/jobs/filter";
import { getPublicJobs, searchJobs } from "@/lib/db/repo";
import { limitOr429 } from "@/lib/server/rateLimit";

/** GET /api/jobs?townId=&maxDistanceKm=&minPay=&type=&hoursBand=&skill=&category=&verifiedOnly=&q=&sort=  |  ?ids=j1,j2 */
export async function GET(req: Request) {
  const limited = await limitOr429(req, "jobs", 120);
  if (limited) return limited;
  const sp = new URL(req.url).searchParams;
  const ids = sp.get("ids");
  if (ids) return Response.json({ items: await getPublicJobs(ids.split(",").slice(0, 20)) });
  const raw = Object.fromEntries([...sp.entries()].filter(([, v]) => v !== ""));
  const parsed = JobFiltersSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "invalid_filters" }, { status: 400 });
  return Response.json({ items: await searchJobs(parsed.data) });
}
