import "server-only";
import type { z } from "zod";

export async function parseJson<T extends z.ZodType>(req: Request, schema: T): Promise<{ data: z.infer<T> } | { error: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: Response.json({ error: "invalid_json" }, { status: 400 }) };
  }
  const r = schema.safeParse(body);
  if (!r.success) return { error: Response.json({ error: "invalid_input", issues: r.error.issues.slice(0, 5) }, { status: 400 }) };
  return { data: r.data };
}
