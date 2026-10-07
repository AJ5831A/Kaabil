import { requireAdmin } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { adminSnapshot } from "@/lib/db/admin";
import { limitOr429 } from "@/lib/server/rateLimit";

export async function GET(req: Request) {
  const limited = await limitOr429(req, "admin-read", 240);
  if (limited) return limited;
  const auth = await requireAdmin(req, "stats.view");
  if ("error" in auth) return auth.error;
  const snap = await adminSnapshot();
  const role = auth.session.role;
  return Response.json({
    ...snap,
    audit: can(role, "audit.view") ? snap.audit : [],
    translations: can(role, "translations.draft") ? snap.translations : [],
    session: { email: auth.session.email, role, stationId: auth.session.stationId },
  });
}
