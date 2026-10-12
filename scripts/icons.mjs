// Generates the PWA icons (PNG) procedurally: a little cardboard diorama (ramen stall under a sakura).
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x / size, y / size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const sstep = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// signed distance to a box centred at (cx, cy) with half sizes (hx, hy), rounded by r
const box = (u, v, cx, cy, hx, hy, r = 0) => {
  const qx = Math.max(Math.abs(u - cx) - hx + r, 0), qy = Math.max(Math.abs(v - cy) - hy + r, 0);
  return Math.hypot(qx, qy) - r;
};
const fill = (c, col, d, soft = 0.004) => mix(c, col, sstep(soft, -soft, d));

function pixel(u, v, maskable) {
  // warm paper backdrop with a soft sky
  let c = mix([250, 238, 214], [196, 224, 236], sstep(0.75, 0.1, v));
  // sakura behind
  const td = Math.hypot((u - 0.27) / 1.1, v - 0.33) - 0.17 - 0.012 * Math.sin(Math.atan2(v - 0.33, u - 0.27) * 7);
  c = fill(c, [244, 182, 198], td);
  c = fill(c, [252, 222, 230], Math.hypot(u - 0.23, v - 0.28) - 0.07);
  c = fill(c, [122, 88, 67], box(u, v, 0.27, 0.56, 0.018, 0.1));
  // base slab: grass on top, soil edge
  c = fill(c, [118, 82, 58], box(u, v, 0.5, 0.79, 0.4, 0.06, 0.03));
  c = fill(c, [140, 190, 104], box(u, v, 0.5, 0.71, 0.4, 0.05, 0.03));
  // cart and counter
  c = fill(c, [169, 107, 67], box(u, v, 0.55, 0.6, 0.18, 0.09, 0.01));
  c = fill(c, [220, 180, 135], box(u, v, 0.55, 0.505, 0.21, 0.017, 0.005));
  c = fill(c, [93, 67, 48], Math.hypot(u - 0.36, v - 0.64) - 0.055);
  c = fill(c, [167, 123, 82], Math.hypot(u - 0.36, v - 0.64) - 0.035);
  // posts, roof, noren
  for (const x of [0.39, 0.71]) c = fill(c, [110, 74, 48], box(u, v, x, 0.43, 0.012, 0.08));
  const roofD = Math.max(v - 0.36, 0.22 - v, Math.abs(u - 0.55) - 0.26 + (0.36 - v) * 0.5);
  c = fill(c, [85, 101, 122], roofD);
  c = fill(c, [43, 63, 107], box(u, v, 0.55, 0.39, 0.15, 0.03));
  // red lantern
  c = fill(c, [226, 82, 58], Math.hypot((u - 0.76) / 0.8, v - 0.42) - 0.035);
  // steam
  c = mix(c, [255, 255, 255], Math.exp(-(((u - 0.5) ** 2) + ((v - 0.17) ** 2)) / 0.003) * 0.25);

  let a = 255;
  if (!maskable) {
    const dd = box(u, v, 0.5, 0.5, 0.5, 0.5, 0.2);
    a = clamp(255 * Math.min(1, Math.max(0, -dd * 300)));
  }
  return [clamp(c[0]), clamp(c[1]), clamp(c[2]), a];
}

writeFileSync('public/icon-192.png', png(192, (u, v) => pixel(u, v, false)));
writeFileSync('public/icon-512.png', png(512, (u, v) => pixel(u, v, false)));
writeFileSync('public/icon-maskable-512.png', png(512, (u, v) => pixel(0.5 + (u - 0.5) * 1.25, 0.5 + (v - 0.5) * 1.25, true)));
writeFileSync('public/apple-touch-icon.png', png(180, (u, v) => pixel(u, v, true)));
console.log('icons written');
