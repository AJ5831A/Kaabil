import { z } from "zod";

/**
 * Compact, self-contained profile summary carried inside the Parchi QR code.
 * No server storage: the QR links to /p/<code>. Contains only what is already
 * printed on the slip (no phone, no address, no ID numbers).
 */
export const ProfileCodeSchema = z.object({
  v: z.literal(1),
  id: z.string().regex(/^KB-[A-Z0-9]{4}-[A-Z0-9]{4}$/),
  n: z.string().max(40).optional(),
  s: z.array(z.string().max(24)).max(12).optional(), // skills
  st: z.array(z.string().max(24)).max(9).optional(), // strengths
  l: z.array(z.string().max(24)).max(8).optional(), // learning
  e: z.string().max(80).optional(), // experience
  w: z.array(z.string().max(24)).max(4).optional(), // preferred work categories
  t: z.string().max(20).optional(), // town id
  h: z.string().max(12).optional(), // hours band
  jt: z.string().max(12).optional(), // job type
  lg: z.array(z.string().max(3)).max(9).optional(), // languages
  tr: z.array(z.string().max(40)).max(6).optional(), // training completed
  d: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // issued
});
export type ProfileCode = z.infer<typeof ProfileCodeSchema>;

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s: string) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Drops empty fields to keep the QR small. */
export function encodeProfile(p: ProfileCode): string {
  const clean = Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)),
  );
  return toBase64Url(new TextEncoder().encode(JSON.stringify(clean)));
}

export function decodeProfile(code: string): ProfileCode | null {
  try {
    if (code.length > 1500) return null;
    const json = JSON.parse(new TextDecoder().decode(fromBase64Url(code)));
    const r = ProfileCodeSchema.safeParse(json);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}
