#!/usr/bin/env node
// CI guard: fails if the Gemini key (or its env name) appears in the client bundle.
// Run after `next build`.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || ".next/static");
if (!existsSync(root)) {
  console.error(`check-bundle: ${root} not found. Run \`npm run build\` first.`);
  process.exit(2);
}
const needles = ["GEMINI_API_KEY", "generativelanguage.googleapis.com"];
const key = process.env.GEMINI_API_KEY;
if (key && key.length > 8) needles.push(key);

const hits = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|mjs|css|html|json|map|txt)$/.test(f)) {
      const s = readFileSync(p, "utf8");
      for (const n of needles) if (s.includes(n)) hits.push(`${path.relative(root, p)} contains ${n === key ? "<GEMINI key value>" : n}`);
    }
  }
};
walk(root);
if (hits.length) {
  console.error("check-bundle: secret material found in client bundle:\n" + hits.join("\n"));
  process.exit(1);
}
console.log(`check-bundle: OK — scanned ${root}, no Gemini secrets found.`);
