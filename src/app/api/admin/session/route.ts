import { getSession } from "@/lib/auth/server";

export async function GET() {
  const s = await getSession();
  return s ? Response.json({ email: s.email, role: s.role, stationId: s.stationId, exp: s.exp }) : Response.json({ error: "unauthenticated" }, { status: 401 });
}
