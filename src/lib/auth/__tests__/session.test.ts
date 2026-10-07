import { describe, expect, it } from "vitest";
import { safeEqual, signSession, verifySession } from "../session";
import { checkCredentials } from "../users";

const SECRET = "test-secret-at-least-16-chars";

describe("signed admin session", () => {
  it("round-trips a valid session", async () => {
    const tok = await signSession({ email: "a@x.in", role: "admin" }, SECRET);
    const s = await verifySession(tok, SECRET);
    expect(s?.email).toBe("a@x.in");
    expect(s?.role).toBe("admin");
  });

  it("rejects a tampered payload (role escalation)", async () => {
    const tok = await signSession({ email: "w@x.in", role: "centre_worker" }, SECRET);
    const [body, sig] = tok.split(".");
    const json = JSON.parse(Buffer.from(body, "base64url").toString());
    json.role = "admin";
    const forged = `${Buffer.from(JSON.stringify(json)).toString("base64url")}.${sig}`;
    expect(await verifySession(forged, SECRET)).toBeNull();
  });

  it("rejects a tampered signature, wrong secret, garbage and missing secret", async () => {
    const tok = await signSession({ email: "a@x.in", role: "admin" }, SECRET);
    expect(await verifySession(tok.slice(0, -2) + "AA", SECRET)).toBeNull();
    expect(await verifySession(tok, "another-secret-value-123")).toBeNull();
    expect(await verifySession("not.a-token", SECRET)).toBeNull();
    expect(await verifySession("", SECRET)).toBeNull();
    expect(await verifySession(tok, null)).toBeNull();
  });

  it("rejects an expired session", async () => {
    const t0 = 1_700_000_000;
    const tok = await signSession({ email: "a@x.in", role: "admin" }, SECRET, t0, 60);
    expect(await verifySession(tok, SECRET, t0 + 30)).not.toBeNull();
    expect(await verifySession(tok, SECRET, t0 + 61)).toBeNull();
  });

  it("safeEqual compares correctly", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("dev credentials resolve to roles (non-production)", () => {
    expect(checkCredentials("admin@kaabil.local", "kaabil-admin")?.role).toBe("admin");
    expect(checkCredentials("WORKER@kaabil.local", "kaabil-worker")?.role).toBe("centre_worker");
    expect(checkCredentials("admin@kaabil.local", "wrong")).toBeNull();
  });
});
