import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const STATIC = path.resolve(__dirname, "../.next/static");
const hasBuild = existsSync(STATIC) && existsSync(path.resolve(__dirname, "../.next/BUILD_ID"));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(js|mjs|css|json|html|txt)$/.test(f) ? [p] : [];
  });
}

describe("GEMINI_API_KEY never reaches the client bundle", () => {
  if (!hasBuild) {
    it.skip("skipped: no production build in .next — run `npm run build` first (then `npm test`)", () => {});
    return;
  }
  const all = files(STATIC);
  const key = process.env.GEMINI_API_KEY;

  it("bundle does not reference the env var name or the Gemini endpoint", () => {
    const offenders = all.filter((f) => {
      const s = readFileSync(f, "utf8");
      return s.includes("GEMINI_API_KEY") || s.includes("generativelanguage.googleapis.com");
    });
    expect(offenders.map((f) => path.relative(STATIC, f))).toEqual([]);
  });

  it.runIf(!!key && key.length > 8)("bundle does not contain the key value", () => {
    const offenders = all.filter((f) => readFileSync(f, "utf8").includes(key!));
    expect(offenders.length).toBe(0);
  });
});
