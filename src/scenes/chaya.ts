// Scene 7: a teahouse in a stroll garden in late spring. A koi pond with a red arched bridge, a waterfall, stone
// lanterns, a shishi-odoshi knocking, and a wisteria arbour over a bench where tea is served. Bigger kit (32 pieces).
// Finale: dusk, the lanterns and the paper walls glow, fireflies over the pond, wisteria petals drift.
import * as THREE from 'three';
import { audio, sfx } from '../audio/audio';
import { blob, dab, foliage, JPG, meadow, newCanvas, poly, rrect, soft, text, toTex, tufts, wood, type Ctx, type Pen } from '../core/paint';
import { ease, lerp, mix, pick, rand, rnd } from '../core/util';
import { boardMat, cutout, cutoutAsset, gableRoof, glowing, group, latheMat, memo, paperMat, plainM, toon, wallNet, type Foldable } from '../kit/kit';
import { face, figure, seatedOutline } from '../kit/people';
import type { SceneDef } from './types';

const V3 = THREE.Vector3;
const K = (s: string) => 'chaya:' + s;
const HX = 1.75, HZ = -1.2, HW = 2.0, HD = 1.3, HH = 0.92, FLOOR = 0.22; // the teahouse
const PX = 1.95, PZ = 0.95, PH = 1.35; // the wisteria arbour
const SEAT = 0.36;

// ── the pond: two lobes joined by a narrow waist (the bridge crosses the waist)
interface Lobe { cx: number; cz: number; a: number; b: number; ang: number }
const LOBES: Lobe[] = [
  { cx: -1.6, cz: -0.95, a: 1.15, b: 0.55, ang: 0 },
  { cx: -0.7, cz: 0.85, a: 0.95, b: 0.5, ang: 0 },
  { cx: -1.1, cz: -0.05, a: 0.8, b: 0.42, ang: Math.atan2(1.8, 0.9) },
];
const lobeF = (l: Lobe, x: number, z: number) => {
  const dx = x - l.cx, dz = z - l.cz, c = Math.cos(l.ang), s = Math.sin(l.ang);
  return 1 - ((dx * c + dz * s) / l.a) ** 2 - ((-dx * s + dz * c) / l.b) ** 2;
};
const pondF = (x: number, z: number) => Math.max(...LOBES.map((l) => lobeF(l, x, z)));
/** Ellipse outline of a lobe in ground-print coordinates (y = -z), grown by `grow`. */
function lobePath(p: Pen, l: Lobe, grow = 0, flipZ = true) {
  const pts: number[][] = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2, u = Math.cos(a) * (l.a + grow), v = Math.sin(a) * (l.b + grow);
    const x = l.cx + u * Math.cos(l.ang) - v * Math.sin(l.ang), z = l.cz + u * Math.sin(l.ang) + v * Math.cos(l.ang);
    pts.push([x, flipZ ? -z : z]);
  }
  poly(p, pts);
}
const BRIDGE = { x: -1.1, z: -0.05, rot: Math.atan2(0.447, 0.894), half: 0.72 };
const bridgeEnds = [-1, 1].map((s) => [BRIDGE.x + s * BRIDGE.half * Math.cos(BRIDGE.rot), BRIDGE.z - s * BRIDGE.half * Math.sin(BRIDGE.rot)]);
const FALLS: [number, number] = [-2.45, -1.55];
const YUKIMI: [number, number] = [-1.85, 0.55];
/** Points along the pond's shore, about `gap` apart. */
function shore(gap: number): number[][] {
  const out: number[][] = [];
  LOBES.slice(0, 2).forEach((l, li) => {
    const other = LOBES[1 - li];
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      let r = 0; while (r < 3 && pondF(l.cx + Math.cos(a) * r, l.cz + Math.sin(a) * r) > 0) r += 0.01;
      const x = l.cx + Math.cos(a) * r, z = l.cz + Math.sin(a) * r;
      if (lobeF(other, x, z) > lobeF(l, x, z)) continue;
      const last = out[out.length - 1];
      if (!last || Math.hypot(last[0] - x, last[1] - z) > gap) out.push([x, z]);
    }
  });
  return out;
}

// ── backdrop: layered green hills, a far blue mountain, a pagoda roof among the trees
const hillY = (x: number) => 0.95 + 0.25 * Math.sin(x * 0.9 + 0.6) + 0.12 * Math.sin(x * 2.3);
function hillsOutline(p: Pen) {
  p.moveTo(-3.1, 0);
  for (let i = 0; i <= 80; i++) { const x = -3.1 + (6.2 * i) / 80; p.lineTo(x, Math.max(hillY(x), 1.55 + 0.6 * Math.max(0, 1 - Math.abs(x - 1.3) / 1.6) ** 1.4)); }
  p.lineTo(3.1, 0); p.closePath();
}
const hillsA = () => cutoutAsset(K('hills'), hillsOutline, (c) => {
  // far mountain
  c.fillStyle = '#9db8d4'; c.fillRect(-3.2, 0, 6.4, 2.4);
  c.fillStyle = '#b8cde0'; c.beginPath(); c.moveTo(1.3, 2.15); c.lineTo(0.7, 1.4); c.lineTo(1.25, 1.55); c.closePath(); c.fill();
  // rolling hills in two greens with tree clumps
  c.fillStyle = '#6f9e6a'; c.beginPath(); c.moveTo(-3.2, 0);
  for (let x = -3.2; x <= 3.2; x += 0.05) c.lineTo(x, hillY(x)); c.lineTo(3.2, 0); c.closePath(); c.fill();
  foliage(c, -3.15, 0.45, 6.3, 0.6, { shade: '#4c7a52', mid: '#6a9a62', light: '#8cbc78', hi: '#c4e0a0' }, { n: 60, r: [0.1, 0.18], inside: (x, y) => y < hillY(x) - 0.05 });
  // a pagoda roof peeking out on the left hill
  const px = -1.9, py = hillY(-1.9) - 0.12;
  c.fillStyle = '#5a3a30'; for (let k = 0; k < 3; k++) { const w = 0.2 - k * 0.04, y = py + k * 0.13; c.beginPath(); poly(c, [[px - w, y], [px + w, y], [px + w * 0.5, y + 0.06], [px - w * 0.5, y + 0.06]]); c.fill(); }
  c.fillStyle = '#c99a4a'; c.fillRect(px - 0.006, py + 0.38, 0.012, 0.14);
  // a band of bamboo on the right in front
  for (let x = 1.6; x < 3.2; x += rand(0.04, 0.07)) { c.fillStyle = pick(['#5f9a5a', '#4f8a4f', '#76ae66']); c.fillRect(x, 0, 0.015, 0.75 + rand(0, 0.25)); }
  foliage(c, 1.5, 0.55, 1.7, 0.5, { shade: '#3f7a4a', mid: '#5f9a5a', light: '#86bc72', hi: '#c8e8a0' }, { n: 26, r: [0.07, 0.13] });
  c.fillStyle = '#5a8a58'; c.fillRect(-3.2, 0, 6.4, 0.3);
}, { ppu: 170, ink: 0 });

// ── bamboo fence (kenninji-gaki): split bamboo slats, three bars tied with black rope
const FENCE_W = 3.0, FENCE_H = 0.62;
const fenceA = () => cutoutAsset(K('fence'), (p) => poly(p, [[-FENCE_W / 2, 0], [FENCE_W / 2, 0], [FENCE_W / 2, FENCE_H + 0.06], [FENCE_W / 2 - 0.08, FENCE_H + 0.06], [FENCE_W / 2 - 0.08, FENCE_H], [-FENCE_W / 2 + 0.08, FENCE_H], [-FENCE_W / 2 + 0.08, FENCE_H + 0.06], [-FENCE_W / 2, FENCE_H + 0.06]]), (c) => {
  for (let x = -FENCE_W / 2; x < FENCE_W / 2; x += 0.045) { c.fillStyle = pick(['#cdb57a', '#c2a86c', '#d8c48c']); c.fillRect(x, 0, 0.043, FENCE_H); c.fillStyle = 'rgba(90,70,30,.25)'; c.fillRect(x + 0.036, 0, 0.007, FENCE_H); }
  [0.12, 0.33, 0.54].forEach((y) => {
    c.fillStyle = '#9a8048'; c.fillRect(-FENCE_W / 2, y - 0.025, FENCE_W, 0.05); c.fillStyle = '#c8b070'; c.fillRect(-FENCE_W / 2, y + 0.005, FENCE_W, 0.015);
    for (let x = -FENCE_W / 2 + 0.2; x < FENCE_W / 2; x += 0.3) { c.fillStyle = '#2a2420'; c.fillRect(x, y - 0.035, 0.03, 0.07); c.fillRect(x - 0.01, y - 0.01, 0.05, 0.02); }
  });
  c.fillStyle = '#7a6040'; c.fillRect(-FENCE_W / 2, 0, 0.08, FENCE_H + 0.06); c.fillRect(FENCE_W / 2 - 0.08, 0, 0.08, FENCE_H + 0.06);
  c.fillStyle = '#c8b070'; c.fillRect(-FENCE_W / 2, FENCE_H - 0.02, FENCE_W, 0.03);
}, { ppu: 300, t: 0.04 });

// ── a cloud-pruned pine (niwaki): a bent trunk with flat round pads of needles
const pineDark = () => plainM(K('pineD'), '#2f5a40'), pineLight = () => plainM(K('pineL'), '#4f7f50');
function buildPine() {
  const bark = plainM(K('bark'), '#6a5040');
  const curve = new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(0.08, 0.5, 0), new V3(-0.12, 1.0, 0.05), new V3(0.05, 1.5, 0.02), new V3(0.0, 1.85, 0)]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.07, 8), bark);
  const g = group(trunk);
  const pads: [number, number, number, number][] = [[0.45, 0.75, 0.1, 0.38], [-0.45, 1.05, 0.05, 0.4], [0.35, 1.4, -0.05, 0.33], [0.0, 1.9, 0.0, 0.36], [-0.3, 1.6, 0.1, 0.25]];
  pads.forEach(([x, y, z, r]) => {
    const base = curve.getPoint(Math.min(1, y / 1.9));
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, Math.hypot(x - base.x, 0.05) + 0.02, 6), bark);
    br.position.set((x + base.x) / 2, y - 0.04, (z + base.z) / 2); br.rotation.z = Math.PI / 2 - Math.atan2(0.05, x - base.x); g.add(br);
    const pd = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), pineDark()); pd.scale.set(1, 0.36, 0.85); pd.position.set(x, y, z); g.add(pd);
    const pl = new THREE.Mesh(new THREE.SphereGeometry(r * 0.75, 14, 8), pineLight()); pl.scale.set(1, 0.32, 0.8); pl.position.set(x - r * 0.12, y + r * 0.1, z + 0.02); g.add(pl);
  });
  return g;
}

// ── water: the pond surface (one ellipse per lobe, UVs from world position so the overlaps match)
const waterTex = () => memo(K('waterTex'), () => {
  const cv = newCanvas(512, 512), c = cv.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, 512, 512); g.addColorStop(0, '#3f7f7a'); g.addColorStop(1, '#4f948a'); c.fillStyle = g; c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) { c.fillStyle = 'rgba(30,70,70,.25)'; c.beginPath(); c.ellipse(rand(0, 512), rand(0, 512), rand(30, 80), rand(10, 30), rand(0, 3), 0, 7); c.fill(); }
  c.lineCap = 'round';
  for (let i = 0; i < 60; i++) {
    const x = rand(0, 512), y = rand(0, 512), w = rand(16, 50);
    c.strokeStyle = rnd() < 0.7 ? 'rgba(200,240,235,.45)' : 'rgba(255,255,255,.7)'; c.lineWidth = rand(2, 4);
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 5, x + w, y); c.stroke();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
});
const waterMat = () => memo(K('water'), () => toon({ map: waterTex(), side: THREE.DoubleSide }));
function buildPond() {
  const g = group();
  LOBES.forEach((l) => {
    const s = new THREE.Shape(); lobePath(s, l, 0, false);
    const geo = new THREE.ShapeGeometry(s, 4); geo.rotateX(Math.PI / 2); // shape y = world z
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 2.2, pos.getZ(i) / 2.2);
    // (rotated this way the faces point down; the material is double-sided)
    const m = new THREE.Mesh(geo, waterMat()); m.position.y = 0.02; m.receiveShadow = true;
    g.add(m);
  });
  g.userData.tick = (t) => { waterTex().offset.set(t * 0.01, Math.sin(t * 0.3) * 0.03); };
  return g;
}
const rockMats = () => memo(K('rocks'), () => ['#8f8b82', '#7d7a73', '#a39e92', '#6f6c66'].map((col) => toon({ color: col })));
function rock(r: number, sy = 0.55) {
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), pick(rockMats()));
  m.scale.set(rand(0.9, 1.25), sy * rand(0.85, 1.15), rand(0.85, 1.1)); m.rotation.y = rand(0, 6); m.castShadow = m.receiveShadow = true;
  return m;
}
function buildRocks() {
  const g = group();
  for (const [x, z] of shore(0.27)) {
    if (bridgeEnds.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 0.3)) continue;
    if (Math.hypot(FALLS[0] - x, FALLS[1] - z) < 0.5 || Math.hypot(YUKIMI[0] - x, YUKIMI[1] - z) < 0.22) continue;
    const r = rand(0.08, 0.15), m = rock(r, 0.5); m.position.set(x, r * 0.15, z); g.add(m);
  }
  return g;
}
const fallTex = () => memo(K('fallTex'), () => {
  const cv = newCanvas(64, 256), c = cv.getContext('2d')!;
  c.fillStyle = '#8fd0dc'; c.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 40; i++) { c.fillStyle = rnd() < 0.6 ? 'rgba(255,255,255,.75)' : 'rgba(60,140,160,.4)'; c.fillRect(rand(0, 64), rand(0, 256), rand(2, 5), rand(20, 70)); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
});
function buildFalls() {
  const g = group();
  [[0, 0.32, -0.12, 0.34, 1.3], [-0.35, 0.18, 0.05, 0.26, 1], [0.34, 0.16, 0.02, 0.24, 1], [0.12, 0.62, -0.18, 0.22, 1.1], [-0.18, 0.5, -0.2, 0.2, 1]].forEach(([x, y, z, r, s]) => { const m = rock(r, s); m.position.set(x, y, z); g.add(m); });
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.62), toon({ map: fallTex(), transparent: true, opacity: 0.92 }));
  fall.position.set(0.02, 0.36, 0.17); fall.rotation.x = -0.18; g.add(fall);
  const foamM = plainM(K('foam'), '#f2fbfb');
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(rand(0.04, 0.07), 8, 6), foamM); f.scale.y = 0.4; f.position.set(rand(-0.12, 0.14), 0.04, 0.26 + rand(-0.04, 0.06)); g.add(f); }
  g.userData.tick = (t) => { fallTex().offset.y = t * 0.9; };
  return g;
}
const padA = () => cutoutAsset(K('pad'), (p) => { p.moveTo(0, 0); for (let i = 0; i <= 40; i++) { const a = 0.25 + (i / 40) * (Math.PI * 2 - 0.5); p.lineTo(Math.cos(a) * 0.13, Math.sin(a) * 0.13); } p.closePath(); }, (c) => {
  c.fillStyle = '#4f8a3f'; c.fillRect(-0.2, -0.2, 0.4, 0.4); c.fillStyle = '#6aa64f'; c.beginPath(); c.arc(-0.02, 0.02, 0.1, 0.3, 6); c.fill();
  c.strokeStyle = 'rgba(40,80,30,.6)'; c.lineWidth = 0.006; for (let i = 0; i < 7; i++) { const a = 0.6 + i * 0.75; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 0.12, Math.sin(a) * 0.12); c.stroke(); }
}, { ppu: 700, t: 0.012, ink: 0.008 });
const lilyA = () => cutoutAsset(K('lily'), (p) => { const pts: number[][] = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 0.03 : 0.07; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } poly(p, pts); }, (c) => {
  c.fillStyle = '#f7c0d4'; c.fillRect(-0.1, -0.1, 0.2, 0.2); c.fillStyle = '#fbe0ea'; c.beginPath(); c.arc(-0.01, 0.01, 0.04, 0, 7); c.fill(); dab(c, 0, 0, 0.018, '#f2c94c');
}, { ppu: 900, t: 0.015, ink: 0.006 });
function buildLilies() {
  const g = group();
  [[-1.3, -1.12, 1.0, 1], [-0.95, -0.82, 0.8, 0], [-2.05, -0.72, 1.1, 1], [-1.1, 0.98, 0.9, 1], [-0.25, 0.68, 0.75, 0], [-0.62, 1.12, 1.0, 0], [-1.75, -1.18, 0.7, 0]].forEach(([x, z, s, fl]) => {
    const p = cutout(padA()); p.rotation.set(-Math.PI / 2, 0, rand(0, 6)); p.scale.setScalar(s); p.position.set(x, 0.03, z); g.add(p);
    if (fl) { [0, 0.4].forEach((r, k) => { const f = cutout(lilyA()); f.rotation.set(-Math.PI / 2, 0, r); f.position.set(x + 0.03, 0.045 + k * 0.012, z - 0.02); f.scale.setScalar(1 - k * 0.3); g.add(f); }); }
  });
  g.userData.tick = (t) => g.children.forEach((m, i) => { m.position.y = 0.03 + (i % 3) * 0.006 + Math.sin(t * 0.8 + i) * 0.003; });
  return g;
}

// ── the teahouse: a raised floor with tatami and a veranda, three walls (tokonoma inside, shoji outside), a bark roof
const floorTop = () => boardMat(K('floorTop'), 2.1, 1.55, (c, W, H) => {
  wood(c, W, H, '#b08a5c', { dir: 'h', plank: 0.08 });
  c.fillStyle = '#d6c88c'; c.fillRect(0.06, 0.06, W - 0.12, 1.22);
  const mats = [[0.06, 0.06, 0.66, 1.22], [0.72, 0.06, 0.66, 1.22], [1.38, 0.06, 0.66, 0.61], [1.38, 0.67, 0.66, 0.61]];
  mats.forEach(([x, y, w, h]) => {
    c.fillStyle = mix('#d6c88c', '#b8b070', rnd() * 0.4); c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(120,110,60,.25)'; c.lineWidth = 0.004; for (let k = 0.02; k < (w > h ? h : w); k += 0.02) { c.beginPath(); if (w > h) { c.moveTo(x, y + k); c.lineTo(x + w, y + k); } else { c.moveTo(x + k, y); c.lineTo(x + k, y + h); } c.stroke(); }
    c.strokeStyle = '#2f3a2a'; c.lineWidth = 0.025; c.strokeRect(x + 0.0125, y + 0.0125, w - 0.025, h - 0.025);
  });
  c.save(); c.translate(0, 1.3); wood(c, W, H - 1.3, '#a07848', { dir: 'h', plank: 0.06 }); c.restore();
}, { ppu: 360 });
function buildFloor() {
  const side = plainM(K('floorSide'), '#7a5a3a');
  const m = new THREE.Mesh(new THREE.BoxGeometry(2.1, FLOOR, 1.55), [side, side, floorTop(), side, side, side]); m.position.y = FLOOR / 2;
  const step = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.24), rockMats()[2]); step.position.set(-0.35, 0.05, 0.92);
  const g = group(m, step);
  // short legs under the veranda
  [-0.98, 0.98].forEach((x) => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.07), side); leg.position.set(x, 0.0, 0.72); g.add(leg); });
  return g;
}
const shojiPaint = (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#f6efdc'; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#7a5a3a'; c.lineWidth = 0.018;
  for (let x = 0; x <= W + 0.001; x += W / Math.round(W / 0.16)) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H * 0.82); c.stroke(); }
  for (let y = 0; y <= H * 0.82; y += 0.12) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.save(); c.translate(0, H * 0.82); wood(c, W, H * 0.18, '#7a5a3a', { dir: 'h', plank: 0.06 }); c.restore();
  c.fillStyle = '#4a3426'; c.fillRect(0, 0, W, 0.04); c.fillRect(0, 0, 0.04, H); c.fillRect(W - 0.04, 0, 0.04, H);
};
const shojiGlow = (c: Ctx, W: number, H: number) => { c.fillStyle = '#ffcf8a'; c.fillRect(0, 0, W, H * 0.82); c.strokeStyle = '#000000'; c.lineWidth = 0.02; for (let x = 0; x <= W; x += W / Math.round(W / 0.16)) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H * 0.82); c.stroke(); } };
const sideIn = () => boardMat(K('sideIn'), HD, HH, shojiPaint, { ppu: 300, emissive: shojiGlow });
const outside = () => boardMat(K('outside'), HD, HH, shojiPaint, { ppu: 300, emissive: shojiGlow });
const backIn = () => boardMat(K('backIn'), HW, HH, (c, W, H) => {
  c.fillStyle = '#e8d8b8'; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(160,120,80,.15)'; for (let i = 0; i < 30; i++) blob(c, rand(0, W), rand(0, H), rand(0.05, 0.15), '#d8c4a0', 0.4);
  // tokonoma alcove with a hanging scroll and a flower
  c.fillStyle = '#d4c098'; c.fillRect(0.3, 0.12, 0.7, H - 0.12); c.fillStyle = '#5a3a26'; c.fillRect(0.3, 0.1, 0.7, 0.04); c.fillRect(0.98, 0.1, 0.04, H - 0.1);
  c.fillStyle = '#6a7a5a'; c.fillRect(0.52, 0.18, 0.26, 0.56); c.fillStyle = '#f4ecd8'; c.fillRect(0.55, 0.23, 0.2, 0.46);
  text(c, '一期一会', 0.65, 0.46, 0.07, '#2a2420', { vertical: true });
  c.fillStyle = '#7a5a3a'; c.fillRect(0.5, 0.16, 0.3, 0.02); c.fillRect(0.5, 0.74, 0.3, 0.025);
  c.fillStyle = '#4a3426'; c.beginPath(); c.ellipse(0.88, H - 0.08, 0.05, 0.07, 0, 0, 7); c.fill();
  c.strokeStyle = '#4f7a3f'; c.lineWidth = 0.008; c.beginPath(); c.moveTo(0.88, H - 0.14); c.quadraticCurveTo(0.84, H - 0.26, 0.9, H - 0.34); c.stroke(); dab(c, 0.9, H - 0.34, 0.025, '#e8574a');
  // the rest is shoji
  c.save(); c.translate(1.05, 0); shojiPaint(c, W - 1.05, H); c.restore();
  c.fillStyle = '#4a3426'; c.fillRect(0, 0, W, 0.04);
}, { ppu: 320, emissive: (c, W, H) => { c.save(); c.translate(1.05, 0); shojiGlow(c, W - 1.05, H); c.restore(); } });
const buildWalls = () => wallNet({ w: HW, d: HD, h: HH, back: backIn(), side: sideIn(), outside: outside() });
const roofTop = () => boardMat(K('roofTop'), 2.4, 0.95, (c, W, H) => {
  c.fillStyle = '#6a5a4a'; c.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 0.09) { c.fillStyle = mix('#6a5a4a', '#8a7a62', rnd() * 0.6); c.fillRect(0, y, W, 0.085); c.fillStyle = 'rgba(30,20,10,.35)'; c.fillRect(0, y + 0.08, W, 0.01); }
  c.strokeStyle = 'rgba(40,30,20,.25)'; c.lineWidth = 0.005; for (let i = 0; i < 300; i++) { const x = rand(0, W), y = rand(0, H); c.beginPath(); c.moveTo(x, y); c.lineTo(x + rand(-0.01, 0.01), y + 0.05); c.stroke(); }
  for (let i = 0; i < 14; i++) blob(c, rand(0, W), rand(0.2, H), rand(0.04, 0.1), '#6f8a4a', 0.6, 0.3); // moss
  c.fillStyle = '#4a3a2c'; c.fillRect(0, H - 0.05, W, 0.05);
}, { ppu: 260 });
const furinA = () => cutoutAsset(K('furin'), (p) => { p.moveTo(-0.05, 0.18); p.bezierCurveTo(-0.05, 0.28, 0.05, 0.28, 0.05, 0.18); p.lineTo(0.012, 0.18); p.lineTo(0.012, 0.0); p.lineTo(0.05, 0.0); p.lineTo(0.05, -0.1); p.lineTo(-0.05, -0.1); p.lineTo(-0.05, 0.0); p.lineTo(-0.012, 0.0); p.lineTo(-0.012, 0.18); p.closePath(); }, (c) => {
  c.fillStyle = '#d8eef6'; c.fillRect(-0.06, 0.17, 0.12, 0.12); dab(c, -0.02, 0.22, 0.012, '#e8574a'); dab(c, 0.02, 0.21, 0.01, '#3f8fd0');
  c.fillStyle = '#f4ecd8'; c.fillRect(-0.06, -0.12, 0.12, 0.14); c.fillStyle = '#e8574a'; c.fillRect(-0.05, -0.1, 0.1, 0.02); c.fillStyle = '#2a2420'; c.fillRect(-0.015, 0, 0.03, 0.18);
}, { ppu: 900, t: 0.01, ink: 0.008 });
function buildRoof() {
  const roof = gableRoof({ w: 2.4, l: 0.95, angle: 0.55, top: roofTop(), under: plainM(K('roofU'), '#5a4030'), ridge: plainM(K('ridge'), '#3a2c22') });
  const fur = new THREE.Group(); fur.position.set(0.55, -0.8, 0.84); fur.add(cutout(furinA()));
  const g = group(roof, fur);
  g.userData.setFold = (k) => { roof.userData.setFold!(k); fur.visible = k > 0.95; };
  g.userData.tick = (t) => { fur.rotation.z = Math.sin(t * 1.7) * 0.12; fur.rotation.x = Math.sin(t * 1.1) * 0.08; };
  return g;
}
const banner = () => cutoutAsset(K('nobori'), (p) => poly(p, [[0, -0.95], [0.24, -0.95], [0.24, 0], [0, 0]]), (c) => {
  c.fillStyle = '#3f7a4a'; c.fillRect(0, -1, 0.3, 1.05); c.fillStyle = '#c4362f'; c.fillRect(0, -0.08, 0.24, 0.08);
  c.fillStyle = '#f4ecd8'; c.fillRect(0, -0.95, 0.24, 0.05);
  text(c, 'お茶', 0.12, -0.33, 0.12, '#f4ecd8', { vertical: true, font: JPG }); text(c, '甘味', 0.12, -0.7, 0.08, '#f2d24a', { vertical: true });
}, { ppu: 500, t: 0.01, ink: 0.01 });
function buildSign() {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 1.5, 8), plainM(K('pole'), '#c8b070')); pole.position.y = 0.75;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.26, 6), plainM(K('pole'), '#c8b070')); arm.rotation.z = Math.PI / 2; arm.position.set(0.13, 1.47, 0);
  const cloth = new THREE.Group(); cloth.position.set(0.02, 1.47, 0); cloth.add(cutout(banner()));
  const g = group(pole, arm, cloth);
  g.userData.tick = (t) => { cloth.rotation.y = Math.sin(t * 1.3) * 0.18; };
  return g;
}

// ── the arched bridge (taiko-bashi): a curved plank deck between two red side rails
const archY = (x: number) => 0.3 * (1 - (x / BRIDGE.half) ** 2) + 0.03;
const railA = () => cutoutAsset(K('rail'), (p) => {
  const pts: number[][] = [];
  for (let i = 0; i <= 30; i++) { const x = -BRIDGE.half - 0.02 + ((BRIDGE.half + 0.02) * 2 * i) / 30; pts.push([x, archY(x) - 0.05]); }
  for (let i = 30; i >= 0; i--) { const x = -BRIDGE.half + (BRIDGE.half * 2 * i) / 30; pts.push([x, archY(x) + 0.2]); }
  poly(p, pts);
}, (c) => {
  c.fillStyle = '#c8402f'; c.fillRect(-1, -0.2, 2, 1);
  for (let i = 0; i <= 6; i++) { const x = -BRIDGE.half + (BRIDGE.half * 2 * i) / 6; c.fillStyle = '#a8301f'; c.fillRect(x - 0.015, archY(x) - 0.05, 0.03, 0.26); }
  c.fillStyle = 'rgba(40,20,10,.35)'; for (let i = 0; i < 6; i++) { const x = -BRIDGE.half + (BRIDGE.half * 2 * (i + 0.5)) / 6; c.beginPath(); c.ellipse(x, archY(x) + 0.08, 0.04, 0.05, 0, 0, 7); c.fill(); }
  c.fillStyle = '#e8584a'; for (let i = 0; i <= 30; i++) { const x = -BRIDGE.half + (BRIDGE.half * 2 * i) / 30; c.fillRect(x - 0.03, archY(x) + 0.17, 0.06, 0.03); }
  [-BRIDGE.half, BRIDGE.half].forEach((x) => { dab(c, x, archY(x) + 0.22, 0.04, '#d8a84a'); dab(c, x - 0.012, archY(x) + 0.235, 0.015, '#f2d27a'); });
}, { ppu: 420, t: 0.03 });
function buildBridge() {
  const g = group(), plank = plainM(K('plank'), '#9a6a48');
  for (let i = 0; i < 16; i++) {
    const x = -BRIDGE.half + (BRIDGE.half * 2 * (i + 0.5)) / 16, slope = Math.atan(-0.6 * x / BRIDGE.half ** 2);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.4), plank); b.position.set(x, archY(x), 0); b.rotation.z = slope; g.add(b);
  }
  [-0.21, 0.21].forEach((z) => { const r = cutout(railA()); r.position.z = z; g.add(r); });
  g.traverse((m) => { m.castShadow = true; });
  return g;
}
function buildStones() {
  const g = group(), mats = rockMats();
  [[0.72, 2.2], [0.56, 1.86], [0.64, 1.52], [0.8, 1.18], [0.82, 0.83], [0.7, 0.48], [0.86, 0.14], [1.08, -0.16]].forEach(([x, z], i) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.05, 7), mats[i % 2 ? 0 : 2]); s.scale.set(rand(0.9, 1.15), 1, rand(0.75, 0.95)); s.rotation.y = rand(0, 6);
    s.position.set(x, 0.025, z); s.receiveShadow = true; g.add(s);
  });
  return g;
}

// ── stone lanterns: windows glow in the evening
function litMat(key: string, w: number, h: number, paint: (c: Ctx) => void, glow: (c: Ctx) => void) {
  return memo(K(key), () => {
    const a = newCanvas(w, h), b = newCanvas(w, h);
    paint(a.getContext('2d')!); const bc = b.getContext('2d')!; bc.fillStyle = '#000'; bc.fillRect(0, 0, w, h); glow(bc);
    const m = paperMat(toTex(a)); glowing(m); m.emissiveMap = toTex(b); return m;
  });
}
const fireboxMat = () => litMat('firebox', 192, 64, (c) => {
  c.fillStyle = '#a39e92'; c.fillRect(0, 0, 192, 64);
  [0, 96].forEach((x) => { c.fillStyle = '#3a3630'; c.fillRect(x + 6, 12, 20, 40); });
  [48, 144].forEach((x) => { c.fillStyle = '#7d7a73'; c.beginPath(); c.arc(x, 32, 9, 0, 7); c.fill(); }); // moon carvings
}, (c) => { [0, 96].forEach((x) => { c.fillStyle = '#ffc070'; c.fillRect(x + 6, 12, 20, 40); }); });
function buildKasuga() {
  const st = rockMats()[2], hex = (rt: number, rb: number, h: number, y: number, m: THREE.Material = st) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 6, 1, false, -Math.PI / 6), m); o.position.y = y; return o; };
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 12), st); post.position.y = 0.305;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.14, 6, 1, false, -Math.PI / 6), st); roof.position.y = 0.87;
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), st); jewel.position.y = 0.97;
  const g = group(hex(0.17, 0.2, 0.08, 0.04), post, hex(0.13, 0.08, 0.07, 0.565), hex(0.09, 0.09, 0.17, 0.685, fireboxMat()), hex(0.23, 0.23, 0.03, 0.785), roof, jewel);
  g.traverse((m) => { m.castShadow = true; });
  return g;
}
function buildYukimi() {
  const st = rockMats()[2], g = group();
  [0, 1, 2].forEach((i) => { const a = (i / 3) * Math.PI * 2 + 0.5, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.36, 6), st); leg.position.set(Math.cos(a) * 0.13, 0.17, Math.sin(a) * 0.13); leg.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); g.add(leg); });
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.05, 6, 1, false, -Math.PI / 6), st); plat.position.y = 0.36;
  const box = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 6, 1, false, -Math.PI / 6), fireboxMat()); box.position.y = 0.465;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.12, 6, 1, false, -Math.PI / 6), st); roof.position.y = 0.6;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), st); knob.position.y = 0.68;
  g.add(plat, box, roof, knob); g.traverse((m) => { m.castShadow = true; });
  return g;
}

// ── garden plants
const mapleR = (a: number) => 0.7 + 0.06 * Math.sin(a * 7) + 0.04 * Math.sin(a * 13);
function mapleOutline(p: Pen) {
  const pts: number[][] = [[0.06, 0], [0.06, 0.62]];
  for (let i = 0; i <= 80; i++) { const a = -Math.PI / 2 + 0.1 + ((Math.PI * 2 - 0.2) * i) / 80; pts.push([Math.cos(a) * mapleR(a) * 1.05, 1.22 + Math.sin(a) * mapleR(a) * 0.72]); }
  pts.push([-0.06, 0.62], [-0.06, 0]); poly(p, pts);
}
const maple = () => cutoutAsset(K('maple2'), mapleOutline, (c) => {
  c.fillStyle = '#b8423a'; c.fillRect(-0.8, 0.6, 1.6, 1.3);
  c.fillStyle = '#5a3a2e'; c.fillRect(-0.08, 0, 0.16, 1.0);
  c.strokeStyle = '#5a3a2e'; c.lineWidth = 0.035; c.lineCap = 'round'; [[-0.4, 1.1], [0.35, 1.05], [0.05, 1.45]].forEach(([x, y]) => { c.beginPath(); c.moveTo(0, 0.6); c.quadraticCurveTo(x * 0.4, y * 0.8, x, y); c.stroke(); });
  foliage(c, -0.75, 0.7, 1.5, 1.05, { shade: '#a8382f', mid: '#d4503f', light: '#ee7a5e', hi: '#ffc4a4' }, { n: 40, r: [0.11, 0.18], inside: (x, y) => Math.hypot(x / 1.05, (y - 1.22) / 0.72) < 0.66 });
}, { ppu: 300, t: 0.03 });
const buildMaple = () => { const a = cutout(maple()), b = cutout(maple()); b.rotation.y = Math.PI / 2; b.scale.x = 0.85; return group(a, b); };
const azaleaMat = () => memo(K('azalea'), () => {
  const cv = newCanvas(256, 128), c = cv.getContext('2d')!;
  c.fillStyle = '#4f7a3f'; c.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 260; i++) { const x = rand(0, 256), y = rand(0, 128); dab(c, x, y, rand(4, 7), pick(['#e8609a', '#f28ab4', '#d84a88'])); dab(c, x - 1, y - 1, 2, '#ffd0e4'); }
  for (let i = 0; i < 80; i++) dab(c, rand(0, 256), rand(0, 128), rand(2, 4), '#6a9a4f');
  return toon({ map: toTex(cv) });
});
function bush(r: number, mat: THREE.Material) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat); m.scale.y = 0.62; m.position.y = r * 0.45; m.castShadow = m.receiveShadow = true; return m; }
function buildAzaleas() {
  const g = group(), box = plainM(K('box'), '#4f8048');
  [[-0.62, 0.02, 0.22, 1], [-0.22, -0.08, 0.28, 1], [0.18, 0.04, 0.2, 0], [-0.05, 0.16, 0.16, 0]].forEach(([x, z, r, a]) => { const b = bush(r, a ? azaleaMat() : box); b.position.x = x; b.position.z = z; g.add(b); });
  return g;
}
const bambooMat = () => latheMat(K('bambooTex'), 64, 256, (c, w, h) => {
  c.fillStyle = '#6aa65a'; c.fillRect(0, 0, w, h); c.fillStyle = '#8cc472'; c.fillRect(w * 0.15, 0, w * 0.2, h);
  for (let y = 30; y < h; y += 64) { c.fillStyle = '#4a7a3f'; c.fillRect(0, y, w, 5); c.fillStyle = '#b8e09a'; c.fillRect(0, y + 5, w, 2); }
});
const bambooLeafA = () => cutoutAsset(K('bleaf'), (p) => poly(p, [[0, 0], [0.05, 0.022], [0.26, 0.0], [0.05, -0.016]]), (c) => {
  c.fillStyle = '#6aa84f'; c.fillRect(0, -0.05, 0.3, 0.1); c.fillStyle = '#9ccc6e'; c.beginPath(); poly(c, [[0.02, 0.002], [0.05, 0.018], [0.24, 0.002]]); c.fill();
}, { ppu: 700, t: 0.006, ink: 0 });
function leafFan(n: number) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const l = cutout(bambooLeafA()); l.rotation.set(rand(-0.4, 0.4), (i / n) * Math.PI * 2, -0.35 - rand(0, 0.4)); g.add(l); }
  return g;
}
function buildBamboo() {
  const g = group(), stalks: THREE.Group[] = [];
  [[0, 0, 2.6], [0.18, -0.15, 2.3], [-0.14, -0.2, 2.8], [0.08, 0.2, 2.0], [-0.2, 0.12, 2.4]].forEach(([x, z, h], i) => {
    const pv = new THREE.Group(); pv.position.set(x, 0, z);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, h, 10), bambooMat()); s.position.y = h / 2; s.castShadow = true; pv.add(s);
    for (let k = 0; k < 5; k++) { const f = leafFan(6); f.position.set(0, h * (0.5 + k * 0.11), 0); f.rotation.y = k * 1.3 + i; f.scale.setScalar(0.8 + k * 0.08); pv.add(f); }
    g.add(pv); stalks.push(pv);
  });
  g.userData.tick = (t) => stalks.forEach((s, i) => { s.rotation.z = Math.sin(t * 0.9 + i) * 0.025; s.rotation.x = Math.sin(t * 0.7 + i * 2) * 0.015; });
  return g;
}
const IRIS_FLOWERS = [[-0.26, 0.36], [-0.06, 0.44], [0.16, 0.38], [0.3, 0.3], [-0.38, 0.26]];
const irisA = () => cutoutAsset(K('iris'), (p) => {
  // a dense clump of blades: a low mound with pointed tips
  const pts: number[][] = [[-0.45, 0]];
  for (let i = 0; i <= 12; i++) { const x = -0.42 + i * 0.07, h = 0.14 * Math.sin(Math.PI * (i / 12)) ** 0.5 + 0.05; pts.push([x, h], [x + 0.03 + (i - 6) * 0.004, h + 0.09 + 0.05 * Math.sin(i * 2.3) ** 2]); }
  pts.push([0.45, 0.04], [0.45, 0]); poly(p, pts);
}, (c) => {
  c.fillStyle = '#4f8a40'; c.fillRect(-0.5, 0, 1, 0.4);
  c.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const x = rand(-0.42, 0.42); c.strokeStyle = pick(['#6aa84f', '#3f7a3a', '#86bc5e']); c.lineWidth = 0.018; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + rand(-0.02, 0.02), 0.12, x + rand(-0.05, 0.05), rand(0.16, 0.28)); c.stroke(); }
  c.fillStyle = '#3f7a3a'; c.fillRect(-0.5, 0, 1, 0.03);
}, { ppu: 500, t: 0.02 });
const irisFlowerA = () => cutoutAsset(K('irisF'), (p) => { p.moveTo(-0.008, -0.2); p.lineTo(0.008, -0.2); p.lineTo(0.008, -0.02); p.bezierCurveTo(0.06, -0.05, 0.08, 0.0, 0.045, 0.02); p.bezierCurveTo(0.04, 0.07, -0.04, 0.07, -0.045, 0.02); p.bezierCurveTo(-0.08, 0.0, -0.06, -0.05, -0.008, -0.02); p.closePath(); }, (c) => {
  c.fillStyle = '#4f8a40'; c.fillRect(-0.02, -0.21, 0.04, 0.2);
  c.fillStyle = '#5a46b8'; c.beginPath(); c.ellipse(0, 0.0, 0.07, 0.05, 0, 0, 7); c.fill();
  c.fillStyle = '#8a74e0'; c.beginPath(); c.ellipse(0, 0.04, 0.03, 0.03, 0, 0, 7); c.fill();
  c.fillStyle = '#f6f0e6'; c.fillRect(-0.05, -0.012, 0.035, 0.008); c.fillRect(0.015, -0.012, 0.035, 0.008); dab(c, 0, -0.005, 0.01, '#f2d24a');
}, { ppu: 1000, t: 0.012, ink: 0.008 });
function buildIrises() {
  const g = group(cutout(irisA()));
  IRIS_FLOWERS.forEach(([x, y], i) => { const f = cutout(irisFlowerA()); f.position.set(x, y, 0.015 + (i % 2) * 0.01); f.scale.setScalar(0.9 + (i % 3) * 0.12); g.add(f); });
  return g;
}

// ── the shishi-odoshi: a bamboo spout fills a tipping tube that knocks on a stone and empties into a stone basin
const SHISHI_T = 6, KNOCK = 5.55;
function shishiAngle(t: number) {
  const p = ((t % SHISHI_T) + SHISHI_T) % SHISHI_T;
  if (p < 4.6) return lerp(0.35, 0.12, p / 4.6);
  if (p < 4.9) return lerp(0.12, -0.5, ease.in((p - 4.6) / 0.3));
  if (p < 5.3) return -0.5;
  if (p < KNOCK) return lerp(-0.5, 0.35, ease.in((p - 5.3) / 0.25));
  return 0.35 + Math.sin((p - KNOCK) * 30) * 0.04 * Math.max(0, 1 - (p - KNOCK) * 4);
}
function buildShishi() {
  const bam = bambooMat(), st = rockMats()[1], g = group();
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.16, 12), st); basin.position.set(0.32, 0.08, 0.02);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), waterMat()); water.rotation.x = -Math.PI / 2; water.position.set(0.32, 0.162, 0.02);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 10), bam); post.position.set(0.62, 0.31, -0.08);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), bam); spout.rotation.z = Math.PI / 2 - 0.15; spout.position.set(0.42, 0.56, -0.08);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), toon({ color: '#bfeaf2', transparent: true, opacity: 0.8 })); stream.position.set(0.22, 0.45, -0.08);
  [-0.05, 0.05].forEach((dz) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.26, 8), bam); s.position.set(0, 0.13, -0.08 + dz * 1.4); g.add(s); });
  const pivot = new THREE.Group(); pivot.position.set(0, 0.24, -0.08);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 12), bam); tube.rotation.z = Math.PI / 2; tube.position.x = -0.0; pivot.add(tube);
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.038, 12), plainM(K('mouth'), '#3a5030')); mouth.rotation.y = Math.PI / 2; mouth.position.x = 0.251; pivot.add(mouth);
  const knockStone = rock(0.07, 0.6); knockStone.position.set(-0.25, 0.075, -0.08);
  g.add(basin, water, post, spout, stream, pivot, knockStone);
  // the tube pivots in its middle; positive angle lifts the mouth (+x) and drops the butt onto the stone
  g.userData.tick = (t) => { pivot.rotation.z = shishiAngle(t); };
  return g;
}

// ── the wisteria arbour, its blossoms, the bench and the tea
function buildPergola() {
  const wood = plainM(K('perg'), '#8a6a48'), g = group();
  [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, PH, 0.06), wood); p.position.set(x, PH / 2, z); p.castShadow = true; g.add(p); });
  [-0.4, 0.4].forEach((z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.06, 0.07), wood); b.position.set(0, PH - 0.03, z); g.add(b); });
  for (let x = -0.8; x <= 0.81; x += 0.2) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 1.0), wood); s.position.set(x, PH + 0.015, 0); g.add(s); }
  return g;
}
const wisteriaCanopy = () => cutoutAsset(K('canopy'), (p) => { const pts: number[][] = []; for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2, r = 1 + 0.07 * Math.sin(a * 9) + 0.04 * Math.sin(a * 17); pts.push([Math.cos(a) * 0.98 * r, Math.sin(a) * 0.56 * r]); } poly(p, pts); }, (c) => {
  c.fillStyle = '#4a7a3a'; c.fillRect(-1.1, -0.7, 2.2, 1.4);
  foliage(c, -1.0, -0.6, 2.0, 1.2, { shade: '#4a7a3a', mid: '#6a9a4a', light: '#8cbc62', hi: '#c8e09a' }, { n: 60, r: [0.1, 0.17] });
  for (let i = 0; i < 120; i++) dab(c, rand(-0.9, 0.9), rand(-0.5, 0.5), rand(0.02, 0.04), pick(['#a88ae0', '#c8b0f0', '#8a6ac8']));
}, { ppu: 260, t: 0.02, ink: 0 });
const RACEME = (() => { const p: THREE.Vector2[] = []; for (let i = 0; i <= 10; i++) { const k = i / 10; p.push(new THREE.Vector2(0.001 + 0.06 * Math.sqrt(k) * (1 - 0.15 * Math.sin(k * 20)), -0.34 + 0.34 * k)); } return p; })();
const racemeMat = () => latheMat(K('raceme'), 64, 128, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9a78e0'); g.addColorStop(0.6, '#c4aef4'); g.addColorStop(1, '#ece2fc'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) dab(c, rand(0, w), rand(0, h), rand(2, 4), pick(['#8a62d0', '#e0d0fa', '#b49ae8']));
});
function buildWisteria() {
  const can = cutout(wisteriaCanopy()); can.rotation.x = -Math.PI / 2; can.position.y = 0.06;
  const g = group(can), geo = new THREE.LatheGeometry(RACEME, 10), hang: THREE.Mesh[] = [];
  for (let i = 0; i < 34; i++) {
    const a = rand(0, 6.28), r = Math.sqrt(rnd()), x = Math.cos(a) * r * 0.88, z = Math.sin(a) * r * 0.48;
    const m = new THREE.Mesh(geo, racemeMat()); m.position.set(x, 0.03, z); m.scale.set(1, rand(1.0, 1.6), 1); g.add(m); hang.push(m);
  }
  g.userData.tick = (t) => hang.forEach((m, i) => { m.rotation.z = Math.sin(t * 1.1 + i) * 0.06; m.rotation.x = Math.sin(t * 0.8 + i * 2) * 0.05; });
  return g;
}
const feltTop = () => boardMat(K('felt'), 1.2, 0.44, (c, W, H) => { c.fillStyle = '#c4362f'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 200; i++) c.fillRect(rand(0, W), rand(0, H), 0.01, 0.01); c.fillStyle = '#a82a24'; c.fillRect(0, H - 0.03, W, 0.03); }, { ppu: 200 });
function redBench(w: number) {
  const legM = plainM(K('leg'), '#5a4030'), felt = plainM(K('feltSide'), '#b8302a');
  const seat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.4), [felt, felt, feltTop(), legM, felt, felt]); seat.position.y = SEAT - 0.02;
  const drape = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.01), felt); drape.position.set(0, SEAT - 0.07, 0.2);
  const g = group(seat, drape);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, SEAT - 0.04, 0.05), legM); l.position.set(sx * (w / 2 - 0.06), (SEAT - 0.04) / 2, sz * 0.15); g.add(l); });
  g.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
  return g;
}
function buildTea() {
  const lac = plainM(K('lacquer'), '#3a1e18'), cup = plainM(K('cup'), '#e8dcc4'), tea = plainM(K('tea'), '#7aa83a');
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.22), lac); tray.position.y = 0.01;
  const g = group(tray);
  [-0.08, 0.04].forEach((x) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.055, 12), cup); c.position.set(x, 0.048, -0.03); const s = new THREE.Mesh(new THREE.CircleGeometry(0.03, 12), tea); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.0765, -0.03); g.add(c, s); });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.012, 14), cup); plate.position.set(0.1, 0.026, 0.04); g.add(plate);
  const skewer = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.18, 4), plainM(K('skewer'), '#d8c08a')); skewer.rotation.z = Math.PI / 2; skewer.position.set(0.1, 0.05, 0.04); g.add(skewer);
  ['#f2a8c0', '#f6f2ea', '#8cc46a'].forEach((col, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), plainM(K('dango' + i), col)); d.position.set(0.05 + i * 0.045, 0.05, 0.04); g.add(d); });
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), plainM(K('pot'), '#4a3a30')); pot.scale.y = 0.8; pot.position.set(-0.24, 0.05, 0.0);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.07, 6), plainM(K('pot'), '#4a3a30')); spout.position.set(-0.17, 0.07, 0); spout.rotation.z = -0.9;
  g.add(pot, spout);
  return g;
}
function buildParasol() {
  const g = redBench(0.7);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.12, 6), plainM(K('ppole'), '#c8b070')); pole.position.set(0.3, 0.56, -0.12);
  const canopyM = latheMat(K('parasolTex'), 256, 64, (c, w, h) => { c.fillStyle = '#d4402f'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(80,20,10,.25)'; for (let x = 0; x < w; x += w / 16) c.fillRect(x, 0, 2, h); c.fillStyle = '#f2d24a'; c.fillRect(0, h * 0.18, w, 3); }, { side: THREE.DoubleSide });
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.2, 24, 1, true), canopyM); canopy.position.set(0.3, 1.1, -0.12); canopy.castShadow = true;
  g.add(pole, canopy);
  return g;
}

// ── people and animals
const hostessA = () => cutoutAsset(K('hostess'), figure(1.0, 0.17), (c) => {
  c.fillStyle = '#7a3a5a'; c.fillRect(-0.25, 0, 0.5, 0.82);
  for (let i = 0; i < 10; i++) { const x = rand(-0.14, 0.14), y = rand(0.06, 0.4); c.fillStyle = '#c8b0f0'; c.beginPath(); c.ellipse(x, y, 0.025, 0.04, 0, 0, 7); c.fill(); dab(c, x, y + 0.03, 0.012, '#f6f0e6'); }
  c.fillStyle = '#e8d8a8'; c.fillRect(-0.17, 0.5, 0.34, 0.11); c.fillStyle = '#c4362f'; c.fillRect(-0.17, 0.545, 0.34, 0.02);
  c.fillStyle = '#f4ecd8'; c.beginPath(); poly(c, [[-0.06, 0.82], [0, 0.66], [0.06, 0.82]]); c.fill();
  c.fillStyle = '#3a1e18'; c.fillRect(-0.16, 0.38, 0.32, 0.03); dab(c, -0.08, 0.43, 0.03, '#e8dcc4'); dab(c, 0.06, 0.43, 0.03, '#e8dcc4'); // her tray
  c.fillStyle = '#f5d9bf'; c.fillRect(-0.12, 0.0, 0.24, 0.035); c.beginPath(); c.ellipse(0, 0.89, 0.095, 0.1, 0, 0, 7); c.fill();
  c.fillStyle = '#2a2420'; c.beginPath(); c.ellipse(0, 0.95, 0.105, 0.07, 0, Math.PI, 0, true); c.fill(); dab(c, 0, 1.02, 0.05, '#2a2420');
  dab(c, 0.06, 1.0, 0.015, '#e8a8c8');
  face(c, 0.88, 0.09);
}, { ppu: 700 });
const guestA = () => cutoutAsset(K('guest'), seatedOutline, (c) => {
  c.fillStyle = '#5a6a7a'; c.fillRect(-0.25, 0, 0.5, 0.32); c.strokeStyle = '#4a5866'; c.lineWidth = 0.01; [-0.08, 0, 0.08].forEach((x) => { c.beginPath(); c.moveTo(x, 0.02); c.lineTo(x * 1.2, 0.3); c.stroke(); });
  c.fillStyle = '#3a3a46'; c.fillRect(-0.25, 0.28, 0.5, 0.26); c.fillStyle = '#f4ecd8'; c.beginPath(); poly(c, [[-0.05, 0.54], [0, 0.44], [0.05, 0.54]]); c.fill();
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0.0, 0.36, 0.06, 0.035, 0, 0, 7); c.fill(); c.fillStyle = '#e8dcc4'; c.fillRect(-0.03, 0.36, 0.06, 0.05); c.fillStyle = '#7aa83a'; c.fillRect(-0.025, 0.405, 0.05, 0.01); // cup in both hands
  c.fillStyle = '#d8c8a8'; c.fillRect(-0.12, 0, 0.1, 0.03); c.fillRect(0.02, 0, 0.1, 0.03);
  c.fillStyle = '#f2d1b2'; c.beginPath(); c.ellipse(0, 0.61, 0.085, 0.09, 0, 0, 7); c.fill();
  c.fillStyle = '#dcd6cc'; dab(c, -0.08, 0.63, 0.03, '#dcd6cc'); dab(c, 0.08, 0.63, 0.03, '#dcd6cc'); c.beginPath(); c.ellipse(0, 0.55, 0.05, 0.03, 0, 0, Math.PI); c.fill();
  face(c, 0.62, 0.08);
}, { ppu: 800 });
const girlA = () => cutoutAsset(K('girl'), (p) => {
  p.moveTo(-0.16, 0); p.lineTo(0.12, 0); p.lineTo(0.14, 0.12); p.lineTo(0.24, 0.2); p.lineTo(0.26, 0.17); p.lineTo(0.29, 0.21); p.lineTo(0.25, 0.25); p.lineTo(0.12, 0.27);
  p.bezierCurveTo(0.12, 0.33, 0.1, 0.4, 0.0, 0.42); p.bezierCurveTo(-0.11, 0.42, -0.13, 0.33, -0.11, 0.28); p.bezierCurveTo(-0.17, 0.24, -0.18, 0.12, -0.16, 0); p.closePath();
}, (c) => {
  c.fillStyle = '#f2c94c'; c.fillRect(-0.2, 0, 0.32, 0.28); c.fillStyle = '#e8a83a'; c.fillRect(-0.2, 0.0, 0.32, 0.05);
  c.fillStyle = '#f5d9bf'; c.fillRect(0.12, 0.18, 0.14, 0.04); dab(c, 0.27, 0.205, 0.025, '#f5d9bf');
  c.fillStyle = '#c99a5e'; c.fillRect(0.25, 0.2, 0.04, 0.04); // a pinch of koi food
  c.fillStyle = '#f5d9bf'; c.beginPath(); c.ellipse(0, 0.34, 0.075, 0.075, 0, 0, 7); c.fill();
  c.fillStyle = '#3a2a20'; c.beginPath(); c.ellipse(-0.01, 0.38, 0.085, 0.05, 0, Math.PI, 0, true); c.fill(); dab(c, -0.08, 0.36, 0.03, '#3a2a20'); dab(c, 0.07, 0.36, 0.025, '#3a2a20');
  dab(c, 0.03, 0.34, 0.008, '#2a201a'); dab(c, 0.055, 0.34, 0.008, '#2a201a'); soft(c, 0.05, 0.31, 0.02, '#f08a7a', 0.7);
}, { ppu: 900 });
const koiTex = (pat: number) => memo(K('koiTex' + pat), () => {
  const cv = newCanvas(64, 32), c = cv.getContext('2d')!;
  const body = pat === 2 ? '#f2a03a' : '#fbf6ec';
  c.fillStyle = body; c.beginPath(); c.ellipse(36, 16, 20, 7, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(18, 16); c.lineTo(4, 7); c.lineTo(8, 16); c.lineTo(4, 25); c.closePath(); c.fill();
  if (pat === 0) { c.fillStyle = '#e8452f'; c.beginPath(); c.ellipse(40, 14, 9, 5, 0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(26, 17, 5, 4, 0, 0, 7); c.fill(); }
  if (pat === 1) { c.fillStyle = '#e8452f'; c.beginPath(); c.ellipse(34, 16, 12, 5, 0, 0, 7); c.fill(); c.fillStyle = '#2a2420'; dab(c, 28, 14, 3, '#2a2420'); dab(c, 40, 18, 2.5, '#2a2420'); }
  if (pat === 2) { c.fillStyle = '#fff2c8'; c.fillRect(38, 10, 3, 12); }
  c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(30, 11, 14, 2);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
});
function buildKoi() {
  const g = group(), fish: { m: THREE.Mesh; l: Lobe; r: number; sp: number; ph: number }[] = [];
  const geo = new THREE.PlaneGeometry(0.2, 0.1); geo.rotateX(-Math.PI / 2);
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(geo, memo(K('koiM' + (i % 3)), () => toon({ map: koiTex(i % 3), transparent: true, alphaTest: 0.4, opacity: 0.9, depthWrite: false })));
    m.position.y = 0.028; g.add(m);
    fish.push({ m, l: LOBES[i % 2], r: rand(0.35, 0.7), sp: rand(0.18, 0.32) * (i % 3 ? 1 : -1), ph: rand(0, 6.28) });
  }
  const place = (t: number) => fish.forEach(({ m, l, r, sp, ph }) => {
    const a = t * sp + ph + Math.sin(t * 0.4 + ph) * 0.3;
    m.position.x = l.cx + Math.cos(a) * l.a * r; m.position.z = l.cz + Math.sin(a) * l.b * r;
    const dx = -Math.sin(a) * l.a * sp, dz = Math.cos(a) * l.b * sp;
    m.rotation.y = Math.atan2(-dz, dx) + Math.sin(t * 6 + ph) * 0.12;
  });
  place(0); g.userData.tick = (t) => place(t);
  return g;
}
const heronA = () => cutoutAsset(K('heron'), (p) => poly(p, [[-0.04, 0], [-0.02, 0], [-0.012, 0.28], [0.015, 0.28], [0.025, 0], [0.045, 0], [0.04, 0.3], [0.12, 0.36], [0.14, 0.45], [0.1, 0.53], [0.13, 0.61], [0.08, 0.7], [0.1, 0.735], [0.25, 0.715], [0.1, 0.77], [0.05, 0.78], [0.03, 0.72], [0.065, 0.62], [0.02, 0.54], [-0.05, 0.5], [-0.22, 0.38], [-0.08, 0.3]]), (c) => {
  c.fillStyle = '#9aa3ad'; c.fillRect(-0.3, 0.25, 0.5, 0.3); c.fillStyle = '#7d8590'; c.beginPath(); c.ellipse(-0.06, 0.4, 0.13, 0.06, -0.3, 0, 7); c.fill();
  c.fillStyle = '#f2f2ee'; c.fillRect(0.0, 0.5, 0.2, 0.3); c.fillStyle = '#2a2a33'; c.fillRect(0.04, 0.745, 0.08, 0.02); c.beginPath(); poly(c, [[0.05, 0.75], [-0.04, 0.73], [0.04, 0.73]]); c.fill();
  c.fillStyle = '#e8b83a'; c.beginPath(); poly(c, [[0.1, 0.735], [0.25, 0.715], [0.1, 0.755]]); c.fill(); dab(c, 0.085, 0.745, 0.008, '#2a2420');
  c.fillStyle = '#c9a85a'; c.fillRect(-0.05, 0, 0.1, 0.29);
}, { ppu: 800, t: 0.02 });
function buildHeron() { const m = cutout(heronA()), g = group(m); g.userData.tick = (t) => { const ph = Math.floor(t / 4) % 4; m.scale.x = ph === 3 ? -1 : 1; m.rotation.z = Math.max(0, Math.sin(t * 0.6)) ** 8 * 0.15; }; return g; }
const catA = () => cutoutAsset(K('cat'), (p) => { p.moveTo(-0.2, 0); p.lineTo(0.2, 0); p.bezierCurveTo(0.24, 0.08, 0.2, 0.16, 0.12, 0.17); p.lineTo(0.13, 0.24); p.lineTo(0.08, 0.2); p.lineTo(0.02, 0.2); p.lineTo(-0.01, 0.25); p.lineTo(-0.02, 0.17); p.bezierCurveTo(-0.12, 0.17, -0.24, 0.12, -0.2, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#e8a050'; c.fillRect(-0.3, 0, 0.6, 0.3); c.strokeStyle = '#c47a32'; c.lineWidth = 0.014; [-0.14, -0.07, 0.0].forEach((x) => { c.beginPath(); c.moveTo(x, 0.16); c.lineTo(x + 0.02, 0.04); c.stroke(); });
  c.fillStyle = '#fbf2e2'; c.beginPath(); c.ellipse(0.08, 0.06, 0.08, 0.05, 0, 0, 7); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#2a2420'; c.lineWidth = 0.008; [0.03, 0.09].forEach((x) => { c.beginPath(); c.arc(x, 0.14, 0.012, 0.3, Math.PI - 0.3); c.stroke(); });
}, { ppu: 1000, t: 0.02 });
function buildCat() { const m = cutout(catA()), g = group(m); g.userData.tick = (t) => { m.scale.y = 1 + Math.sin(t * 1.6) * 0.025; }; return g; }
const wingA = () => cutoutAsset(K('wing'), (p) => { p.moveTo(0, 0); p.bezierCurveTo(0.03, 0.06, 0.09, 0.07, 0.09, 0.03); p.bezierCurveTo(0.09, 0.0, 0.06, -0.02, 0.07, -0.05); p.bezierCurveTo(0.05, -0.08, 0.02, -0.05, 0, 0); p.closePath(); }, (c) => {
  c.fillStyle = '#fbf2c8'; c.fillRect(0, -0.1, 0.1, 0.2); c.fillStyle = '#2a2420'; c.fillRect(0.07, 0.0, 0.03, 0.08); dab(c, 0.05, 0.03, 0.012, '#f2a03a');
}, { ppu: 1400, t: 0.006, ink: 0.006 });
function buildButterflies() {
  const g = group();
  const flies = [[1.3, 1.0, 0.4, 0], [-0.4, 0.75, 1.0, 2]].map(([x, y, z, ph]) => {
    const b = new THREE.Group(); b.position.set(x, y, z);
    const wings = [1, -1].map((s) => { const w = new THREE.Group(); const m = cutout(wingA()); m.rotation.x = -Math.PI / 2; w.add(m); w.scale.x = s; b.add(w); return w; });
    g.add(b); return { b, wings, home: new V3(x, y, z), ph };
  });
  g.userData.tick = (t) => flies.forEach(({ b, wings, home, ph }) => {
    const a = t * 0.5 + ph;
    b.position.set(home.x + Math.sin(a) * 0.5, home.y + Math.sin(a * 2.3) * 0.12, home.z + Math.sin(a * 1.3) * 0.3);
    b.rotation.y = Math.atan2(-Math.cos(a * 1.3) * 0.39, Math.cos(a) * 0.5);
    wings.forEach((w, i) => { w.rotation.x = 0; w.rotation.z = (i ? -1 : 1) * (0.2 + Math.abs(Math.sin(t * 14 + ph)) * 1.0); });
  });
  return g;
}
// ── the secret: a little turtle sunning itself behind the waterfall
const turtleA = () => cutoutAsset(K('turtle'), (p) => { p.moveTo(-0.14, 0); p.lineTo(0.13, 0); p.lineTo(0.14, 0.03); p.bezierCurveTo(0.2, 0.03, 0.22, 0.08, 0.18, 0.1); p.bezierCurveTo(0.15, 0.11, 0.12, 0.08, 0.11, 0.06); p.bezierCurveTo(0.08, 0.13, -0.08, 0.14, -0.12, 0.05); p.lineTo(-0.17, 0.03); p.closePath(); }, (c) => {
  c.fillStyle = '#6f9a4a'; c.fillRect(-0.2, 0, 0.45, 0.2); c.fillStyle = '#4f7a3a'; c.beginPath(); c.ellipse(-0.01, 0.06, 0.1, 0.06, 0, Math.PI, 0, true); c.fill();
  c.strokeStyle = '#3a5a2a'; c.lineWidth = 0.008; [-0.05, 0.03].forEach((x) => { c.beginPath(); c.moveTo(x, 0.04); c.lineTo(x + 0.01, 0.11); c.stroke(); });
  c.fillStyle = '#a8c47a'; c.beginPath(); c.ellipse(0.17, 0.08, 0.035, 0.025, 0, 0, 7); c.fill(); dab(c, 0.18, 0.09, 0.008, '#2a2420');
}, { ppu: 1100, t: 0.02 });
function buildTurtle() { const m = cutout(turtleA()), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.max(0, Math.sin(t * 0.7)) * 0.08; }; return g; }

// ── ground: moss and grass, the pond bed with a pebble margin, raked gravel before the teahouse
function paintGround(c: Ctx, W: number, D: number) {
  meadow(c, -W / 2, -D / 2, W, D, { base: '#7fae5a', light: '#9cc86e', shade: '#5f9248', tufts: [] });
  // raked gravel court in front of the teahouse
  c.fillStyle = '#e6dfcc'; c.beginPath(); rrect(c, 0.35, -0.45, 3.0, 0.5, 0.15); c.fill();
  c.strokeStyle = 'rgba(150,140,115,.55)'; c.lineWidth = 0.012; for (let y = -0.4; y < 0.48; y += 0.05) { c.beginPath(); c.moveTo(0.4, y); for (let x = 0.4; x < 2.95; x += 0.1) c.lineTo(x, y + Math.sin(x * 4 + y * 8) * 0.008); c.stroke(); }
  // pond margin, then the bed
  LOBES.forEach((l) => { c.fillStyle = '#c9c0a8'; c.beginPath(); lobePath(c, l, 0.13); c.fill(); });
  for (let i = 0; i < 900; i++) { const x = rand(-3, 0.5), z = rand(-1.8, 1.6), f = pondF(x, z); if (f < 0 && f > -0.45) dab(c, x, -z, rand(0.01, 0.025), pick(['#a39e92', '#b8b2a2', '#8f8a80', '#d4ccb8'])); }
  LOBES.forEach((l) => { c.fillStyle = '#3f6a62'; c.beginPath(); lobePath(c, l); c.fill(); });
  // moss patches and tufts, little white and pink flowers
  for (let i = 0; i < 40; i++) { const x = rand(-3, 3), y = rand(-2.4, 2.4); if (pondF(x, -y) > -0.5) continue; blob(c, x, y, rand(0.1, 0.25), pick(['#6a9e4a', '#8cbc5e']), 0.7, 0.4); }
  tufts(c, -W / 2, -D / 2, W, D, ['#5f9a45', '#76b052', '#98c86a'], 1300, (x, y) => pondF(x, -y) > -0.5 || (x > 0.3 && x < 3.05 && y > -0.5 && y < 0.5));
  for (let i = 0; i < 40; i++) { const x = rand(-3, 3), y = rand(-2.4, 2.4); if (pondF(x, -y) > -0.5 || (x > 0.3 && y > -0.5 && y < 0.5)) continue; for (let k = 0; k < 3; k++) dab(c, x + rand(-0.03, 0.03), y + rand(-0.03, 0.03), 0.013, pick(['#ffffff', '#f7c0d4', '#f2d24a']), 0.9); }
}

export const CHAYA: SceneDef = {
  id: 'chaya',
  title: 'Herbaciarnia w ogrodzie',
  jp: '茶屋の庭',
  season: 'późna wiosna',
  blurb: 'Staw z karpiami, czerwony mostek i herbata pod glicynią.',
  box: ['#5f8f5a', '#b49ae8'],
  seed: 7070,
  base: { w: 6.4, d: 5.0, paint: paintGround },
  sky: {
    day: { grad: [[0, '#3f8cd8'], [0.45, '#86c0ec'], [0.8, '#d4eaf2'], [1, '#f2f6e8']], cloud: '#fbfaf3', hi: '#ffffff', edge: '#fbfaf3', shadow: '#bcc4e0' },
    evening: { grad: [[0, '#1a1f4e'], [0.4, '#4f3f88'], [0.72, '#c0709a'], [1, '#ffc49a']], cloud: '#e8a0b0', hi: '#ffd6c0', edge: '#e8a0b0', shadow: '#6f5a9a', stars: true },
  },
  light: {
    day: { sky: '#e6f2ff', ground: '#94a070', hemi: 1.15, sun: '#fff3dc', sunI: 2.6, sunPos: [4, 8, 5], bloom: 0.03 },
    evening: { sky: '#8a80c0', ground: '#3f3a4a', hemi: 0.8, sun: '#ff9a70', sunI: 0.7, sunPos: [-6, 2.6, 3.5], bloom: 0.75 },
  },
  steps: [
    { name: 'Tło', jp: '背景', pieces: ['hills', 'fence', 'pine'] },
    { name: 'Staw', jp: '池', pieces: ['pond', 'rocks', 'falls', 'lilies'] },
    { name: 'Herbaciarnia', jp: '茶屋', pieces: ['floor', 'walls', 'roof', 'sign'] },
    { name: 'Ścieżki', jp: '小道', pieces: ['bridge', 'stones', 'lantern', 'yukimi'] },
    { name: 'Ogród', jp: '庭', pieces: ['maple', 'azaleas', 'bamboo', 'shishi', 'irises'] },
    { name: 'Glicynia', jp: '藤棚', pieces: ['pergola', 'wisteria', 'bench', 'tea'] },
    { name: 'Goście', jp: 'お客さん', pieces: ['hostess', 'guest', 'girl', 'parasol'] },
    { name: 'Życie', jp: '生き物', pieces: ['koi', 'heron', 'cat', 'butterflies'] },
  ],
  pieces: {
    hills: { name: 'Wzgórza', pos: [0, 0, -2.45], build: () => group(cutout(hillsA())), sound: 'birds' },
    fence: { name: 'Płotek', pos: [-0.9, 0, -2.1], build: () => group(cutout(fenceA())) },
    pine: { name: 'Sosna', pos: [-2.75, 0, -1.95], build: buildPine },
    pond: { name: 'Staw', pos: [0, 0, 0], build: buildPond },
    rocks: { name: 'Kamienie', pos: [0, 0, 0], build: buildRocks },
    falls: { name: 'Wodospad', pos: [FALLS[0], 0, FALLS[1]], build: buildFalls, sound: 'stream' },
    lilies: { name: 'Lilie', pos: [0, 0, 0], build: buildLilies, sound: 'frogs' },
    floor: { name: 'Podłoga', pos: [HX, 0, HZ + 0.075], build: buildFloor },
    walls: { name: 'Ściany', pos: [HX, FLOOR, HZ], build: buildWalls },
    roof: { name: 'Dach', pos: [HX, FLOOR + HH + (HD / 2) * Math.tan(0.55), HZ], build: buildRoof, sound: 'chime' },
    sign: { name: 'Proporzec', pos: [0.55, 0, -0.3], build: buildSign },
    bridge: { name: 'Mostek', pos: [BRIDGE.x, 0, BRIDGE.z], rotY: BRIDGE.rot, build: buildBridge },
    stones: { name: 'Ścieżka', pos: [0, 0, 0], build: buildStones },
    lantern: { name: 'Latarnia', pos: [0.3, 0, -0.85], build: buildKasuga },
    yukimi: { name: 'Latarenka', pos: [YUKIMI[0], 0, YUKIMI[1]], build: buildYukimi },
    maple: { name: 'Klon', pos: [-2.8, 0, -0.3], build: buildMaple },
    azaleas: { name: 'Azalie', pos: [-0.75, 0, -1.72], build: buildAzaleas },
    bamboo: { name: 'Bambus', pos: [2.85, 0, -0.1], build: buildBamboo, sound: 'leaves' },
    shishi: { name: 'Shishi-odoshi', pos: [0.05, 0, -1.48], build: buildShishi },
    irises: { name: 'Irysy', pos: [-1.15, 0, 1.45], build: buildIrises },
    pergola: { name: 'Pergola', pos: [PX, 0, PZ], build: buildPergola },
    wisteria: { name: 'Glicynia', pos: [PX, PH + 0.02, PZ], build: buildWisteria },
    bench: { name: 'Ławka', pos: [PX, 0, PZ - 0.05], build: () => redBench(1.2) },
    tea: { name: 'Herbata', pos: [PX + 0.38, SEAT, PZ - 0.08], build: buildTea },
    hostess: { name: 'Gospodyni', pos: [1.05, 0, 1.68], rotY: 0.15, build: () => group(cutout(hostessA())) },
    guest: { name: 'Gość', pos: [PX - 0.3, SEAT - 0.24, PZ + 0.2], build: () => group(cutout(guestA())) },
    girl: { name: 'Dziewczynka', pos: [0.4, 0, 1.12], rotY: -0.3, build: () => { const m = cutout(girlA()); m.scale.x = -1; return group(m); } },
    parasol: { name: 'Parasol', pos: [-2.55, 0, 1.75], rotY: 0.25, build: buildParasol },
    koi: { name: 'Karpie', pos: [0, 0, 0], build: buildKoi },
    heron: { name: 'Czapla', pos: [-0.85, 0.02, -1.15], build: buildHeron },
    cat: { name: 'Kot', pos: [1.25, FLOOR, -0.45], rotY: -0.2, build: buildCat },
    butterflies: { name: 'Motyle', pos: [0, 0, 0], build: buildButterflies },
  },
  secret: { name: 'żółwik', build: buildTurtle, pos: [-2.45, 0.02, -1.98], rotY: 0.3 },
  setup(ctx) {
    const { fx, scene } = ctx;
    const lights = {
      lantern: new THREE.PointLight('#ffc070', 0, 3, 1.5), yukimi: new THREE.PointLight('#ffc070', 0, 3, 1.5), walls: new THREE.PointLight('#ffcf8a', 0, 4, 1.5),
    };
    lights.lantern.position.set(0.3, 0.7, -0.62); lights.yukimi.position.set(YUKIMI[0], 0.48, YUKIMI[1] + 0.2); lights.walls.position.set(HX, 0.75, HZ + 0.1);
    Object.values(lights).forEach((l) => scene.add(l));
    const inPond = () => { for (;;) { const x = rand(-2.7, 0.2), z = rand(-1.5, 1.3); if (pondF(x, z) > 0.15) return [x, z]; } };
    const flies = fx.emitter(0, () => { const [x, z] = inPond(); fx.firefly(new V3(x, rand(0.25, 0.6), z)); });
    const petals = fx.emitter(0, () => fx.petal(new V3(PX + rand(-0.8, 0.8), PH - 0.1, PZ + rand(-0.4, 0.4)), '#d6c0ff'));
    const ripples = fx.emitter(0, () => { const [x, z] = inPond(); fx.ripple(new V3(x, 0.035, z)); });
    const feed = fx.emitter(0, () => fx.ripple(new V3(0.0 + rand(-0.15, 0.1), 0.035, 1.02 + rand(-0.1, 0.08))));
    let lastP = 0;
    return {
      update(_dt, t, c) {
        const e = c.evening, on = (id: string) => (c.placed.has(id) ? e : 0);
        fireboxMat().emissiveIntensity = Math.max(on('lantern'), on('yukimi')) * 1.6;
        lights.lantern.intensity = on('lantern') * 2.2; lights.yukimi.intensity = on('yukimi') * 2.2;
        sideIn().emissiveIntensity = outside().emissiveIntensity = backIn().emissiveIntensity = on('walls') * 0.55;
        lights.walls.intensity = on('walls') * 2.5;
        flies.rate = c.done && c.placed.has('pond') ? e * 1.4 : 0;
        petals.rate = c.placed.has('wisteria') ? (c.done ? 0.9 : 0.25) : 0;
        ripples.rate = c.placed.has('pond') ? 0.5 : 0;
        feed.rate = c.placed.has('girl') && c.placed.has('pond') ? 0.8 : 0;
        // the shishi-odoshi knocks once per cycle
        const p = ((t % SHISHI_T) + SHISHI_T) % SHISHI_T;
        if (lastP < KNOCK && p >= KNOCK && c.placed.has('shishi') && !c.quiet && audio()) sfx.bamboo();
        lastP = p;
      },
    };
  },
};
