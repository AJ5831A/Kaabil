import { getPublicJob } from "@/lib/db/repo";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = await getPublicJob(id.slice(0, 40));
  return job ? Response.json({ job }) : Response.json({ error: "not_found" }, { status: 404 });
}
