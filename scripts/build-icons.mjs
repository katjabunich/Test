/* Build PWA icons from public/icon.svg. Run once: `node scripts/build-icons.mjs`. */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const svg = await readFile(resolve(root, "public/icon.svg"));

for (const size of [192, 512]) {
  const png = await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(resolve(root, `public/icon-${size}.png`), png);
  console.log(`wrote public/icon-${size}.png`);
}

const apple = await sharp(svg, { density: 384 }).resize(180, 180).png().toBuffer();
await writeFile(resolve(root, "public/apple-touch-icon.png"), apple);
console.log("wrote public/apple-touch-icon.png");

const favicon = await sharp(svg, { density: 192 }).resize(32, 32).png().toBuffer();
await writeFile(resolve(root, "public/favicon.png"), favicon);
console.log("wrote public/favicon.png");
