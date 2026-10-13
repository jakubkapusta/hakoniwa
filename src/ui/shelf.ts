// The shelf: a sunny Japanese room with a wooden shelf. Unfinished kits stand as boxes (their cover is the finished
// diorama), finished ones stand as small living dioramas. Swipe to scroll, tap to open (the camera flies in).
import * as THREE from 'three';
import { Ambience } from '../audio/audio';
import { Fx } from '../game/fx';
import { sceneSave } from '../game/save';
import { buildBase } from '../kit/base';
import type { Foldable } from '../kit/kit';
import { clamp, ease, rand, reseed } from '../core/util';
import type { LightKey, SceneCtx, SceneDef, SceneHooks } from '../scenes/types';
import type { Snapshot, Stage } from '../stage/stage';
import { $, timeLabel } from './dom';
import { BOX, SHELF, buildBooks, buildFloor, buildKitBox, buildLamp, buildNeko, buildPlant, buildScroll, buildShelf, buildTeapot, buildWall, buildWindowShadow, setLampGlow } from './room';

const V3 = THREE.Vector3;
const SCALE = 0.56;
const TAN = Math.tan(THREE.MathUtils.degToRad(15));

interface Item {
  def: SceneDef; root: THREE.Object3D; anchor: THREE.Vector3; label: HTMLElement;
  live?: { ctx: SceneCtx; hooks: SceneHooks; fx: Fx };
}

/** A whole diorama, assembled (base, every piece, optionally the secret). */
function buildDiorama(def: SceneDef, withSecret: boolean) {
  reseed(def.seed);
  const g = new THREE.Group(), placed = new Map<string, THREE.Object3D>();
  g.add(buildBase(def.id, def.base));
  for (const id in def.pieces) {
    const p = def.pieces[id], o = p.build();
    o.position.set(...p.pos); o.rotation.y = p.rotY ?? 0;
    g.add(o); placed.set(id, o);
  }
  if (withSecret) { const s = def.secret.build(); s.position.set(...def.secret.pos); s.rotation.y = def.secret.rotY ?? 0; g.add(s); placed.set('__secret', s); }
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return { g, placed };
}
const art = new Map<string, HTMLCanvasElement>();

export class ShelfView {
  active = false;
  evening = 0;
  private eveningTarget = 0;
  private items: Item[] = [];
  private decos: Foldable[] = [];
  private fx?: Fx;
  private ambience = new Ambience();
  private lampLight = new THREE.PointLight('#ffc98a', 0, 14, 1.3);
  /** A warm fill that travels with the scroll, so lower shelves aren't lost in the dark at night. */
  private fill = new THREE.PointLight('#ffcf9a', 0, 12, 1.2);
  private rows = 1;
  /** 1 column on a phone held upright (bigger dioramas, scroll), 2 otherwise. */
  private cols = 2;
  private W = SHELF.W;
  private scenes: SceneDef[] = [];
  private camY = 0;
  private velY = 0;
  private down?: { x: number; y: number; camY: number; moved: boolean; t: number };
  private fly?: { from: THREE.Vector3; to: THREE.Vector3; look0: THREE.Vector3; look1: THREE.Vector3; t: number; def: SceneDef };
  private ray = new THREE.Raycaster();

  constructor(private stage: Stage, private snap: Snapshot, private open: (def: SceneDef) => void) {
    const h = new Date().getHours();
    this.eveningTarget = this.evening = h >= 18 || h < 6 ? 1 : 0;
    addEventListener('resize', () => { if (this.active && !this.fly && this.colsFor() !== this.cols) this.show(this.scenes); });
    stage.canvas.addEventListener('wheel', (e) => { if (this.active) { e.preventDefault(); this.camY -= e.deltaY * 0.01; } }, { passive: false });
    $('timeBtn').onclick = () => { this.eveningTarget = this.eveningTarget > 0.5 ? 0 : 1; this.syncTimeBtn(); };
  }
  private colsFor() { return innerWidth / innerHeight < 0.8 ? 1 : 2; }
  private syncTimeBtn() { $('timeBtn').innerHTML = timeLabel(this.eveningTarget > 0.5); }

  show(scenes: SceneDef[]) {
    const st = this.stage;
    this.hide();
    this.active = true;
    st.reset(); st.hideSky(); st.autoFrame = false;
    st.controls.enabled = false; st.controls.autoRotate = false;
    this.fx = new Fx(st.scene);
    this.scenes = scenes;
    const cols = (this.cols = this.colsFor());
    this.W = cols === 1 ? 4.7 : SHELF.W;
    this.rows = Math.ceil(scenes.length / cols) + 1;
    const { row, slot } = SHELF, W = this.W, H = this.rows * row, cx = 0, cy = H / 2;
    const sunPos: [number, number, number] = [cx - 5, cy + 6, 12];
    const keys: { day: LightKey; evening: LightKey } = {
      day: { sky: '#fff0da', ground: '#b39470', hemi: 1.3, sun: '#ffe2b4', sunI: 2.9, sunPos, bloom: 0.05 },
      evening: { sky: '#8a7aa6', ground: '#3d2c22', hemi: 0.75, sun: '#93a4d6', sunI: 0.35, sunPos, bloom: 0.45 },
    };
    st.setLights(keys); st.shadowBox(cx, cy, Math.max(7, H * 0.7));
    const sunDir = new V3(...sunPos).sub(new V3(cx, cy, 0)).normalize();
    const win = buildWindowShadow(new V3(cx + 0.6, cy - 0.4, 0).addScaledVector(sunDir, 8)); win.lookAt(new V3(...sunPos).addScaledVector(sunDir, 10));
    st.scene.add(buildWall(H), buildFloor(), buildShelf(this.rows, W), win, this.lampLight, this.fill);
    const lx = cols === 1 ? 1.35 : 2.6, sx = cols === 1 ? -1.25 : -2.4;
    const lamp = buildLamp(); lamp.position.set(lx, H + 2.1, 0.9); st.scene.add(lamp); this.decos.push(lamp);
    this.lampLight.position.set(lx, H + 1.5, 1.6);
    const scroll = buildScroll(); scroll.position.set(sx, H + 2.0, SHELF.wallZ + 0.03); st.scene.add(scroll);
    const pot = buildTeapot(); pot.position.set(-W / 2 + 1.1, H + 0.07, 0.3); pot.rotation.y = 0.5; pot.scale.setScalar(0.8); st.scene.add(pot);

    // slots from the top row, left to right; kits first, then little things
    const DECO = [buildNeko, buildPlant, buildTeapot, buildBooks];
    const labels = $('shelfLabels'); labels.innerHTML = '';
    for (let s = 0; s < this.rows * cols; s++) {
      const r = this.rows - 1 - Math.floor(s / cols), x = cols === 1 ? 0 : (s % 2 ? 1 : -1) * (slot / 2), y = r * row;
      const def = scenes[s];
      if (!def) {
        // empty slots get little things (two of them on a narrow shelf)
        for (const [k, dx] of (cols === 1 ? [[0, -1.2], [1, 1.1]] : [[0, 0]]) as [number, number][]) {
        const d = DECO[(s - scenes.length + k) % DECO.length]();
        d.position.set(x + dx + rand(-0.3, 0.3), y, rand(-0.3, 0.2)); d.rotation.y = rand(-0.3, 0.3);
        d.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        st.scene.add(d); this.decos.push(d);
        }
        continue;
      }
      const save = sceneSave(def.id), total = Object.keys(def.pieces).length;
      let root: THREE.Object3D, live: Item['live'];
      if (save.done) {
        const { g, placed } = buildDiorama(def, save.secret);
        const ctx: SceneCtx = { scene: g as unknown as THREE.Scene, fx: new Fx(g as unknown as THREE.Scene), placed, evening: this.evening, done: true, quiet: true, sound: () => {} };
        const hooks = def.setup(ctx); hooks.alive?.(ctx);
        // lights don't shrink with the model: shorten their reach (intensity is scaled every frame in update)
        g.traverse((o) => { const l = o as THREE.PointLight; if (l.isPointLight) l.distance *= SCALE; });
        g.scale.setScalar(SCALE); g.position.set(x, y + 0.32 * SCALE, 0.1); g.rotation.y = cols === 1 ? 0 : s % 2 ? -0.12 : 0.12;
        root = g; live = { ctx, hooks, fx: ctx.fx };
      } else {
        if (!art.has(def.id)) art.set(def.id, this.snap.shootCanvas(buildDiorama(def, false).g, 520, 400, new V3(0.5, 0.42, 1), 0.82));
        const box = buildKitBox(def, art.get(def.id)!, save.placed.length, total);
        box.position.set(x, y + BOX.h / 2, -0.5); box.rotation.y = (cols === 1 ? 0 : s % 2 ? -1 : 1) * 0.08 + rand(-0.03, 0.03);
        root = box;
      }
      root.userData.def = def;
      st.scene.add(root);
      const label = document.createElement('button');
      label.className = 'tag' + (save.done ? ' done' : '');
      // a wooden name plaque: the title, then a red seal when it's done (and a green one for the secret), else the count
      const state = save.done ? '<em class="seal">済</em><em class="word">gotowe</em>' : save.placed.length ? `<em class="count">${save.placed.length} / ${total}</em>` : '<em class="word">nowy zestaw</em>';
      label.innerHTML = `<small>${def.jp}</small><b>${def.title}</b><span>${state}${save.secret ? '<em class="seal green" title="sekret znaleziony">秘</em>' : ''}</span>`;
      label.onclick = () => this.flyTo(root, def);
      labels.appendChild(label);
      this.items.push({ def, root, anchor: new V3(x, y, SHELF.depth / 2), label, live });
    }
    // sunbeam dust
    this.fx.emitter(5, () => this.fx!.mote(new V3(rand(-5, 3), rand(cy - 3, cy + 3), rand(-1, 2.5)), () => 1 - this.evening));
    this.ambience.set('chime', 0.7); this.ambience.set('leaves', 0.35); this.ambience.set('crickets', 0.8);
    this.camY = Infinity; this.velY = 0; // clamped to the top of the room on the first frame this.fly = undefined;
    this.stage.setEvening(this.evening); this.syncTimeBtn();
    this.bindInput();
    this.stage.fit();
  }

  private bindInput() {
    const cv = this.stage.canvas;
    cv.onpointerdown = (e) => { if (this.fly) return; this.down = { x: e.clientX, y: e.clientY, camY: this.camY, moved: false, t: performance.now() }; this.velY = 0; };
    cv.onpointermove = (e) => {
      const d = this.down; if (!d) return;
      const dy = e.clientY - d.y;
      if (Math.abs(dy) > 6 || Math.abs(e.clientX - d.x) > 6) d.moved = true;
      if (d.moved) { const prev = this.camY; this.camY = d.camY + dy * this.unitsPerPx(); this.velY = (this.camY - prev) * 60; }
    };
    cv.onpointerup = (e) => {
      const d = this.down; this.down = undefined;
      if (!d || d.moved) return;
      this.ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), this.stage.camera);
      for (const it of this.items) if (this.ray.intersectObject(it.root, true).length) { this.flyTo(it.root, it.def); return; }
    };
  }
  private unitsPerPx() { return (2 * TAN * this.dist()) / innerHeight; }
  private dist() { const a = innerWidth / innerHeight; return Math.max((this.W + 1.2) / (2 * TAN * a), 6.6 / (2 * TAN)); }

  private flyTo(root: THREE.Object3D, def: SceneDef) {
    if (this.fly) return;
    const p = root.getWorldPosition(new V3());
    const cam = this.stage.camera;
    this.fly = { from: cam.position.clone(), to: new V3(p.x, p.y + 1.1, p.z + 3.2), look0: this.stage.controls.target.clone(), look1: new V3(p.x, p.y + 0.5, p.z), t: 0, def };
  }

  update(dt: number, t: number) {
    if (!this.active) return;
    const { row } = SHELF, H = this.rows * row;
    if (this.evening !== this.eveningTarget) {
      this.evening += Math.sign(this.eveningTarget - this.evening) * Math.min(Math.abs(this.eveningTarget - this.evening), dt / 2.5);
      this.stage.setEvening(this.evening);
    }
    setLampGlow(this.evening); this.lampLight.intensity = this.evening * 14; this.fill.intensity = this.evening * 7;
    for (const it of this.items) if (it.live) {
      const c = it.live.ctx; c.evening = this.evening;
      it.live.hooks.update?.(dt, t, c); c.placed.forEach((o) => (o as Foldable).userData.tick?.(t, c.evening)); it.live.fx.update(dt);
      it.root.traverse((o) => { const l = o as THREE.Light; if (l.isLight) l.intensity *= SCALE * SCALE; });
    }
    this.decos.forEach((d) => d.userData.tick?.(t, this.evening));
    this.fx?.update(dt);
    this.ambience.update(this.evening);

    // camera: scroll with a little inertia, clamped to the shelf
    const D = this.dist(), visH = 2 * TAN * D;
    const lo = Math.min(H / 2, row * 0.55 + visH * 0.25), hi = Math.max(H / 2 + 0.6, H + 1.6 - visH * 0.32);
    if (!this.down) { this.camY += this.velY * dt; this.velY *= Math.pow(0.04, dt); }
    this.camY = clamp(this.camY, lo, hi);
    // the logo belongs to the top of the room: it fades out as you scroll down the shelf
    ($('shelf').querySelector('.logo') as HTMLElement).style.opacity = String(clamp(1 - (hi - this.camY) / 1.2, 0, 1));
    const cam = this.stage.camera, ctl = this.stage.controls;
    if (this.fly) {
      const f = this.fly; f.t += dt / 0.95; const k = ease.inOut(Math.min(1, f.t));
      if (f.t > 0.4) $('fade').classList.add('show');
      cam.position.lerpVectors(f.from, f.to, k); ctl.target.lerpVectors(f.look0, f.look1, k);
      if (f.t >= 1) { const def = f.def; this.fly = undefined; this.open(def); return; }
    } else {
      cam.position.set(0, this.camY + 1.0, D + 1.25); ctl.target.set(0, this.camY - 0.1, 0);
      this.fill.position.set(0.8, this.camY + 0.6, 3.2);
    }
    cam.lookAt(ctl.target);
    // labels under each item, on the front edge of its shelf plank
    for (const it of this.items) {
      const p = it.anchor.clone().project(cam);
      const x = ((p.x + 1) / 2) * innerWidth, y = ((1 - p.y) / 2) * innerHeight;
      it.label.style.transform = `translate(${x}px, ${y + 6}px) translate(-50%, 0)`;
      it.label.style.visibility = p.z < 1 && y > -40 && y < innerHeight + 40 ? 'visible' : 'hidden';
    }
  }

  hide() {
    if (!this.active) return;
    this.active = false;
    for (const it of this.items) it.live?.fx.clear();
    this.items = []; this.decos = [];
    this.fx?.clear(); this.fx = undefined;
    this.ambience.clear();
    const cv = this.stage.canvas; cv.onpointerdown = cv.onpointermove = cv.onpointerup = null;
    $('shelfLabels').innerHTML = '';
  }
}
