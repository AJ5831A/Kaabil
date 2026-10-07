import { listStations } from "@/lib/db/repo";

/** GET /api/stations?townId= */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  return Response.json({ items: await listStations(sp.get("townId")?.slice(0, 40) || undefined) });
}
