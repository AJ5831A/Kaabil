import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, getAuthSecret, verifySession } from "@/lib/auth/session";

/** First line of defence for the admin area; route handlers re-check sessions + roles. */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return NextResponse.next();
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value, getAuthSecret());
  if (session) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
