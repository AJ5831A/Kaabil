// Generates PWA icons: navy square, gold hairline frame, serif italic "k".
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const svg = (size, maskable) => {
  const pad = maskable ? size * 0.2 : size * 0.1;
  const r = maskable ? 0 : size * 0.22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="g" cx="35%" cy="25%" r="90%">
      <stop offset="0" stop-color="#16244f"/><stop offset="0.6" stop-color="#0a1330"/><stop offset="1" stop-color="#060b1a"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e8c98a"/><stop offset="1" stop-color="#b48c48"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <rect x="${pad}" y="${pad}" width="${size - 2 * pad}" height="${size - 2 * pad}" rx="${(size - 2 * pad) * 0.2}" fill="none" stroke="url(#gold)" stroke-opacity="0.55" stroke-width="${size * 0.008}"/>
  <text x="50%" y="${size * 0.66}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="${size * 0.5}" fill="url(#gold)">k</text>
</svg>`;
};

const out = "public/icons";
writeFileSync(`${out}/icon.svg`, svg(512, false));
for (const [name, size, mask] of [["icon-192.png", 192, false], ["icon-512.png", 512, false], ["maskable-512.png", 512, true], ["apple-touch-icon.png", 180, true]]) {
  await sharp(Buffer.from(svg(size, mask))).png().toFile(`${out}/${name}`);
}
console.log("icons written");
