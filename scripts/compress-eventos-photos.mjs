import sharp from "sharp";
import { readdirSync, statSync, writeFileSync, readFileSync } from "fs";
import { join, extname } from "path";

const ROOT = join(process.cwd(), "public", "eventos");
const MAX_WIDTH = 1920;
const QUALITY = 80;

function listJpgs(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listJpgs(full));
    } else if (extname(name).toLowerCase() === ".jpg") {
      out.push(full);
    }
  }
  return out;
}

const files = listJpgs(ROOT);
let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const before = statSync(file).size;
  const input = readFileSync(file);
  const img = sharp(input);
  const meta = await img.metadata();
  const pipeline = img.rotate();
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline.resize({ width: MAX_WIDTH });
  }
  const buffer = await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
  writeFileSync(file, buffer);
  const after = buffer.length;
  totalBefore += before;
  totalAfter += after;
  console.log(`${file.replace(ROOT, "")}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
}

console.log(`\nTotal: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);
