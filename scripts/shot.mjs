import { chromium } from "@playwright/test";
const [,, url, out, w = "1440", h = "900", lang = "en"] = process.argv;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
await ctx.addInitScript((l) => {
  if (!localStorage.getItem("kaabil")) localStorage.setItem("kaabil", JSON.stringify({ state: { locale: l, localeChosen: true }, version: 1 }));
  document.cookie = `kaabil_locale=${l}; path=/`;
}, lang);
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
await p.screenshot({ path: out, fullPage: process.env.FULL === "1" });
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no errors");
await b.close();
