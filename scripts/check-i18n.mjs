// Reports translation coverage: missing/extra keys and placeholder mismatches per locale.
import fs from "node:fs";
const root = "src/messages";
const flat = (o, p = "", out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flat(v, key, out);
    else out[key] = v;
  }
  return out;
};
const ph = (s) => (typeof s === "string" ? (s.match(/\{\w+\}/g) || []).sort().join() : "");
const nss = fs.readdirSync(`${root}/en`).filter((f) => f.endsWith(".json"));
let bad = 0;
for (const loc of fs.readdirSync(root).filter((d) => d !== "en" && fs.statSync(`${root}/${d}`).isDirectory())) {
  const rows = [];
  for (const ns of nss) {
    const en = flat(JSON.parse(fs.readFileSync(`${root}/en/${ns}`, "utf8")));
    const p = `${root}/${loc}/${ns}`;
    if (!fs.existsSync(p)) { rows.push(`${ns}: MISSING FILE`); continue; }
    let tr;
    try { tr = flat(JSON.parse(fs.readFileSync(p, "utf8"))); } catch (e) { rows.push(`${ns}: INVALID JSON`); bad++; continue; }
    const missing = Object.keys(en).filter((k) => !(k in tr));
    const extra = Object.keys(tr).filter((k) => !(k in en));
    const phBad = Object.keys(en).filter((k) => k in tr && ph(en[k]) !== ph(tr[k]));
    if (missing.length || extra.length || phBad.length) {
      bad++;
      rows.push(`${ns}: missing ${missing.length}${missing.length ? " (" + missing.slice(0, 4).join(", ") + ")" : ""} extra ${extra.length} placeholder ${phBad.length}${phBad.length ? " (" + phBad.slice(0, 4).join(", ") + ")" : ""}`);
    }
  }
  console.log(`${loc}: ${rows.length ? "\n  " + rows.join("\n  ") : "complete"}`);
}
process.exitCode = process.argv.includes("--strict") && bad ? 1 : 0;
