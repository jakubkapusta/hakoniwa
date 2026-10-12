// Canvas 2D painting helpers. Everything the player sees is painted here at runtime — no image files.
// Two coordinate conventions are used:
//  - cutouts: world units, y up (the canvas transform is flipped), see kit.cutoutAsset
//  - boards: world units, y down (canvas top = the hinge / back edge), see kit.boardMat
import * as THREE from 'three';
import { clamp, mix, pick, rand, rgba, rnd } from './util';

export type Ctx = CanvasRenderingContext2D;
/** Anything that can trace a path: a THREE.Shape or a canvas context. */
export interface Pen {
  moveTo(x: number, y: number): unknown;
  lineTo(x: number, y: number): unknown;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): unknown;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): unknown;
  closePath(): unknown;
}
export type Outline = (p: Pen) => void;

export const JP = '"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","Noto Serif CJK JP",serif';
export const JPG = '"Hiragino Maru Gothic ProN","Hiragino Sans","Yu Gothic","Noto Sans JP",sans-serif';

export function newCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(w));
  c.height = Math.max(2, Math.round(h));
  return c;
}

let ANISO = 4;
export const setAniso = (a: number) => { ANISO = a; };
export function toTex(cv: HTMLCanvasElement, flipY = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = ANISO;
  t.flipY = flipY;
  return t;
}

export function dab(c: Ctx, x: number, y: number, r: number, col: string, a = 1) {
  c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.abs(r), 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
}
export function soft(c: Ctx, x: number, y: number, r: number, col: string, a = 1) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
}
/** Irregular blob — the basic watercolour mark. */
export function blob(c: Ctx, x: number, y: number, r: number, col: string, a = 1, wob = 0.25) {
  const n = 9, ph = rand(0, 6);
  c.globalAlpha = a; c.fillStyle = col; c.beginPath();
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2, rr = r * (1 + wob * Math.sin(t * 3 + ph) * 0.6 + wob * (rnd() - 0.5) * 0.5);
    const px = x + Math.cos(t) * rr, py = y + Math.sin(t) * rr;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath(); c.fill(); c.globalAlpha = 1;
}
/** Watercolour wash: the path filled in a few offset, transparent layers, with a darker pooled edge. */
export function wash(c: Ctx, path: Outline, col: string, { layers = 4, jitter = 0.012, edge = 0.18, a = 0.4 } = {}) {
  for (let i = 0; i < layers; i++) {
    c.save(); c.translate(rand(-jitter, jitter), rand(-jitter, jitter));
    c.globalAlpha = a; c.fillStyle = mix(col, rnd() < 0.5 ? '#ffffff' : '#000000', rand(0, 0.08));
    c.beginPath(); path(c); c.fill(); c.restore();
  }
  c.globalAlpha = 1; c.beginPath(); path(c); c.fillStyle = col; c.globalAlpha = 0.5; c.fill();
  c.globalAlpha = edge; c.strokeStyle = mix(col, '#2a1a10', 0.4); c.lineWidth = jitter * 1.6; c.stroke(); c.globalAlpha = 1;
}
/** Many soft blobs of nearby colours over an area — mottled paint instead of flat fills. */
export function mottle(c: Ctx, x0: number, y0: number, w: number, h: number, cols: string[], n: number, r: [number, number], a = 0.25) {
  for (let i = 0; i < n; i++) blob(c, x0 + rnd() * w, y0 + rnd() * h, rand(r[0], r[1]), pick(cols), a);
}
/** Paper grain on the finished pixels. */
export function grain(cv: HTMLCanvasElement, amt = 3.5) {
  const c = cv.getContext('2d')!;
  const im = c.getImageData(0, 0, cv.width, cv.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const n = (Math.random() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
  }
  c.putImageData(im, 0, 0);
}

/** Text at a world-unit position and size, upright in both coordinate conventions. 'ー' turns in vertical text. */
export function text(c: Ctx, s: string, x: number, y: number, size: number, col: string,
  { font = JP, weight = '800', vertical = false, align = 'center' as CanvasTextAlign } = {}) {
  const m = c.getTransform();
  const sx = Math.hypot(m.a, m.b), sy = Math.hypot(m.c, m.d);
  c.save(); c.translate(x, y); c.scale(1 / sx, (m.d < 0 ? -1 : 1) / sy);
  const px = size * sx;
  c.font = `${weight} ${px}px ${font}`; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle';
  if (vertical) {
    const ch = [...s], st = px * 1.08;
    let yy = -((ch.length - 1) * st) / 2;
    for (const k of ch) {
      if (k === 'ー' || k === '〜') { c.save(); c.translate(0, yy); c.rotate(Math.PI / 2); c.fillText(k, 0, 0); c.restore(); }
      else c.fillText(k, 0, yy);
      yy += st;
    }
  } else c.fillText(s, 0, 0);
  c.restore();
}

export function circ(p: Pen, cx: number, cy: number, r: number) {
  const k = 0.5523 * r;
  p.moveTo(cx + r, cy);
  p.bezierCurveTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
  p.bezierCurveTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
  p.bezierCurveTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
  p.bezierCurveTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
  p.closePath();
}
export function poly(p: Pen, pts: number[][]) {
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  p.closePath();
}
export function rrect(p: Pen, x0: number, y0: number, x1: number, y1: number, r: number) {
  p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r);
  p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
  p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r);
  p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0); p.closePath();
}
/** Closed outline of a polar blob (canopies, bushes): r(a) around (cx, cy), squashed by sy. */
export function polarPts(cx: number, cy: number, r: (a: number) => number, sy = 1, a0 = 0, a1 = Math.PI * 2, n = 90): number[][] {
  const out: number[][] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push([cx + Math.cos(a) * r(a), cy + Math.sin(a) * r(a) * sy]); }
  return out;
}
/** Outline of a tapering band along a cubic bezier (tails, stems). */
export function bandPts(P: number[][], w0: number, w1: number, n = 20): number[][] {
  const S: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    S.push([0, 1].map((k) => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]));
  }
  const L: number[][] = [], Rr: number[][] = [];
  S.forEach((s, i) => {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(n, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = w0 + (w1 - w0) * (i / n);
    L.push([s[0] - dy * w, s[1] + dx * w]); Rr.push([s[0] + dy * w, s[1] - dx * w]);
  });
  const tip = [S[n][0] + (S[n][0] - S[n - 1][0]) * 1.5, S[n][1] + (S[n][1] - S[n - 1][1]) * 1.5];
  return [...L, tip, ...Rr.reverse()];
}

/** Wooden planks over (0,0)-(W,H), grain along x ('h') or y ('v'). */
export function wood(c: Ctx, W: number, H: number, base: string, { dir = 'h', plank = 0.16, frame = 0 } = {}) {
  c.fillStyle = base; c.fillRect(0, 0, W, H);
  const L = dir === 'h' ? H : W, Lo = dir === 'h' ? W : H;
  const n = Math.max(1, Math.round(L / plank)), pw = L / n;
  for (let i = 0; i < n; i++) {
    c.fillStyle = mix(base, rnd() < 0.5 ? '#3a2414' : '#fff4e0', rand(0, 0.14));
    dir === 'h' ? c.fillRect(0, i * pw, W, pw) : c.fillRect(i * pw, 0, pw, H);
    for (let k = 0; k < 9; k++) {
      c.strokeStyle = rgba(mix(base, '#2a1a0e', 0.5), rand(0.07, 0.2)); c.lineWidth = rand(0.003, 0.009); c.beginPath();
      const off = i * pw + rand(0.08, 0.92) * pw, f = rand(2, 7), ph = rand(0, 6), amp = pw * rand(0.02, 0.08);
      for (let s = 0; s <= 24; s++) {
        const a = (s / 24) * Lo, b = off + Math.sin(a * f + ph) * amp;
        if (dir === 'h') s ? c.lineTo(a, b) : c.moveTo(a, b);
        else s ? c.lineTo(b, a) : c.moveTo(b, a);
      }
      c.stroke();
    }
    if (rnd() < 0.3) {
      const kx = dir === 'h' ? rand(0, W) : i * pw + pw / 2, ky = dir === 'h' ? i * pw + pw / 2 : rand(0, H);
      dab(c, kx, ky, pw * 0.12, mix(base, '#2a1a0e', 0.45), 0.5);
    }
    c.fillStyle = rgba('#2a1a0e', 0.35);
    const sw = Math.min(0.008, pw * 0.1);
    dir === 'h' ? c.fillRect(0, i * pw, W, sw) : c.fillRect(i * pw, 0, sw, H);
  }
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(255,240,210,.12)'); g.addColorStop(1, 'rgba(60,30,10,.12)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (frame) { c.strokeStyle = rgba(mix(base, '#000000', 0.45), 0.9); c.lineWidth = frame; c.strokeRect(frame / 2, frame / 2, W - frame, H - frame); }
}

/** Grass: short upward strokes over an area, skipping where `skip` says. */
export function grass(c: Ctx, x0: number, y0: number, w: number, h: number, cols: string[], n: number, skip?: (x: number, y: number) => boolean, len = [0.035, 0.08]) {
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * w, y = y0 + rnd() * h;
    if (skip?.(x, y)) continue;
    c.strokeStyle = pick(cols); c.globalAlpha = rand(0.5, 0.9); c.lineWidth = rand(0.008, 0.016);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + rand(-0.025, 0.025), y + rand(len[0], len[1])); c.stroke();
  }
  c.globalAlpha = 1;
}

/** Tree clumps along a curve (Ghibli-style round foliage with a lit top-left). */
export function clumps(c: Ctx, fy: (x: number) => number, x0: number, x1: number, col: string, step = [0.06, 0.12], chance = 0.6, rr = [0.05, 0.11]) {
  for (let x = x0; x < x1; x += rand(step[0], step[1])) {
    if (rnd() > chance) continue;
    const y = fy(x) + rand(-0.02, 0.04), r = rand(rr[0], rr[1]);
    blob(c, x, y, r, mix(col, '#1e3a22', 0.25), 1, 0.15);
    blob(c, x - r * 0.25, y + r * 0.25, r * 0.65, mix(col, '#f4ffe0', 0.18), 0.8, 0.15);
  }
}

// ── anime-style brushes: a few flat tones with crisp edges instead of noise

export interface Tones { shade: string; mid: string; light: string; hi: string }
/**
 * A foliage crown (or a cloud of blossoms, a bush) as layered puffs, lit from the upper left:
 * the whole silhouette in the shade tone, the mid tone shifted up-left inside it, light tone on the lit side, a few highlights.
 * `inside(x, y)` limits where puffs may sit; puffs are spread over the bounding box (x0, y0, w, h), y up.
 */
export function foliage(c: Ctx, x0: number, y0: number, w: number, h: number, t: Tones,
  { n = 40, r = [0.12, 0.22], inside, light = [-0.6, 0.8] }: { n?: number; r?: number[]; inside?: (x: number, y: number) => boolean; light?: number[] } = {}) {
  const puffs: number[][] = [];
  for (let i = 0, guard = 0; i < n && guard < n * 20; guard++) {
    const x = x0 + rnd() * w, y = y0 + rnd() * h;
    if (inside && !inside(x, y)) continue;
    puffs.push([x, y, rand(r[0], r[1])]); i++;
  }
  puffs.sort((a, b) => a[1] - b[1]); // lower puffs first, upper ones overlap them (y up)
  const [lx, ly] = light, cx = x0 + w / 2, cy = y0 + h / 2;
  for (const [x, y, rr] of puffs) {
    blob(c, x, y, rr * 1.05, t.shade, 1, 0.14);
    blob(c, x + lx * rr * 0.22, y + ly * rr * 0.22, rr * 0.82, t.mid, 1, 0.14);
    // the lit side of the crown gets the light tone
    const lit = ((x - cx) * lx + (y - cy) * ly) / (Math.hypot(w, h) * 0.5) + rand(-0.25, 0.35);
    if (lit > 0.05) blob(c, x + lx * rr * 0.42, y + ly * rr * 0.42, rr * 0.5, t.light, 1, 0.18);
    if (lit > 0.35) for (let k = 0; k < 3; k++) dab(c, x + lx * rr * rand(0.4, 0.7) + rand(-0.3, 0.3) * rr, y + ly * rr * rand(0.4, 0.7) + rand(-0.3, 0.3) * rr, rr * rand(0.06, 0.12), t.hi, 0.95);
  }
}
/** Grass drawn as small tufts of 3–5 curved blades (dark at the root side, lighter on top). */
export function tufts(c: Ctx, x0: number, y0: number, w: number, h: number, cols: string[], n: number, skip?: (x: number, y: number) => boolean, size = 1) {
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * w, y = y0 + rnd() * h;
    if (skip?.(x, y)) continue;
    const k = 3 + Math.floor(rnd() * 3), col = pick(cols);
    for (let b = 0; b < k; b++) {
      const lean = (b - (k - 1) / 2) * 0.012 * size + rand(-0.006, 0.006), len = rand(0.035, 0.07) * size;
      c.strokeStyle = b === 0 ? mix(col, '#1f3a1a', 0.25) : col; c.lineWidth = rand(0.008, 0.013) * size;
      c.beginPath(); c.moveTo(x + b * 0.006 * size, y); c.quadraticCurveTo(x + lean * 0.4, y + len * 0.6, x + lean * 2.2, y + len); c.stroke();
    }
  }
}
/** Meadow: a base green with crisp lit and shaded patches, then tufts. */
export function meadow(c: Ctx, x0: number, y0: number, w: number, h: number,
  pal: { base: string; light: string; shade: string; tufts: string[] }, skip?: (x: number, y: number) => boolean, density = 1) {
  c.fillStyle = pal.base; c.fillRect(x0, y0, w, h);
  for (let i = 0; i < 16; i++) blob(c, x0 + rnd() * w, y0 + rnd() * h, rand(0.35, 0.8), pal.shade, 0.45, 0.4);
  for (let i = 0; i < 22; i++) blob(c, x0 + rnd() * w, y0 + rnd() * h, rand(0.25, 0.6), pal.light, 0.55, 0.4);
  if (pal.tufts.length) tufts(c, x0, y0, w, h, pal.tufts, Math.round(1500 * density), skip);
}
/** Flower clusters on grass. */
export function flowers(c: Ctx, x0: number, y0: number, w: number, h: number, cols: string[], n: number, skip?: (x: number, y: number) => boolean) {
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * w, y = y0 + rnd() * h;
    if (skip?.(x, y)) continue;
    const col = pick(cols);
    for (let k = 0; k < 4; k++) { const px = x + rand(-0.04, 0.04), py = y + rand(-0.03, 0.03); dab(c, px, py, 0.016, mix(col, '#5a4a6a', 0.25)); dab(c, px - 0.003, py + 0.003, 0.012, col); }
  }
}

// ── sky
export interface SkyPalette {
  grad: [number, string][];
  cloud: string; hi: string; edge: string; shadow: string;
  stars?: boolean;
  clouds?: [number, number, number][]; // cx, cy, scale on a 1200² canvas
  overcast?: number; // 0..1 grey veil (rainy scenes)
}
const DEFAULT_CLOUDS: [number, number, number][] = [[170, 470, 0.75], [700, 330, 0.95], [1060, 560, 0.65], [360, 780, 0.55], [930, 860, 0.6]];
/** Painted sky with cumulus clouds; same layout for every palette so day and evening crossfade cleanly. */
export function paintSky(pal: SkyPalette, seed = 77): HTMLCanvasElement {
  const S = 1200, cv = newCanvas(S, S), x = cv.getContext('2d')!;
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const g = x.createLinearGradient(0, 0, 0, S);
  pal.grad.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  if (pal.stars) for (let i = 0; i < 160; i++) {
    x.fillStyle = `rgba(255,248,230,${0.3 + r() * 0.6})`;
    const sz = r() < 0.1 ? 2.5 : 1.4;
    x.fillRect(r() * S, r() * S * 0.45, sz, sz);
  }
  for (const [cx, cy, sc] of pal.clouds ?? DEFAULT_CLOUDS) {
    // anime cumulus: a silhouette in the shadow tone, the lit body shifted up-left inside it, bright crowns on top, flat bottom
    const parts: number[][] = [];
    for (let i = 0; i < 15; i++) {
      const t = i / 14, mid = 1 - Math.abs(t - 0.5) * 2, rad = (40 + mid * 90 * (0.6 + r() * 0.6)) * sc;
      parts.push([cx + (t - 0.5) * 380 * sc + (r() - 0.5) * 40 * sc, cy - rad * 0.5 - mid * 50 * sc * r(), rad]);
    }
    for (let i = 0; i < 6; i++) { const p = parts[2 + Math.floor(r() * 11)]; parts.push([p[0] + (r() - 0.5) * p[2], p[1] - p[2] * (0.5 + r() * 0.4), p[2] * (0.45 + r() * 0.3)]); }
    const oc = newCanvas(S, S), o = oc.getContext('2d')!;
    const union = () => { o.beginPath(); for (const [px, py, rad] of parts) { o.moveTo(px + rad, py); o.arc(px, py, rad, 0, 7); } };
    union(); o.fillStyle = pal.shadow; o.fill();
    o.save(); union(); o.clip();
    o.fillStyle = pal.cloud; o.beginPath();
    for (const [px, py, rad] of parts) { o.moveTo(px - rad * 0.16 + rad * 0.86, py - rad * 0.24); o.arc(px - rad * 0.16, py - rad * 0.24, rad * 0.86, 0, 7); }
    o.fill();
    o.fillStyle = pal.hi; o.beginPath();
    for (const [px, py, rad] of parts) if (py < cy - 60 * sc) { o.moveTo(px - rad * 0.3 + rad * 0.5, py - rad * 0.45); o.arc(px - rad * 0.3, py - rad * 0.45, rad * 0.5, 0, 7); }
    o.fill();
    o.restore();
    o.globalCompositeOperation = 'destination-out';
    const fg = o.createLinearGradient(0, cy - 14 * sc, 0, cy + 4 * sc);
    fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,1)');
    o.fillStyle = fg; o.fillRect(0, cy - 14 * sc, S, S);
    x.filter = 'blur(1.2px)'; x.drawImage(oc, 0, 0); x.filter = 'none';
  }
  // thin streaks low over the horizon
  for (let i = 0; i < 7; i++) {
    const yy = S * (0.62 + r() * 0.25), xx = r() * S, ww = 120 + r() * 220;
    x.fillStyle = pal.cloud; x.globalAlpha = 0.35 + r() * 0.3;
    x.beginPath(); x.ellipse(xx, yy, ww, 6 + r() * 6, 0, 0, 7); x.fill(); x.globalAlpha = 1;
  }
  if (pal.overcast) { x.fillStyle = `rgba(150,160,172,${clamp(pal.overcast, 0, 1)})`; x.fillRect(0, 0, S, S); }
  return cv;
}
