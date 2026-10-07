// Regenerates src/messages/<locale>/index.ts from the JSON namespace files present.
// Run after adding/removing translation files: node scripts/gen-locale-index.mjs
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("src/messages");
for (const loc of fs.readdirSync(root)) {
  const dir = path.join(root, loc);
  if (!fs.statSync(dir).isDirectory()) continue;
  const ns = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
  const src = ns.length
    ? ns.map((n) => `import ${n} from "./${n}.json";`).join("\n") + `\n\nconst messages = { ${ns.join(", ")} };\nexport default messages;\n`
    : `// Populated by the translation pipeline. Missing namespaces fall back to English.\nconst messages = {};\nexport default messages;\n`;
  fs.writeFileSync(path.join(dir, "index.ts"), src);
  console.log(loc, ns.join(","));
}
