// Small particle effects: dust puffs, steam, petals, rain with ripples, fireflies.
import * as THREE from 'three';
import { newCanvas } from '../core/paint';
import { mix as mixHex, rand } from '../core/util';

const V3 = THREE.Vector3;
function spriteTex(draw: (c: CanvasRenderingContext2D, s: number) => void, size = 64) {
  const cv = newCanvas(size, size); draw(cv.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const SOFT = spriteTex((c, s) => {
  const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, s, s);
});
export const PETAL = spriteTex((c, s) => {
  c.fillStyle = '#f6b9c8'; c.beginPath(); c.ellipse(s / 2, s / 2, s * 0.42, s * 0.26, 0.5, 0, 7); c.fill();
  c.fillStyle = '#fde3ea'; c.beginPath(); c.ellipse(s * 0.42, s * 0.44, s * 0.2, s * 0.1, 0.5, 0, 7); c.fill();
}, 32);
const LEAF = spriteTex((c, s) => {
  // a little five-lobed maple leaf, white so the sprite colour tints it
  c.fillStyle = '#ffffff'; c.beginPath();
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? s * 0.18 : s * 0.46; c.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r); }
  c.fill(); c.fillRect(s / 2 - 1, s / 2, 2, s * 0.45);
}, 32);
const RING = spriteTex((c, s) => {
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = s * 0.06; c.beginPath(); c.arc(s / 2, s / 2, s * 0.4, 0, 7); c.stroke();
});

interface Particle {
  o: THREE.Object3D & { material: THREE.Material & { opacity: number } };
  life: number; age: number; v: THREE.Vector3; seed: number;
  upd: (p: Particle, dt: number, k: number) => void;
}
export interface Emitter { rate: number; acc: number; spawn: () => void }

export class Fx {
  private list: Particle[] = [];
  private emitters: Emitter[] = [];
  private rain?: Rain;
  constructor(private scene: THREE.Scene) {}

  sprite(tex: THREE.Texture, color: string, pos: THREE.Vector3, life: number, upd: Particle['upd'], scale = 0.1, additive = false): Particle {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity: 0, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
    s.position.copy(pos); s.scale.setScalar(scale); this.scene.add(s);
    const p: Particle = { o: s as Particle['o'], life, age: 0, v: new V3(), seed: rand(0, 6), upd };
    this.list.push(p); return p;
  }
  /** Dust cloud where a piece lands. */
  puff(pos: THREE.Vector3, spread: number) {
    for (let i = 0; i < 14; i++) {
      const a = rand(0, 6.28), sp = rand(0.5, 1.2) * spread;
      const p = this.sprite(SOFT, '#fff8ec', pos.clone().add(new V3(Math.cos(a) * 0.1, rand(0, 0.05), Math.sin(a) * 0.1)), rand(0.5, 0.8), (f, dt, k) => {
        f.o.position.addScaledVector(f.v, dt); f.v.multiplyScalar(1 - dt * 4);
        f.o.material.opacity = 0.7 * (1 - k); f.o.scale.setScalar(0.12 + 0.4 * k);
      });
      p.v.set(Math.cos(a) * sp, rand(0.1, 0.4), Math.sin(a) * sp);
    }
  }
  /** Little sparkle burst (secret found, step done). */
  sparkle(pos: THREE.Vector3, color = '#fff2c0') {
    for (let i = 0; i < 18; i++) {
      const p = this.sprite(SOFT, color, pos.clone(), rand(0.6, 1.1), (f, dt, k) => {
        f.o.position.addScaledVector(f.v, dt); f.v.y -= dt * 0.6;
        f.o.material.opacity = (1 - k); f.o.scale.setScalar(0.08 * (1 - k * 0.5));
      }, 0.08, true);
      p.v.set(rand(-1, 1), rand(0.4, 1.6), rand(-1, 1)).multiplyScalar(0.8);
    }
  }
  steam(at: THREE.Vector3, color = '#ffffff', size = 1) {
    const p = this.sprite(SOFT, color, at.clone().add(new V3(rand(-0.08, 0.12), 0, rand(-0.08, 0.08))), rand(2.2, 3), (f, dt, k) => {
      f.o.position.y += dt * 0.32; f.o.position.x += Math.sin(f.age * 1.3 + f.seed) * dt * 0.08;
      f.o.material.opacity = 0.55 * Math.sin(Math.PI * Math.min(1, k * 1.4)) * (1 - k * 0.4); f.o.scale.setScalar((0.12 + k * 0.55) * size);
    }, 0.12 * size);
    return p;
  }
  petal(at: THREE.Vector3) {
    const spin = rand(-3, 3);
    const p = this.sprite(PETAL, '#ffffff', at, rand(7, 11), (f, dt, k) => {
      if (f.o.position.y > 0.03) {
        f.o.position.addScaledVector(f.v, dt); f.o.position.x += Math.sin(f.age * 2 + f.seed) * dt * 0.15;
        (f.o.material as THREE.SpriteMaterial).rotation += dt * spin;
      }
      f.o.material.opacity = Math.min(1, f.age * 3) * (k > 0.85 ? (1 - k) / 0.15 : 1);
    }, 0.07);
    p.v.set(rand(0.15, 0.35), -rand(0.12, 0.22), rand(0.05, 0.25));
  }
  /** A snowflake drifting down; settles and fades on the ground. */
  snow(at: THREE.Vector3) {
    const p = this.sprite(SOFT, '#ffffff', at, rand(9, 14), (f, dt, k) => {
      if (f.o.position.y > 0.02) { f.o.position.addScaledVector(f.v, dt); f.o.position.x += Math.sin(f.age * 1.3 + f.seed) * dt * 0.12; }
      f.o.material.opacity = 0.9 * Math.min(1, f.age * 2) * (k > 0.8 ? (1 - k) / 0.2 : 1);
    }, rand(0.035, 0.06));
    p.v.set(rand(0.02, 0.08), -rand(0.25, 0.4), rand(-0.03, 0.05));
  }
  /** A firework: a rising spark, then a sphere of coloured sparks that droop and fade. */
  firework(from: THREE.Vector3, to: THREE.Vector3, color: string, onBurst?: () => void) {
    const r = this.sprite(SOFT, '#fff2c8', from.clone(), 1.1, (f, _dt, k) => {
      f.o.position.lerpVectors(from, to, 1 - (1 - k) * (1 - k)); f.o.material.opacity = 0.9;
      if (k >= 0.999) this.burst(to, color, onBurst);
    }, 0.09, true);
    void r;
  }
  private burst(at: THREE.Vector3, color: string, onBurst?: () => void) {
    onBurst?.();
    const flash = this.sprite(SOFT, color, at.clone(), 0.35, (f, _dt, k) => { f.o.material.opacity = 0.45 * (1 - k); f.o.scale.setScalar(0.5 + k * 0.6); }, 0.5, true);
    void flash;
    const n = 90, alt = mixHex(color, '#ffffff', 0.5);
    for (let i = 0; i < n; i++) {
      const u = rand(-1, 1), a = rand(0, Math.PI * 2), s = Math.sqrt(1 - u * u);
      const dir = new V3(s * Math.cos(a), u, s * Math.sin(a)), sp = rand(1.9, 2.3);
      const p = this.sprite(SOFT, i % 3 ? color : alt, at.clone(), rand(1.4, 2.0), (f, dt, k) => {
        f.o.position.addScaledVector(f.v, dt); f.v.multiplyScalar(1 - dt * 1.6); f.v.y -= dt * 0.9;
        const tw = k > 0.6 ? 0.5 + 0.5 * Math.sin(f.age * 40 + f.seed * 10) : 1;
        f.o.material.opacity = (1 - k) * tw; f.o.scale.setScalar(0.14 * (1 - k * 0.6));
      }, 0.14, true);
      p.v.copy(dir).multiplyScalar(sp);
    }
  }
  /** A falling autumn leaf, tinted. */
  leaf(at: THREE.Vector3, color: string) {
    const spin = rand(-4, 4);
    const p = this.sprite(LEAF, color, at, rand(7, 11), (f, dt, k) => {
      if (f.o.position.y > 0.03) {
        f.o.position.addScaledVector(f.v, dt); f.o.position.x += Math.sin(f.age * 1.7 + f.seed) * dt * 0.25;
        (f.o.material as THREE.SpriteMaterial).rotation += dt * spin;
      }
      f.o.material.opacity = Math.min(1, f.age * 3) * (k > 0.85 ? (1 - k) / 0.15 : 1);
    }, 0.09);
    p.v.set(rand(-0.1, 0.25), -rand(0.18, 0.3), rand(0.05, 0.25));
  }
  firefly(at: THREE.Vector3, color = '#d8ff7a') {
    const home = at.clone();
    const p = this.sprite(SOFT, color, at, rand(6, 10), (f, dt, k) => {
      const t = f.age;
      f.o.position.set(home.x + Math.sin(t * 0.7 + f.seed) * 0.5, home.y + Math.sin(t * 0.9 + f.seed * 2) * 0.25 + k * 0.4, home.z + Math.cos(t * 0.6 + f.seed) * 0.5);
      const blink = 0.5 + 0.5 * Math.sin(t * 3 + f.seed * 3);
      f.o.material.opacity = Math.min(1, t) * Math.min(1, (1 - k) * 4) * (0.25 + 0.75 * blink * blink);
      f.o.scale.setScalar(0.07 + 0.05 * blink);
    }, 0.08, true);
    return p;
  }
  /** A dust mote drifting slowly in a sunbeam; `vis()` scales its opacity (no motes at night). */
  mote(at: THREE.Vector3, vis: () => number) {
    const p = this.sprite(SOFT, '#fff6dc', at, rand(6, 10), (f, dt, k) => {
      f.o.position.addScaledVector(f.v, dt); f.o.position.y += Math.sin(f.age * 0.8 + f.seed) * dt * 0.03;
      f.o.material.opacity = 0.5 * Math.sin(Math.PI * k) * vis();
    }, rand(0.025, 0.05), true);
    p.v.set(rand(-0.06, 0.06), rand(-0.03, 0.02), rand(-0.02, 0.02));
  }
  ripple(at: THREE.Vector3) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: RING, transparent: true, opacity: 0, depthWrite: false, color: '#dfe8ef' }));
    m.rotation.x = -Math.PI / 2; m.position.copy(at); this.scene.add(m);
    const p: Particle = { o: m as unknown as Particle['o'], life: 0.8, age: 0, v: new V3(), seed: 0, upd: (f, _dt, k) => {
      f.o.material.opacity = 0.7 * (1 - k); f.o.scale.setScalar(0.04 + 0.22 * k);
    } };
    this.list.push(p);
  }

  emitter(rate: number, spawn: () => void): Emitter { const e = { rate, acc: 0, spawn }; this.emitters.push(e); return e; }

  setRain(opts: { box: THREE.Box3; puddles?: (x: number, z: number) => boolean; cover?: (x: number, z: number) => boolean } | null) {
    this.rain?.dispose(this.scene); this.rain = undefined;
    if (opts) this.rain = new Rain(this.scene, opts.box, opts.puddles, opts.cover);
  }
  get rainy() { return this.rain; }

  update(dt: number) {
    for (const e of this.emitters) { e.acc += dt * e.rate; while (e.acc > 1) { e.acc--; e.spawn(); } }
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i]; f.age += dt;
      const k = Math.min(1, f.age / f.life); f.upd(f, dt, k);
      if (k >= 1) { this.scene.remove(f.o); f.o.material.dispose(); this.list.splice(i, 1); }
    }
    this.rain?.update(dt, this);
  }
  clear() {
    for (const f of this.list) { this.scene.remove(f.o); f.o.material.dispose(); }
    this.list.length = 0; this.emitters.length = 0; this.setRain(null);
  }
}

/** Rain streaks as line segments recycled inside a box; drops hitting puddles leave ripples. */
export class Rain {
  intensity = 1;
  private n = 700;
  private pos: Float32Array;
  private speed: Float32Array;
  private lines: THREE.LineSegments;
  private mat: THREE.LineBasicMaterial;
  constructor(scene: THREE.Scene, private box: THREE.Box3, private puddles?: (x: number, z: number) => boolean, private cover?: (x: number, z: number) => boolean) {
    this.pos = new Float32Array(this.n * 6); this.speed = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) this.reset(i, true);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.LineBasicMaterial({ color: '#dfe9f2', transparent: true, opacity: 0.45, depthWrite: false });
    this.lines = new THREE.LineSegments(g, this.mat); this.lines.frustumCulled = false; scene.add(this.lines);
  }
  private reset(i: number, anywhere: boolean) {
    const b = this.box;
    let x = 0, z = 0;
    for (let k = 0; k < 6; k++) { x = rand(b.min.x, b.max.x); z = rand(b.min.z, b.max.z); if (!this.cover?.(x, z)) break; }
    const y = anywhere ? rand(b.min.y, b.max.y) : b.max.y + rand(0, 1);
    this.speed[i] = rand(5.5, 7.5);
    const o = i * 6; this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z; this.pos[o + 3] = x - 0.02; this.pos[o + 4] = y + 0.16; this.pos[o + 5] = z;
  }
  update(dt: number, fx: Fx) {
    const active = Math.round(this.n * Math.max(0, Math.min(1, this.intensity)));
    for (let i = 0; i < this.n; i++) {
      const o = i * 6;
      if (i >= active) { this.pos[o + 1] = this.pos[o + 4] = -50; continue; }
      if (this.pos[o + 1] < -40) this.reset(i, false);
      const dy = this.speed[i] * dt;
      this.pos[o + 1] -= dy; this.pos[o + 4] -= dy; this.pos[o] -= dy * 0.12; this.pos[o + 3] -= dy * 0.12;
      if (this.pos[o + 1] < this.box.min.y) {
        if (this.puddles?.(this.pos[o], this.pos[o + 2]) && Math.random() < 0.35) fx.ripple(new V3(this.pos[o], 0.012, this.pos[o + 2]));
        this.reset(i, false);
      }
    }
    this.lines.geometry.attributes.position.needsUpdate = true;
    this.mat.opacity = 0.45 * Math.min(1, this.intensity * 1.5);
  }
  dispose(scene: THREE.Scene) { scene.remove(this.lines); this.lines.geometry.dispose(); this.mat.dispose(); }
}
