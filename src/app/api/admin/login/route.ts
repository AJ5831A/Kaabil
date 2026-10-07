import { z } from "zod";
import { cookies } from "next/headers";
import { parseJson } from "@/lib/server/http";
import { limitOr429 } from "@/lib/server/rateLimit";
import { checkCredentials } from "@/lib/auth/users";
import { SESSION_COOKIE, SESSION_TTL_SEC, getAuthSecret, signSession } from "@/lib/auth/session";
import { sameOrigin } from "@/lib/auth/server";
import { mutateDb } from "@/lib/db/store";
import { audit } from "@/lib/db/admin-core";

const Body = z.object({ email: z.string().email().max(120), password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "bad_origin" }, { status: 403 });
  const limited = await limitOr429(req, "admin-login", 8, 300);
  if (limited) return limited;
  const r = await parseJson(req, Body);
  if ("error" in r) return r.error;
  const secret = getAuthSecret();
  if (!secret) return Response.json({ error: "auth_not_configured" }, { status: 503 });
  const user = checkCredentials(r.data.email, r.data.password);
  if (!user) return Response.json({ error: "invalid_credentials" }, { status: 401 });
  const token = await signSession(user, secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
  await mutateDb((db) => audit(db, user, "auth.login", user.email));
  return Response.json({ ok: true, role: user.role });
}
