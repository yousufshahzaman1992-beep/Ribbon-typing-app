// Generates PNG assets (OG image, PWA icons, favicon) from SVG sources using sharp.
// Run: npm run assets
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

async function render(svgFile, outFile, width, height) {
  const svg = fs.readFileSync(path.join(publicDir, svgFile));
  await sharp(svg)
    .resize(width, height, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, outFile));
  console.log(`Generated ${outFile} (${width}x${height})`);
}

await render("og-image.svg", "og-image.png", 1200, 630);
await render("favicon.svg", "icon-192.png", 192, 192);
await render("favicon.svg", "icon-512.png", 512, 512);
await render("favicon.svg", "favicon.png", 48, 48);
console.log("Asset generation complete.");
