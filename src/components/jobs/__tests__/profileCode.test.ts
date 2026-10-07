import { describe, expect, it } from "vitest";
import { decodeProfile, encodeProfile, type ProfileCode } from "@/components/parchi/profileCode";

const full: ProfileCode = {
  v: 1,
  id: "KB-7QXM-4PLA",
  n: "सुनीता देवी",
  s: ["sewing", "cooking"],
  st: ["practical", "coordination"],
  l: ["sewing"],
  e: "5 साल घर पर ब्लाउज़ सिलाई",
  w: ["tailoring_assistant"],
  t: "pilani",
  h: "day",
  jt: "full_time",
  lg: ["hi", "en"],
  tr: ["cooking"],
  d: "2026-10-07",
};

describe("profile QR code", () => {
  it("round-trips a full profile including Devanagari text", () => {
    expect(decodeProfile(encodeProfile(full))).toEqual(full);
  });

  it("is URL-safe and drops empty fields", () => {
    const code = encodeProfile({ v: 1, id: "KB-AAAA-BBBB", s: [], n: undefined, d: "2026-01-01" });
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeProfile(code)).toEqual({ v: 1, id: "KB-AAAA-BBBB", d: "2026-01-01" });
  });

  it("stays small enough for a printable QR", () => {
    expect(encodeProfile(full).length).toBeLessThan(600);
  });

  it("rejects tampered or malformed codes", () => {
    expect(decodeProfile("not-base64!!")).toBeNull();
    expect(decodeProfile(encodeProfile({ ...full, id: "KB-bad" } as ProfileCode))).toBeNull();
    const extra = Buffer.from(JSON.stringify({ ...full, v: 2 })).toString("base64url");
    expect(decodeProfile(extra)).toBeNull();
    expect(decodeProfile("A".repeat(2000))).toBeNull();
  });
});
