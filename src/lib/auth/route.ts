import "server-only";
import type { z } from "zod";
import { requireAdmin } from "./server";
import type { Permission } from "./permissions";
import type { Session } from "./session";
import { parseJson } from "@/lib/server/http";
import { limitOr429 } from "@/lib/server/rateLimit";

/** Shared wrapper for mutating admin routes: origin check, rate limit, session + base permission, zod body. */
export function adminPost<T extends z.ZodType>(name: string, base: Permission, schema: T, handle: (body: z.infer<T>, session: Session) => Promise<Response>) {
  return async (req: Request) => {
    const limited = await limitOr429(req, `admin-${name}`, 90);
    if (limited) return limited;
    const auth = await requireAdmin(req, base);
    if ("error" in auth) return auth.error;
    const r = await parseJson(req, schema);
    if ("error" in r) return r.error;
    return handle(r.data, auth.session);
  };
}
