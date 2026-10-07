import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { sameOrigin } from "@/lib/auth/server";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "bad_origin" }, { status: 403 });
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
