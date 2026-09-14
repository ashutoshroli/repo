import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const logoSvg = readFileSync(resolve(root, 'static/logo.svg'));
const outDir = resolve(root, 'static/screenshots');
mkdirSync(outDir, { recursive: true });

function cardSvg(w, h, logoW) {
  const cx = w / 2;
  const titleY = h * 0.62;
  const subY = h * 0.62 + Math.round(h * 0.06);
  const tagY = h * 0.62 + Math.round(h * 0.11);
  const titleSize = Math.round(Math.min(w, h) * 0.075);
  const subSize = Math.round(Math.min(w, h) * 0.045);
  const tagSize = Math.round(Math.min(w, h) * 0.032);
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fde7c9"/>
      <stop offset="0.55" stop-color="#fbc98c"/>
      <stop offset="1" stop-color="#e98b54"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${h * 0.34}" r="${logoW * 0.62}" fill="#ffffff" opacity="0.9"/>
  <text x="${cx}" y="${titleY}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-weight="900" font-size="${titleSize}" fill="#7a2e00">Chhath Puja</text>
  <text x="${cx}" y="${subY}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-weight="700" font-size="${subSize}" fill="#9a3d0a">Transparency Portal</text>
  <text x="${cx}" y="${tagY}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-weight="600" font-size="${tagSize}" fill="#b4560f">Faith • Unity • Transparency</text>
</svg>`);
}

async function make(name, w, h) {
  const logoW = Math.round(Math.min(w, h) * 0.34);
  const logo = await sharp(logoSvg, { density: 384 })
    .resize(logoW, logoW, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const base = sharp(cardSvg(w, h, logoW)).png();
  await base
    .composite([{ input: logo, top: Math.round(h * 0.34 - logoW / 2), left: Math.round(w / 2 - logoW / 2) }])
    .toFile(resolve(outDir, name));
  console.log('wrote', name, `${w}x${h}`);
}

await make('wide.png', 1280, 720);
await make('narrow.png', 720, 1280);
console.log('screenshots generated in', outDir);
