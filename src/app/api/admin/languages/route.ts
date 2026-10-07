import { z } from "zod";
import { adminPost } from "@/lib/auth/route";
import { requireAdmin } from "@/lib/auth/server";
import { adminMutation, messageCoverage, setLanguageEnabled } from "@/lib/db/admin";

export async function GET(req: Request) {
  const auth = await requireAdmin(req, "stats.view");
  if ("error" in auth) return auth.error;
  return Response.json({ coverage: await messageCoverage() });
}

const Body = z.object({ code: z.string().max(5), enabled: z.boolean() });

export const POST = adminPost("languages", "languages.manage", Body, async (b, s) => adminMutation((db) => setLanguageEnabled(db, s, b.code, b.enabled)));
