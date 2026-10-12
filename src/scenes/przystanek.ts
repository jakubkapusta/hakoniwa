// Scene 2: a country bus stop in the rainy season (tsuyu). Paddies behind, a farmhouse, cedar hills in mist.
// Finale: the rain eases, a bus drives out of the base's edge and stops, fireflies rise over the paddies.
import * as THREE from 'three';
import { blob, dab, grass, JPG, mottle, poly, rrect, soft, text, wood, type Ctx, type Pen } from '../core/paint';
import { clamp, ease, lerp, mix, pick, rand, rgba, rnd } from '../core/util';
import { board, boardMat, cutout, cutoutAsset, foldBox, glowing, group, latheMat, memo, plainM, wallNet } from '../kit/kit';
import type { SceneDef } from './types';

const V3 = THREE.Vector3;
const K = (s: string) => 'bus:' + s;
// shelter
const SX = -0.6, SZ = 0.1, SW = 1.8, SD = 0.9, SH = 1.25;
// road (world z range) and puddles on it
const ROAD0 = 0.85, ROAD1 = 1.95;
const PUDDLES: [number, number, number, number][] = [[-1.9, 1.15, 0.32, 0.12], [-0.3, 1.62, 0.42, 0.14], [1.5, 1.25, 0.28, 0.1], [2.5, 1.7, 0.36, 0.13], [0.6, 1.08, 0.2, 0.07]];
const inPuddle = (x: number, z: number) => PUDDLES.some(([px, pz, rx, rz]) => ((x - px) / rx) ** 2 + ((z - pz) / rz) ** 2 < 1);

// ── backdrop: cedar hills in the mist
const ridge = (x: number) => 1.55 + 0.35 * Math.sin(x * 0.9 + 0.4) + 0.18 * Math.sin(x * 2.3 + 1.3);
function forestOutline(p: Pen) {
  p.moveTo(-3.1, 0); p.lineTo(-3.1, ridge(-3.1));
  for (let x = -3.1; x < 3.1; x += 0.13) {
    const h = ridge(x + 0.065) + 0.12 + 0.05 * Math.sin(x * 17);
    p.lineTo(x + 0.04, ridge(x) + 0.02); p.lineTo(x + 0.065, h); p.lineTo(x + 0.09, ridge(x + 0.13) + 0.02);
  }
  p.lineTo(3.1, ridge(3.1)); p.lineTo(3.1, 0); p.closePath();
}
function cedar(c: Ctx, x: number, y: number, h: number, col: string) {
  c.fillStyle = col; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x - h * 0.22, y); c.lineTo(x + h * 0.22, y); c.closePath(); c.fill();
  c.fillStyle = rgba('#e9f3ea', 0.12); c.beginPath(); c.moveTo(x, y + h); c.lineTo(x - h * 0.22, y); c.lineTo(x - h * 0.05, y); c.closePath(); c.fill();
}
const forestA = () => cutoutAsset(K('forest'), forestOutline, (c) => {
  const g = c.createLinearGradient(0, 2.4, 0, 0); g.addColorStop(0, '#5f7f6a'); g.addColorStop(1, '#3f6450'); c.fillStyle = g; c.fillRect(-3.2, 0, 6.4, 2.6);
  for (let x = -3.1; x < 3.1; x += 0.13) cedar(c, x + 0.065, ridge(x + 0.065) - 0.35, 0.5 + 0.05 * Math.sin(x * 17), '#4f7260');
  ([[1.15, '#557a63', 0.36], [0.75, '#46705a', 0.32], [0.38, '#3b644f', 0.3]] as [number, string, number][]).forEach(([b, col, h], k) => {
    for (let x = -3.2; x < 3.2; x += rand(0.09, 0.14)) cedar(c, x, b + 0.1 * Math.sin(x * (1.3 + k) + k) - h * 0.4, h * rand(0.85, 1.15), mix(col, '#20372b', rand(0, 0.25)));
    // mist band
    for (let i = 0; i < 26; i++) blob(c, rand(-3.2, 3.2), b - 0.05 + rand(-0.05, 0.05), rand(0.12, 0.3), '#e7eeec', 0.18, 0.4);
  });
  const h = c.createLinearGradient(0, 2.4, 0, 0.5); h.addColorStop(0, 'rgba(220,230,232,.4)'); h.addColorStop(1, 'rgba(220,230,232,0)'); c.fillStyle = h; c.fillRect(-3.2, 0, 6.4, 2.6);
}, { ppu: 170, ink: 0.012 });

// ── backdrop: thatched farmhouse (minka)
function minkaOutline(p: Pen) {
  p.moveTo(-0.62, 0); p.lineTo(0.62, 0); p.lineTo(0.62, 0.5); p.lineTo(0.84, 0.46);
  p.quadraticCurveTo(0.7, 0.8, 0.42, 1.12); p.lineTo(0.46, 1.2); p.lineTo(-0.46, 1.2); p.lineTo(-0.42, 1.12);
  p.quadraticCurveTo(-0.7, 0.8, -0.84, 0.46); p.lineTo(-0.62, 0.5); p.closePath();
}
const minkaA = () => cutoutAsset(K('minka'), minkaOutline, (c) => {
  c.fillStyle = '#5b4434'; c.fillRect(-0.7, 0, 1.4, 0.55);
  c.fillStyle = '#efe4cc'; [[-0.48, 0.12, 0.3, 0.3], [0.12, 0.12, 0.36, 0.3]].forEach(([x, y, w, h]) => {
    c.fillRect(x, y, w, h); c.strokeStyle = '#4a3528'; c.lineWidth = 0.012;
    for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + (w * k) / 4, y); c.lineTo(x + (w * k) / 4, y + h); c.stroke(); }
    c.beginPath(); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke();
  });
  c.fillStyle = '#2e241d'; c.fillRect(-0.1, 0, 0.16, 0.36);
  // thatch: golden straw strokes, darker where it's wet
  c.fillStyle = '#a58652'; c.beginPath(); poly(c, [[0.84, 0.46], [0.42, 1.14], [-0.42, 1.14], [-0.84, 0.46]]); c.fill();
  for (let i = 0; i < 900; i++) {
    const y = rand(0.46, 1.14), half = lerp(0.84, 0.42, (y - 0.46) / 0.68), x = rand(-half, half);
    c.strokeStyle = pick(['#c7a86a', '#8d7045', '#b29361', '#6f5a3b']); c.lineWidth = rand(0.004, 0.009);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + rand(-0.01, 0.01), y - rand(0.03, 0.07)); c.stroke();
  }
  c.fillStyle = 'rgba(40,30,20,.35)'; c.fillRect(-0.9, 0.46, 1.8, 0.05);
  c.fillStyle = '#3f3a33'; c.fillRect(-0.46, 1.12, 0.92, 0.09);
  mottle(c, -0.8, 0.5, 1.6, 0.6, ['#6f8a4a', '#58703b'], 14, [0.03, 0.07], 0.35);
}, {
  ppu: 420, emissive: (c) => {
    [[-0.48, 0.12, 0.3, 0.3], [0.12, 0.12, 0.36, 0.3]].forEach(([x, y, w, h]) => { soft(c, x + w / 2, y + h / 2, 0.3, '#ffb35c', 0.5); c.fillStyle = '#ffcf80'; c.fillRect(x, y, w, h); });
  },
});

// ── telephone pole with a street lamp
function poleOutline(p: Pen) {
  poly(p, [[-0.045, 0], [0.045, 0], [0.04, 2.25], [0.3, 2.25], [0.3, 2.3], [0.04, 2.3], [0.035, 2.6], [-0.035, 2.6], [-0.04, 2.3], [-0.3, 2.3], [-0.3, 2.25], [-0.04, 2.25]]);
}
const poleA = () => cutoutAsset(K('pole'), poleOutline, (c) => {
  c.save(); c.translate(-0.05, 0); wood(c, 0.1, 2.7, '#7b6a58', { dir: 'v', plank: 0.1 }); c.restore();
  c.fillStyle = '#5f5246'; c.fillRect(-0.32, 2.24, 0.64, 0.07);
  [-0.22, 0.22].forEach((x) => { dab(c, x, 2.33, 0.025, '#e8e2d6'); });
  c.fillStyle = '#f0d24a'; c.fillRect(-0.05, 0.25, 0.1, 0.05); c.fillStyle = '#2a2a2a'; c.fillRect(-0.05, 0.3, 0.1, 0.05);
  c.fillStyle = '#f2efe6'; c.fillRect(-0.04, 1.0, 0.08, 0.22); text(c, '川辺', 0, 1.11, 0.055, '#2a2420', { vertical: true });
}, { ppu: 380 });
const lampGlow = () => memo(K('lampGlow'), () => glowing(plain2('#f3efe0')));
const plain2 = (col: string) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 });
function buildPole() {
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.42), plainM(K('arm'), '#5f5246')); arm.position.set(0, 2.05, 0.21);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.08, 18, 1, true), plainM(K('shade'), '#3e4a4f', { side: THREE.DoubleSide })); shade.position.set(0, 2.0, 0.42);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), lampGlow()); bulb.position.set(0, 1.96, 0.42);
  return group(cutout(poleA()), arm, shade, bulb);
}

// ── shelter
const shelterBack = () => boardMat(K('shBack'), SW, SH, (c, W, H) => {
  wood(c, W, H, '#b08a5f', { dir: 'h', plank: 0.14 });
  // posters: timetable, a ramune ad, a lost cat
  c.fillStyle = '#f5efe0'; c.fillRect(0.2, 0.22, 0.42, 0.5); c.strokeStyle = '#6b5440'; c.lineWidth = 0.01; c.strokeRect(0.2, 0.22, 0.42, 0.5);
  text(c, '時刻表', 0.41, 0.29, 0.06, '#2a2420', { font: JPG });
  c.fillStyle = '#5a4c40'; for (let r = 0; r < 7; r++) { c.fillRect(0.25, 0.36 + r * 0.05, 0.08, 0.012); c.fillRect(0.38, 0.36 + r * 0.05, 0.2, 0.012); }
  c.fillStyle = '#9fd4e6'; c.fillRect(0.8, 0.2, 0.36, 0.48); soft(c, 0.98, 0.42, 0.2, '#ffffff', 0.5);
  c.fillStyle = '#5aa6c0'; c.beginPath(); c.ellipse(0.98, 0.46, 0.05, 0.12, 0, 0, 7); c.fill(); dab(c, 0.98, 0.33, 0.02, '#e8f6fb');
  text(c, 'ラムネ', 0.98, 0.26, 0.06, '#c4553f', { font: JPG }); text(c, '冷えてます', 0.98, 0.63, 0.04, '#24485a', { font: JPG });
  c.fillStyle = '#fbf6ea'; c.fillRect(1.32, 0.28, 0.3, 0.36); dab(c, 1.47, 0.44, 0.07, '#e8954a'); dab(c, 1.44, 0.47, 0.03, '#3b332e');
  [[1.42, 0.39], [1.52, 0.39]].forEach(([x, y]) => poly(c, [[x - 0.03, y], [x, y - 0.06], [x + 0.03, y]]));
  c.fillStyle = '#e8954a'; c.beginPath(); poly(c, [[1.41, 0.4], [1.43, 0.34], [1.46, 0.4]]); poly(c, [[1.48, 0.4], [1.51, 0.34], [1.53, 0.4]]); c.fill();
  text(c, 'ねこ探してます', 1.47, 0.58, 0.032, '#3a302a', { font: JPG });
  c.fillStyle = 'rgba(40,25,10,.25)'; c.fillRect(0, H - 0.08, W, 0.08);
  soft(c, 0.4, H - 0.1, 0.4, '#5a6b4a', 0.25);
});
const shelterSide = () => boardMat(K('shSide'), SD, SH, (c, W, H) => {
  wood(c, W, H, '#a8835a', { dir: 'h', plank: 0.14 });
  c.fillStyle = '#e9e1cd'; c.fillRect(0.2, 0.3, 0.45, 0.32); c.strokeStyle = '#6b5440'; c.lineWidth = 0.02; c.strokeRect(0.2, 0.3, 0.45, 0.32);
  c.fillStyle = 'rgba(160,190,200,.6)'; c.fillRect(0.22, 0.32, 0.41, 0.28);
  c.fillStyle = 'rgba(40,25,10,.25)'; c.fillRect(0, H - 0.08, W, 0.08);
});
const shelterOut = () => boardMat(K('shOut'), SW, SH, (c, W, H) => { wood(c, W, H, '#7f6347', { dir: 'h', plank: 0.14 }); mottle(c, 0, H * 0.6, W, H * 0.4, ['#5f7347', '#6f8455'], 30, [0.03, 0.08], 0.35); });
const buildShelter = () => wallNet({ w: SW, d: SD, h: SH, back: shelterBack(), side: shelterSide(), outside: shelterOut() });
const tinMat = () => boardMat(K('tin'), 2.15, 1.3, (c, W, H) => {
  c.fillStyle = '#9b4b38'; c.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 0.06) {
    const g = c.createLinearGradient(x, 0, x + 0.06, 0); g.addColorStop(0, 'rgba(0,0,0,.18)'); g.addColorStop(0.5, 'rgba(255,220,190,.18)'); g.addColorStop(1, 'rgba(0,0,0,.18)');
    c.fillStyle = g; c.fillRect(x, 0, 0.06, H);
  }
  mottle(c, 0, 0, W, H, ['#6e3a2a', '#b8693f', '#7d5a3a'], 60, [0.04, 0.14], 0.3);
  for (let i = 0; i < 18; i++) { c.strokeStyle = rgba('#5a2c1e', 0.3); c.lineWidth = 0.01; const x = rand(0, W); c.beginPath(); c.moveTo(x, rand(0.4, 1)); c.lineTo(x + rand(-0.02, 0.02), H); c.stroke(); }
}, { ppu: 300 });
function buildShelterRoof() {
  const b = board(2.15, 1.3, 0.03, tinMat(), plainM(K('tinUnder'), '#6b5a4a'));
  b.rotation.x = -0.17;
  return group(b);
}
const benchTop = () => boardMat(K('benchTop'), 1.4, 0.32, (c, W, H) => wood(c, W, H, '#c79f6e', { dir: 'h', plank: 0.08 }), { ppu: 400 });
const benchSide = () => boardMat(K('benchSide'), 1.4, 0.38, (c, W, H) => {
  wood(c, W, H, '#8e6a48', { dir: 'h', plank: 0.12, frame: 0.02 });
  c.fillStyle = '#3d2b1d'; c.beginPath(); c.moveTo(0.1, H); c.lineTo(0.1, H - 0.1); c.quadraticCurveTo(W / 2, H - 0.22, W - 0.1, H - 0.1); c.lineTo(W - 0.1, H); c.closePath(); c.fill();
}, { ppu: 400 });
const benchEnd = () => boardMat(K('benchEnd'), 0.32, 0.38, (c, W, H) => { wood(c, W, H, '#8e6a48', { dir: 'v', plank: 0.08, frame: 0.02 }); c.fillStyle = '#3d2b1d'; c.fillRect(0.06, H - 0.12, W - 0.12, 0.12); }, { ppu: 400 });
const buildBench = () => foldBox({ w: 1.4, d: 0.32, h: 0.38, t: 0.025, top: benchTop(), front: benchSide(), back: benchSide(), left: benchEnd(), right: benchEnd() });

// ── bus stop sign
function signOutline(p: Pen) {
  p.moveTo(-0.03, 0); p.lineTo(0.03, 0); p.lineTo(0.03, 1.2); p.lineTo(0.17, 1.2); p.lineTo(0.17, 1.42); p.lineTo(0.03, 1.42); p.lineTo(0.03, 1.48);
  p.bezierCurveTo(0.17, 1.48, 0.25, 1.58, 0.25, 1.7); p.bezierCurveTo(0.25, 1.83, 0.14, 1.93, 0, 1.93); p.bezierCurveTo(-0.14, 1.93, -0.25, 1.83, -0.25, 1.7);
  p.bezierCurveTo(-0.25, 1.58, -0.17, 1.48, -0.03, 1.48); p.lineTo(-0.03, 1.42); p.lineTo(-0.17, 1.42); p.lineTo(-0.17, 1.2); p.lineTo(-0.03, 1.2); p.closePath();
}
const stopA = () => cutoutAsset(K('stop'), signOutline, (c) => {
  c.fillStyle = '#8f9599'; c.fillRect(-0.05, 0, 0.1, 1.5); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-0.02, 0, 0.012, 1.5);
  c.fillStyle = '#a54a3a'; c.fillRect(-0.05, 0, 0.1, 0.06);
  c.fillStyle = '#f5f1e6'; c.fillRect(-0.18, 1.19, 0.36, 0.24); c.fillStyle = '#2a2420';
  for (let r = 0; r < 4; r++) { c.fillRect(-0.14, 1.23 + r * 0.045, 0.06, 0.012); c.fillRect(-0.04, 1.23 + r * 0.045, 0.16, 0.012); }
  dab(c, 0, 1.705, 0.23, '#2f6db0'); dab(c, 0, 1.705, 0.19, '#f5f1e6');
  text(c, 'バス停', 0, 1.75, 0.075, '#2f6db0', { font: JPG }); text(c, '川辺', 0, 1.65, 0.07, '#2a2420');
}, { ppu: 420 });

// ── vending machine (glows in the evening)
const VW = 0.7, VD = 0.5, VH = 1.45;
const vendFront = () => boardMat(K('vend'), VW, VH, (c, W, H) => {
  c.fillStyle = '#e9edf0'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#d4e8f3'; c.fillRect(0.05, 0.06, W - 0.1, 0.78);
  const cans = ['#c4553f', '#2f6db0', '#f0b84a', '#5e9a5a', '#8a5a3a', '#e7e3d8', '#d96f9c', '#2e3f6b'];
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 6; k++) {
      const x = 0.085 + k * 0.1, y = 0.1 + r * 0.25, col = pick(cans);
      c.fillStyle = col; c.beginPath(); rrect(c, x, y, x + 0.065, y + 0.15, 0.015); c.fill();
      c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 0.01, y + 0.02, 0.012, 0.11);
      c.fillStyle = '#ffffff'; c.fillRect(x + 0.005, y + 0.06, 0.055, 0.03);
      c.fillStyle = r === 2 ? '#c4553f' : '#2f6db0'; c.fillRect(x - 0.01, y + 0.17, 0.085, 0.03);
      dab(c, x + 0.032, y + 0.215, 0.01, '#ffeb85');
    }
  }
  text(c, 'つめた〜い', W / 2, 0.88, 0.05, '#2f6db0', { font: JPG });
  c.fillStyle = '#2c3338'; c.fillRect(0.05, 1.0, 0.2, 0.08); c.fillRect(0.4, 0.98, 0.18, 0.14);
  c.fillStyle = '#1d2226'; c.fillRect(0.1, 1.22, W - 0.2, 0.14);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, H - 0.05, W, 0.05);
}, {
  ppu: 600, emissive: (c, W) => {
    const g = c.createLinearGradient(0, 0.06, 0, 0.84); g.addColorStop(0, '#dfeffa'); g.addColorStop(1, '#a9cde6');
    c.fillStyle = g; c.fillRect(0.05, 0.06, W - 0.1, 0.78);
    c.fillStyle = '#ffeb85'; for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) dab(c, 0.117 + k * 0.1, 0.315 + r * 0.25, 0.012, '#ffeb85');
  },
});
const vendSide = () => boardMat(K('vendSide'), VD, VH, (c, W, H) => { c.fillStyle = '#d9dee2'; c.fillRect(0, 0, W, H); c.fillStyle = '#2f6db0'; c.fillRect(0, 0, W, 0.05); mottle(c, 0, H * 0.7, W, H * 0.3, ['#c3c9cd', '#b9a98f'], 10, [0.03, 0.06], 0.3); });
const vendTop = () => boardMat(K('vendTop'), VW, VD, (c, W, H) => { c.fillStyle = '#c9cfd3'; c.fillRect(0, 0, W, H); });
const buildVend = () => foldBox({ w: VW, d: VD, h: VH, top: vendTop(), front: vendFront(), back: vendSide(), left: vendSide(), right: vendSide() });

// ── red post box
const postMat = () => latheMat(K('post'), 256, 128, (c, w, h) => {
  c.fillStyle = '#c8392b'; c.fillRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, w, 0); [0, 0.25, 0.5, 0.75, 1].forEach((o, i) => g.addColorStop(o, i % 2 ? 'rgba(255,200,180,.18)' : 'rgba(60,0,0,.18)')); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#2a1d1a'; c.fillRect(w * 0.43, 22, w * 0.14, 6);
  c.fillStyle = '#f6efe2'; c.fillRect(w * 0.44, 48, w * 0.12, 30); text(c, '〒', w * 0.5, 63, 22, '#c8392b', { font: JPG });
});
function buildPost() {
  const pts = [[0, 0], [0.13, 0], [0.13, 0.62], [0.125, 0.66], [0.1, 0.7], [0.06, 0.72], [0, 0.73]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), postMat()); body.position.y = 0.06; body.rotation.y = Math.PI;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.06, 24), plainM(K('foot'), '#3a3532')); foot.position.y = 0.03;
  return group(body, foot);
}

// ── hydrangeas
const bushR = (s: number) => (a: number) => 0.38 + 0.05 * Math.sin(a * 6 + s) + 0.03 * Math.sin(a * 11 + s * 2);
const hydraA = (key: string, hue: string[], seed: number) => cutoutAsset(K(key), (p) => {
  const r = bushR(seed); p.moveTo(0.3, 0);
  for (let i = 0; i <= 60; i++) { const a = -0.25 + ((Math.PI + 0.5) * i) / 60; p.lineTo(Math.cos(a) * r(a) * 1.25, 0.3 + Math.sin(a) * r(a)); }
  p.lineTo(-0.3, 0); p.closePath();
}, (c) => {
  c.fillStyle = '#3f6a3e'; c.fillRect(-0.6, 0, 1.2, 0.8);
  for (let i = 0; i < 40; i++) { const x = rand(-0.45, 0.45), y = rand(0, 0.45); c.fillStyle = pick(['#4f7f45', '#3a6236', '#5f9150']); c.beginPath(); c.ellipse(x, y, 0.07, 0.035, rand(-1, 1), 0, 7); c.fill(); }
  [[-0.22, 0.42], [0.05, 0.52], [0.28, 0.4], [-0.05, 0.3], [0.2, 0.22], [-0.3, 0.22]].forEach(([x, y]) => {
    const r = rand(0.11, 0.15);
    blob(c, x, y, r, hue[2], 1, 0.15);
    for (let k = 0; k < 40; k++) { const a = rand(0, 6.28), d = Math.sqrt(rnd()) * r; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      const l = clamp(0.5 + (py - y) / r * 0.4 - (px - x) / r * 0.2, 0, 1); dab(c, px, py, rand(0.014, 0.022), mix(hue[0], hue[1], l)); dab(c, px, py, 0.005, '#fdf8ff', 0.6); }
  });
}, { ppu: 520 });
const buildHydraA = () => group(cutout(hydraA('hydraA', ['#5560b8', '#bcc8f2', '#6a76c8'], 1)));
const buildHydraB = () => { const o = group(cutout(hydraA('hydraB', ['#9a5ab0', '#efc6ef', '#b06fbe'], 4))); o.scale.setScalar(0.8); return o; };

// ── people and animals
function kidOutline(p: Pen) {
  p.moveTo(-0.11, 0); p.lineTo(0.11, 0); p.lineTo(0.12, 0.12); p.quadraticCurveTo(0.19, 0.3, 0.15, 0.48); p.quadraticCurveTo(0.13, 0.56, 0.08, 0.58);
  p.quadraticCurveTo(0.12, 0.7, 0.06, 0.75); p.lineTo(0.07, 0.79);
  p.quadraticCurveTo(0.15, 0.75, 0.22, 0.8); p.quadraticCurveTo(0.31, 0.74, 0.4, 0.79);
  p.bezierCurveTo(0.42, 0.98, 0.22, 1.07, 0.03, 1.07); p.bezierCurveTo(-0.16, 1.07, -0.36, 0.98, -0.36, 0.79);
  p.quadraticCurveTo(-0.29, 0.74, -0.22, 0.8); p.quadraticCurveTo(-0.15, 0.75, -0.08, 0.79);
  p.lineTo(-0.07, 0.75); p.quadraticCurveTo(-0.12, 0.68, -0.08, 0.58); p.quadraticCurveTo(-0.15, 0.56, -0.15, 0.48); p.quadraticCurveTo(-0.19, 0.3, -0.12, 0.12); p.closePath();
}
const kidA = () => cutoutAsset(K('kid'), kidOutline, (c) => {
  c.fillStyle = '#d9483b'; c.fillRect(-0.4, 0, 0.8, 0.14);
  c.fillStyle = '#f2c230'; c.fillRect(-0.25, 0.12, 0.5, 0.65);
  soft(c, 0.1, 0.35, 0.2, '#c8961a', 0.5);
  [0.24, 0.34, 0.44].forEach((y) => dab(c, 0.0, y, 0.012, '#8a6a1a'));
  c.fillStyle = '#f5d9bf'; c.beginPath(); c.ellipse(0, 0.665, 0.055, 0.06, 0, 0, 7); c.fill();
  c.fillStyle = '#4a3a30'; c.beginPath(); c.ellipse(0, 0.715, 0.055, 0.025, 0, 0, 7); c.fill();
  dab(c, -0.02, 0.66, 0.007, '#2a201a'); dab(c, 0.022, 0.66, 0.007, '#2a201a'); soft(c, -0.035, 0.645, 0.018, '#f08a7a', 0.6); soft(c, 0.035, 0.645, 0.018, '#f08a7a', 0.6);
  c.fillStyle = '#5a4535'; c.fillRect(0.055, 0.6, 0.012, 0.2);
  // umbrella
  c.fillStyle = '#d9483b'; c.beginPath(); c.moveTo(-0.37, 0.76); c.bezierCurveTo(-0.36, 0.98, -0.16, 1.08, 0.03, 1.08); c.bezierCurveTo(0.22, 1.08, 0.42, 0.98, 0.41, 0.76); c.closePath(); c.fill();
  soft(c, -0.08, 0.98, 0.22, '#f27a6a', 0.6);
  c.strokeStyle = '#9b2a20'; c.lineWidth = 0.008; [-0.36, -0.22, -0.08, 0.07, 0.22, 0.4].forEach((x) => { c.beginPath(); c.moveTo(0.03, 1.07); c.quadraticCurveTo((x + 0.03) / 2, 0.95, x, 0.79); c.stroke(); });
  dab(c, 0.03, 1.075, 0.015, '#5a4535');
}, { ppu: 700 });
function buildKid() { const m = cutout(kidA()), g = group(m); g.userData.tick = (t) => { m.rotation.z = Math.sin(t * 1.2) * 0.03; m.position.y = Math.abs(Math.sin(t * 2.4)) * 0.008; }; return g; }
function frogOutline(p: Pen) {
  p.moveTo(-0.16, 0); p.lineTo(0.16, 0); p.quadraticCurveTo(0.18, 0.06, 0.1, 0.07);
  p.bezierCurveTo(0.14, 0.12, 0.12, 0.17, 0.08, 0.17); p.quadraticCurveTo(0.08, 0.215, 0.05, 0.215); p.quadraticCurveTo(0.025, 0.215, 0.02, 0.18);
  p.lineTo(-0.02, 0.18); p.quadraticCurveTo(-0.025, 0.215, -0.05, 0.215); p.quadraticCurveTo(-0.08, 0.215, -0.08, 0.17);
  p.bezierCurveTo(-0.12, 0.17, -0.14, 0.12, -0.1, 0.07); p.quadraticCurveTo(-0.18, 0.06, -0.16, 0); p.closePath();
}
const frogA = () => cutoutAsset(K('frog'), frogOutline, (c) => {
  c.fillStyle = '#8e8a80'; c.fillRect(-0.2, 0, 0.4, 0.07); soft(c, -0.05, 0.05, 0.1, '#b9b4a8', 0.6);
  c.fillStyle = '#6fae4a'; c.fillRect(-0.15, 0.06, 0.3, 0.17); soft(c, -0.03, 0.14, 0.08, '#9fd06a', 0.8);
  dab(c, 0, 0.1, 0.045, '#e6eec0');
  [-0.05, 0.05].forEach((x) => { dab(c, x, 0.19, 0.022, '#fbfaf2'); dab(c, x, 0.19, 0.011, '#1f1f1a'); });
  c.strokeStyle = '#3d5f2a'; c.lineWidth = 0.006; c.beginPath(); c.arc(0, 0.155, 0.035, 0.4, Math.PI - 0.4); c.stroke();
}, { ppu: 1000, t: 0.02 });
function buildFrog() {
  const m = cutout(frogA()), g = group(m);
  g.userData.tick = (t) => { const ph = (t % 4.3) / 4.3; m.position.y = ph > 0.9 ? Math.sin(((ph - 0.9) / 0.1) * Math.PI) * 0.08 : 0; m.scale.y = 1 + Math.sin(t * 9) * 0.015; };
  return g;
}
function crowOutline(p: Pen) {
  p.moveTo(-0.05, 0); p.lineTo(0.02, 0); p.lineTo(0.02, 0.05);
  p.bezierCurveTo(0.1, 0.06, 0.15, 0.14, 0.14, 0.2); p.lineTo(0.22, 0.19); p.lineTo(0.15, 0.24);
  p.bezierCurveTo(0.13, 0.29, 0.06, 0.29, 0.04, 0.24); p.bezierCurveTo(-0.04, 0.22, -0.12, 0.16, -0.22, 0.07); p.lineTo(-0.2, 0.05); p.bezierCurveTo(-0.12, 0.08, -0.07, 0.06, -0.05, 0.05); p.closePath();
}
const crowA = () => cutoutAsset(K('crow'), crowOutline, (c) => {
  c.fillStyle = '#26282d'; c.fillRect(-0.25, 0, 0.5, 0.3); soft(c, 0.05, 0.2, 0.1, '#4a5060', 0.7);
  c.strokeStyle = 'rgba(120,130,150,.45)'; c.lineWidth = 0.006; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-0.02 - i * 0.04, 0.17 - i * 0.02); c.lineTo(-0.1 - i * 0.04, 0.1 - i * 0.015); c.stroke(); }
  dab(c, 0.12, 0.235, 0.012, '#f0eee6'); dab(c, 0.123, 0.235, 0.006, '#111111');
  c.fillStyle = '#3a3a3a'; c.fillRect(-0.04, 0, 0.012, 0.05); c.fillRect(0.0, 0, 0.012, 0.05);
}, { ppu: 900, t: 0.02 });
function buildCrow() {
  const m = cutout(crowA()), g = group(m);
  g.userData.tick = (t) => { const ph = Math.floor(t / 3.7) % 3; m.scale.x = ph === 1 ? -1 : 1; m.rotation.z = Math.max(0, Math.sin(t * 5)) * 0.06; };
  return g;
}

// ── the secret: a kappa peeking out of a paddy
function kappaOutline(p: Pen) {
  p.moveTo(-0.13, 0); p.lineTo(0.13, 0); p.bezierCurveTo(0.16, 0.08, 0.15, 0.17, 0.11, 0.21); p.lineTo(0.14, 0.24); p.lineTo(0.08, 0.235);
  p.bezierCurveTo(0.05, 0.27, -0.05, 0.27, -0.08, 0.235); p.lineTo(-0.14, 0.24); p.lineTo(-0.11, 0.21); p.bezierCurveTo(-0.15, 0.17, -0.16, 0.08, -0.13, 0); p.closePath();
}
const kappaA = () => cutoutAsset(K('kappa'), kappaOutline, (c) => {
  c.fillStyle = '#6fa889'; c.fillRect(-0.2, 0, 0.4, 0.3); soft(c, -0.03, 0.13, 0.1, '#9fd0b2', 0.8);
  c.fillStyle = '#e9eedf'; c.beginPath(); c.ellipse(0, 0.235, 0.08, 0.02, 0, 0, 7); c.fill();
  c.fillStyle = '#2f4a3a'; for (let a = 0; a < 6.2; a += 0.6) { c.beginPath(); c.ellipse(Math.cos(a) * 0.08, 0.23 + Math.sin(a) * 0.012, 0.018, 0.008, a, 0, 7); c.fill(); }
  [-0.045, 0.045].forEach((x) => { dab(c, x, 0.15, 0.02, '#fbfaf2'); dab(c, x, 0.15, 0.01, '#1f1f1a'); });
  c.fillStyle = '#e9b94a'; c.beginPath(); c.ellipse(0, 0.1, 0.04, 0.022, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(160,200,210,.85)'; c.fillRect(-0.2, 0, 0.4, 0.035);
}, { ppu: 1000, t: 0.02 });
function buildKappa() { const m = cutout(kappaA()), g = group(m); g.scale.setScalar(1.5); g.userData.tick = (t) => { m.position.y = -0.04 + Math.sin(t * 1.6) * 0.02; m.rotation.z = Math.sin(t * 0.9) * 0.06; }; return g; }

// ── the bus (not a piece: it arrives in the finale)
const busSide = (key: string, door: boolean) => boardMat(K(key), 2.2, 0.95, (c, W, H) => {
  c.fillStyle = '#f1e7cf'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#3f8f86'; c.fillRect(0, H * 0.58, W, H * 0.42); c.fillStyle = '#c4553f'; c.fillRect(0, H * 0.54, W, 0.035);
  for (let i = 0; i < 6; i++) {
    const x = 0.14 + i * 0.32; if (door && i === 1) continue;
    c.fillStyle = '#334a56'; c.beginPath(); rrect(c, x, 0.1, x + 0.26, 0.42, 0.03); c.fill();
    c.fillStyle = 'rgba(200,225,235,.35)'; c.beginPath(); poly(c, [[x + 0.02, 0.12], [x + 0.12, 0.12], [x + 0.04, 0.4], [x + 0.02, 0.4]]); c.fill();
    if (!door && (i === 2 || i === 4)) { c.fillStyle = '#1f2a30'; c.beginPath(); c.ellipse(x + 0.13, 0.36, 0.05, 0.06, 0, 0, 7); c.fill(); c.fillRect(x + 0.07, 0.38, 0.12, 0.05); }
  }
  if (door) { c.fillStyle = '#2a3a44'; c.fillRect(0.47, 0.1, 0.24, 0.76); c.strokeStyle = '#d5cbb4'; c.lineWidth = 0.01; c.strokeRect(0.47, 0.1, 0.24, 0.76); c.beginPath(); c.moveTo(0.59, 0.1); c.lineTo(0.59, 0.86); c.stroke(); }
  text(c, '川辺線', W - 0.3, H * 0.75, 0.08, '#f1e7cf');
}, {
  ppu: 300, emissive: (c) => {
    for (let i = 0; i < 6; i++) { if (door && i === 1) continue; const x = 0.14 + i * 0.32; c.fillStyle = '#ffcf8a'; c.fillRect(x, 0.1, 0.26, 0.32); }
  },
});
const busFront = () => boardMat(K('busFront'), 0.85, 0.95, (c, W, H) => {
  c.fillStyle = '#f1e7cf'; c.fillRect(0, 0, W, H); c.fillStyle = '#3f8f86'; c.fillRect(0, H * 0.58, W, H * 0.42);
  c.fillStyle = '#334a56'; c.fillRect(0.06, 0.14, W - 0.12, 0.34); c.fillStyle = '#1d2226'; c.fillRect(0.12, 0.03, W - 0.24, 0.09);
  text(c, '川辺', W / 2, 0.075, 0.06, '#ffcf6a');
  dab(c, 0.14, H - 0.17, 0.06, '#fff6d8'); dab(c, W - 0.14, H - 0.17, 0.06, '#fff6d8');
  c.fillStyle = '#c9c3b5'; c.fillRect(0.05, H - 0.06, W - 0.1, 0.05);
}, {
  ppu: 300, emissive: (c, W, H) => { dab(c, 0.14, H - 0.17, 0.07, '#fff3c8'); dab(c, W - 0.14, H - 0.17, 0.07, '#fff3c8'); c.fillStyle = '#ffcf6a'; c.fillRect(0.12, 0.03, W - 0.24, 0.09); },
});
function buildBus() {
  const side = busSide('busSideA', false), sideDoor = busSide('busSideB', true), plainSide = plainM(K('busPlain'), '#e9dfc6'), roof = plainM(K('busRoof'), '#e4dac2');
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 0.85), [busFront(), plainSide, roof, plainSide, side, sideDoor]);
  body.position.y = 0.6;
  const g = group(body);
  const wheelM = plainM(K('busWheel'), '#262626');
  [[-0.7, 0.42], [0.7, 0.42], [-0.7, -0.42], [0.7, -0.42]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 18), wheelM); w.rotation.x = Math.PI / 2; w.position.set(x, 0.17, z); g.add(w); });
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}

// ── ground: paddies at the back, gravel around the shelter, the road with puddles
function paintGround(c: Ctx, W: number, D: number) {
  const greens = ['#7fa85a', '#6d9a4c', '#8db466', '#5f8c45'];
  c.fillStyle = '#7aa556'; c.fillRect(-W / 2, -D / 2, W, D);
  for (let i = 0; i < 60; i++) blob(c, rand(-W / 2, W / 2), rand(-D / 2, D / 2), rand(0.25, 0.7), pick(greens), 0.35, 0.3);
  // paddies: flooded fields split by earth ridges (shape y = -world z, so the back is y > 0.75)
  const fields: [number, number, number, number][] = [[-3.1, 0.82, -1.0, 2.4], [-0.9, 0.82, 1.1, 2.4], [1.2, 0.82, 3.1, 1.55]];
  for (const [x0, y0, x1, y1] of fields) {
    c.fillStyle = '#8e7a58'; c.beginPath(); rrect(c, x0 - 0.04, y0 - 0.04, x1 + 0.04, y1 + 0.04, 0.08); c.fill();
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#a9bcc0'); g.addColorStop(1, '#8aa2aa');
    c.fillStyle = g; c.beginPath(); rrect(c, x0, y0, x1, y1, 0.06); c.fill();
    mottle(c, x0, y0, x1 - x0, y1 - y0, ['#c7d6d8', '#93abb2', '#b4c6c8'], 30, [0.06, 0.18], 0.25);
    c.strokeStyle = '#5f9a45'; c.lineWidth = 0.012; c.lineCap = 'round';
    for (let y = y0 + 0.08; y < y1 - 0.04; y += 0.09) for (let x = x0 + 0.06; x < x1 - 0.04; x += 0.07) {
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - 0.012, y + 0.035); c.moveTo(x, y); c.lineTo(x + 0.014, y + 0.03); c.stroke();
    }
  }
  // gravel apron under the shelter, vending machine and post box (world z -0.5..0.85 → y -0.85..0.5)
  c.fillStyle = '#b3aa99'; c.beginPath(); rrect(c, -1.75, -0.85, 2.45, 0.5, 0.15); c.fill();
  for (let i = 0; i < 1600; i++) dab(c, rand(-1.72, 2.42), rand(-0.83, 0.48), rand(0.006, 0.016), pick(['#8f8676', '#cbc3b2', '#a39a88', '#d9d2c4']), 0.8);
  c.fillStyle = '#9d9a92'; c.fillRect(SX - SW / 2 - 0.05, -SZ - SD / 2 - 0.05, SW + 0.1, SD + 0.1);
  mottle(c, SX - SW / 2, -SZ - SD / 2, SW, SD, ['#8f8c84', '#aaa69c'], 20, [0.05, 0.12], 0.3);
  // road
  const ry0 = -ROAD1, ry1 = -ROAD0;
  c.fillStyle = '#9a8f78'; c.fillRect(-W / 2, ry0 - 0.08, W, ry1 - ry0 + 0.16);
  c.fillStyle = '#6f6c68'; c.fillRect(-W / 2, ry0, W, ry1 - ry0);
  mottle(c, -W / 2, ry0, W, ry1 - ry0, ['#77736e', '#65625e', '#827d76'], 90, [0.05, 0.16], 0.3);
  for (let i = 0; i < 14; i++) { c.strokeStyle = 'rgba(40,38,36,.5)'; c.lineWidth = 0.008; let x = rand(-3, 3), y = rand(ry0, ry1); c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rand(-0.08, 0.08); y += rand(-0.06, 0.06); c.lineTo(x, y); } c.stroke(); }
  c.fillStyle = 'rgba(240,236,224,.75)'; for (let x = -3.1; x < 3.2; x += 0.5) c.fillRect(x, (ry0 + ry1) / 2 - 0.015, 0.28, 0.03);
  for (const [px, pz, rx, rz] of PUDDLES) {
    const g = c.createRadialGradient(px, -pz, 0, px, -pz, rx);
    g.addColorStop(0, '#9fb3bf'); g.addColorStop(0.8, '#7b8e98'); g.addColorStop(1, '#5d6366');
    c.fillStyle = g; c.beginPath(); c.ellipse(px, -pz, rx, rz, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(230,240,245,.5)'; c.lineWidth = 0.01; c.beginPath(); c.ellipse(px - rx * 0.2, -pz + rz * 0.2, rx * 0.5, rz * 0.4, 0, 3.4, 4.6); c.stroke();
  }
  grass(c, -W / 2, -D / 2, W, D, greens, 6500, (x, y) => (y > 0.78 && !((y > 1.55 && x > 1.1) || (y > 2.38))) || (y > -0.88 && y < 0.53 && x > -1.78 && x < 2.48) || (y > ry0 - 0.1 && y < ry1 + 0.1));
  for (let i = 0; i < 60; i++) { const x = rand(-3, 3), y = rand(-2.4, -2.0); for (let k = 0; k < 3; k++) dab(c, x + rand(-0.03, 0.03), y + rand(-0.03, 0.03), 0.015, pick(['#ffffff', '#c9d4f2', '#f2e7a8']), 0.9); }
  // wet sheen
  c.fillStyle = 'rgba(40,60,70,.08)'; c.fillRect(-W / 2, -D / 2, W, D);
}

export const PRZYSTANEK: SceneDef = {
  id: 'przystanek',
  title: 'Przystanek w deszczu',
  jp: 'バス停',
  season: 'pora deszczowa',
  blurb: 'Wiejski przystanek między polami ryżowymi.',
  box: ['#3f6d8a', '#6fa0a8'],
  seed: 61,
  base: { w: 6.4, d: 5.0, paint: paintGround, grassTop: ['#6d9a4c', '#86b463'] },
  sky: {
    day: { grad: [[0, '#8fa4b6'], [0.55, '#b9c7d0'], [1, '#e1e6e4']], cloud: '#e9edf0', hi: '#f7f9fa', edge: '#cdd5dc', shadow: '#98a6b4', overcast: 0.1,
      clouds: [[150, 420, 1.0], [620, 300, 1.2], [1050, 480, 0.9], [380, 680, 0.8], [900, 760, 0.85], [600, 900, 0.7]] },
    evening: { grad: [[0, '#151d38'], [0.45, '#2f3d63'], [0.8, '#5d6f93'], [1, '#c99a74']], cloud: '#36425f', hi: '#4b587a', edge: '#303b57', shadow: '#262f49', stars: true,
      clouds: [[150, 420, 1.0], [620, 300, 1.2], [1050, 480, 0.9], [380, 680, 0.8], [900, 760, 0.85], [600, 900, 0.7]] },
  },
  light: {
    day: { sky: '#dfe7ee', ground: '#6f7a5c', hemi: 1.35, sun: '#eef2f4', sunI: 1.3, sunPos: [3, 9, 4], bloom: 0.1 },
    evening: { sky: '#6372a0', ground: '#3a3f3a', hemi: 0.8, sun: '#9fb2d8', sunI: 0.45, sunPos: [-4, 6, 3], bloom: 0.9 },
  },
  steps: [
    { name: 'Tło', jp: '背景', pieces: ['forest', 'minka', 'pole'] },
    { name: 'Wiata', jp: '待合所', pieces: ['shelter', 'shRoof', 'bench'] },
    { name: 'Przystanek', jp: 'バス停', pieces: ['stop', 'vend', 'post'] },
    { name: 'Hortensje', jp: '紫陽花', pieces: ['hydraA', 'hydraB'] },
    { name: 'Życie', jp: '暮らし', pieces: ['kid', 'frog', 'crow'] },
  ],
  pieces: {
    forest: { name: 'Las', pos: [0, 0, -2.42], build: () => group(cutout(forestA())), sound: 'leaves' },
    minka: { name: 'Dom', pos: [1.75, 0, -2.05], build: () => group(cutout(minkaA())), sound: 'stream' },
    pole: { name: 'Latarnia', pos: [-2.45, 0, 0.55], build: buildPole },
    shelter: { name: 'Ściany', pos: [SX, 0, SZ], build: buildShelter },
    shRoof: { name: 'Dach', pos: [SX, SH + 0.12, SZ + 0.05], build: buildShelterRoof },
    bench: { name: 'Ławka', pos: [SX, 0, SZ - 0.18], build: buildBench },
    stop: { name: 'Znak', pos: [0.72, 0, 0.72], build: () => group(cutout(stopA())) },
    vend: { name: 'Automat', pos: [1.35, 0, -0.15], build: buildVend, sound: 'hum' },
    post: { name: 'Skrzynka', pos: [2.2, 0, 0.3], build: buildPost },
    hydraA: { name: 'Hortensja', pos: [-1.95, 0, 0.05], build: buildHydraA },
    hydraB: { name: 'Hortensja', pos: [0.62, 0, -0.42], build: buildHydraB },
    kid: { name: 'Dziecko', pos: [0.2, 0, 0.6], rotY: -0.15, build: buildKid },
    frog: { name: 'Żaba', pos: [2.35, 0, -0.85], rotY: -0.3, build: buildFrog, sound: 'frogs' },
    crow: { name: 'Wrona', pos: [-2.62, 2.3, 0.55], build: buildCrow, sound: 'crow' },
  },
  secret: { name: 'kappa w polu ryżowym', build: buildKappa, pos: [-2.55, 0, -1.7], rotY: 0.2 },
  sounds: ['rain'],

  setup(ctx) {
    const { fx, scene } = ctx;
    fx.setRain({
      box: new THREE.Box3(new V3(-3.2, 0, -2.5), new V3(3.2, 4.2, 2.5)), puddles: inPuddle,
      cover: (x, z) => Math.abs(x - SX) < SW / 2 + 0.12 && z > SZ - SD / 2 - 0.1 && z < SZ + SD / 2 + 0.25,
    });
    const rain = fx.rainy!; rain.intensity = 0.65;
    const lamp = new THREE.PointLight('#ffd9a0', 0, 5, 1.4); lamp.position.set(-2.45, 1.9, 0.97);
    const vendLight = new THREE.PointLight('#cfe6ff', 0, 2.5, 1.6); vendLight.position.set(1.35, 0.8, 0.35);
    const head = new THREE.SpotLight('#fff1c8', 0, 6, 0.5, 0.6, 1.2);
    const bus = buildBus(); bus.visible = false;
    // the bus drives out of the base's left edge and away over the right one: clip it to the base
    const clip = [new THREE.Plane(new V3(1, 0, 0), 3.2), new THREE.Plane(new V3(-1, 0, 0), 3.2)];
    bus.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) (Array.isArray(mm.material) ? mm.material : [mm.material]).forEach((x) => { x.clippingPlanes = clip; }); });
    head.position.set(1.1, 0.45, 0); head.target.position.set(4, 0, 0); bus.add(head, head.target);
    scene.add(lamp, vendLight, bus);
    const fire = fx.emitter(0, () => fx.firefly(new V3(rand(-3, 3), rand(0.25, 0.9), rand(-2.2, -0.9))));
    const STOP_X = 0.95, FROM = -5.4, TO = 5.6, LANE = ROAD0 + 0.32;
    // the bus comes round every so often while the diorama is alive: arrive → wait at the stop → leave → away
    const PHASES = { arrive: 6.5, wait: 5, leave: 5, away: 24 } as const;
    type Phase = keyof typeof PHASES;
    let phase: Phase | null = null, pt = 0, rainK = 0;
    const go = (p: Phase) => { phase = p; pt = 0; bus.visible = p !== 'away'; ctx.sound('engine', p === 'away' ? 0 : p === 'wait' ? 0.35 : 1); };
    const wake = (fromFinale: boolean) => { fire.rate = 2.5; rainK = fromFinale ? 0 : 1; go(fromFinale ? 'arrive' : 'away'); if (!fromFinale) pt = PHASES.away - 2; };
    return {
      finale: () => wake(true),
      alive: () => wake(false),
      update(dt, t, c) {
        const e = c.evening;
        lampGlow().emissiveIntensity = (c.placed.has('pole') ? e : 0) * 3;
        lamp.intensity = (c.placed.has('pole') ? e : 0) * 7;
        vendFront().emissiveIntensity = e * 0.55;
        vendLight.intensity = (c.placed.has('vend') ? e : 0) * 1.6;
        minkaA().mat.emissiveIntensity = e * 2;
        busSide('busSideA', false).emissiveIntensity = busSide('busSideB', true).emissiveIntensity = e * 1.1;
        busFront().emissiveIntensity = e * 1.5; head.intensity = bus.visible ? e * 12 : 0;
        if (c.done) { rainK = Math.min(1, rainK + dt / 7); rain.intensity = lerp(0.65, 0.12, rainK); }
        if (!phase) return;
        pt += dt;
        const k = Math.min(1, pt / PHASES[phase]);
        if (phase === 'arrive') bus.position.set(lerp(FROM, STOP_X, ease.out(k)), Math.abs(Math.sin(t * 9)) * 0.01 * (1 - k), LANE);
        if (phase === 'wait') bus.position.set(STOP_X, Math.sin(t * 20) * 0.002, LANE);
        if (phase === 'leave') bus.position.set(lerp(STOP_X, TO, ease.in(k)), Math.abs(Math.sin(t * 9)) * 0.01 * k, LANE);
        if (k >= 1) go(phase === 'arrive' ? 'wait' : phase === 'wait' ? 'leave' : phase === 'leave' ? 'away' : 'arrive');
      },
    };
  },
};
