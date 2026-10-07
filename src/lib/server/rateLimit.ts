import "server-only";

/**
 * Fixed-window rate limiter. Uses Upstash Redis REST when UPSTASH_REDIS_REST_URL/TOKEN
 * are set (shared across serverless instances), else an in-process map.
 */
const mem = new Map<string, { n: number; reset: number }>();

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; remaining: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const bucket = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  if (url && token) {
    try {
      const r = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", bucket], ["EXPIRE", bucket, String(windowSec)]]),
        cache: "no-store",
      });
      const [[, n]] = (await r.json()).map((x: { result: number }) => [null, x.result]);
      return { ok: n <= limit, remaining: Math.max(0, limit - n) };
    } catch {
      /* fall through to memory */
    }
  }
  const now = Date.now();
  const cur = mem.get(bucket);
  if (!cur || cur.reset < now) {
    mem.set(bucket, { n: 1, reset: now + windowSec * 1000 });
    if (mem.size > 10_000) for (const [k, v] of mem) if (v.reset < now) mem.delete(k);
    return { ok: true, remaining: limit - 1 };
  }
  cur.n++;
  return { ok: cur.n <= limit, remaining: Math.max(0, limit - cur.n) };
}

export function clientKey(req: Request) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "local";
}

/** Convenience guard for route handlers. Returns a 429 Response or null. */
export async function limitOr429(req: Request, name: string, limit: number, windowSec = 60) {
  const r = await rateLimit(`${name}:${clientKey(req)}`, limit, windowSec);
  return r.ok ? null : Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(windowSec) } });
}
