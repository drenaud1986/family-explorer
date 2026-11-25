// Génère les icônes PNG (soleil + rose des vents) sans dépendance : node tools/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
mkdirSync(out, { recursive: true });

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, px) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const BG = hex('#0B4A61'), SUN = hex('#FFC23C'), INK = hex('#1B2A3A'), TERRA = hex('#E0603A'), WHITE = hex('#FFF8EC');

// Couleur au point (u,v) dans [0,1]
function colorAt(u, v, { rounded, scale }) {
  const x = (u - .5) / scale, y = (v - .5) / scale;
  if (rounded) { // carré arrondi
    const r = .22, ax = Math.abs(u - .5), ay = Math.abs(v - .5);
    const dx = Math.max(ax - (.5 - r), 0), dy = Math.max(ay - (.5 - r), 0);
    if (dx * dx + dy * dy > r * r) return null;
  }
  const d = Math.hypot(x, y);
  // étoile 4 branches
  const inV = Math.abs(x) / .085 + Math.abs(y) / .33 <= 1;
  const inH = Math.abs(x) / .33 + Math.abs(y) / .085 <= 1;
  if (d < .035) return WHITE;
  if (inV) return y < 0 ? TERRA : INK;
  if (inH) return INK;
  if (d < .30) return SUN;
  if (d < .335 && d > .315) return SUN;
  return BG;
}
function render(size, opts) {
  const px = Buffer.alloc(size * size * 4); const ss = 4;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
      const c = colorAt((x + (sx + .5) / ss) / size, (y + (sy + .5) / ss) / size, opts);
      if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255; }
    }
    const n = ss * ss, i = (y * size + x) * 4;
    if (a) { px[i] = r / (a / 255); px[i + 1] = g / (a / 255); px[i + 2] = b / (a / 255); }
    px[i + 3] = a / n;
  }
  return png(size, px);
}
writeFileSync(join(out, 'icon-192.png'), render(192, { rounded: true, scale: 1 }));
writeFileSync(join(out, 'icon-512.png'), render(512, { rounded: true, scale: 1 }));
writeFileSync(join(out, 'maskable-512.png'), render(512, { rounded: false, scale: .8 }));
writeFileSync(join(out, 'apple-touch-icon.png'), render(180, { rounded: false, scale: .9 }));
console.log('Icônes générées dans', out);
