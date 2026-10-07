import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, getAuthSecret, verifySession, type Session } from "./session";
import { can, type Permission } from "./permissions";

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token, getAuthSecret());
}

/** Reject cross-site mutations: Origin (or Referer) must match the request host. */
export function sameOrigin(req: Request): boolean {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Route-handler guard. Returns the session, or a Response to return immediately.
 * Always checked server-side (the proxy is only a first line of defence).
 */
export async function requireAdmin(req: Request, perm: Permission): Promise<{ session: Session } | { error: Response }> {
  if (!sameOrigin(req)) return { error: Response.json({ error: "bad_origin" }, { status: 403 }) };
  const session = await getSession();
  if (!session) return { error: Response.json({ error: "unauthenticated" }, { status: 401 }) };
  if (!can(session.role, perm)) return { error: Response.json({ error: "forbidden" }, { status: 403 }) };
  return { session };
}
