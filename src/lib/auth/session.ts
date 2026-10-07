/**
 * Minimal signed-session implementation (Web Crypto HMAC-SHA256).
 * Works in route handlers, server components, proxy.ts and tests.
 * Token format: base64url(JSON payload) + "." + base64url(signature)
 */
import type { Role } from "@/lib/types";

export const SESSION_COOKIE = "kaabil_admin";
export const SESSION_TTL_SEC = 8 * 60 * 60;

export interface Session {
  email: string;
  role: Role;
  /** Optional station the centre worker belongs to. */
  stationId?: string;
  iat: number;
  exp: number;
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function getAuthSecret(): string | null {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-insecure-kaabil-secret-change-me";
  return null;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(
  data: { email: string; role: Role; stationId?: string },
  secret: string,
  now = Math.floor(Date.now() / 1000),
  ttl = SESSION_TTL_SEC,
): Promise<string> {
  const payload: Session = { ...data, iat: now, exp: now + ttl };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined | null, secret: string | null, now = Math.floor(Date.now() / 1000)): Promise<Session | null> {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    // crypto.subtle.verify is constant-time with respect to the signature.
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64url(parts[1]) as BufferSource, enc.encode(parts[0]));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(parts[0]))) as Session;
    if (typeof p.email !== "string" || (p.role !== "admin" && p.role !== "centre_worker")) return null;
    if (typeof p.exp !== "number" || p.exp <= now) return null;
    return p;
  } catch {
    return null;
  }
}

/** Constant-time string comparison (length leak only). */
export function safeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const n = Math.max(ab.length, bb.length);
  for (let i = 0; i < n; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}
