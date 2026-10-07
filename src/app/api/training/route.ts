import { listTraining } from "@/lib/db/repo";

/** GET /api/training?skill=&townId= */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  return Response.json({ items: await listTraining(sp.get("skill")?.slice(0, 40) || undefined, sp.get("townId")?.slice(0, 40) || undefined) });
}
