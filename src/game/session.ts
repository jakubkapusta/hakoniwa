// One open diorama: steps, tray, ghosts, dragging, placing, the finale and the secret.
import * as THREE from 'three';
import { audio, sfx, Ambience } from '../audio/audio';
import { buildBase } from '../kit/base';
import type { Foldable } from '../kit/kit';
import { clamp, ease, lerp, reseed } from '../core/util';
import type { SceneCtx, SceneDef, SceneHooks } from '../scenes/types';
import type { Snapshot, Stage } from '../stage/stage';
import { Fx } from './fx';
import { persist, save, sceneSave } from './save';
import { $, toast } from '../ui/dom';

const V3 = THREE.Vector3;
interface Info { center: THREE.Vector3; size: THREE.Vector3; radius: number; offset: THREE.Vector3 }
interface Drag { id: string; card: HTMLElement; pid: number; x0: number; y0: number; started: boolean; near: boolean; obj?: Foldable }
interface Tween { t: number; dur: number; fn: (k: number) => void; e: (k: number) => number; res: () => void }

const thumbs = new Map<string, string>();

export class Session {
  fx: Fx;
  ctx: SceneCtx;
  hooks: SceneHooks;
  ambience = new Ambience();
  private ghosts = new Map<string, Foldable>();
  private info: Record<string, Info> = {};
  private inflight = new Set<string>();
  private tweens: Tween[] = [];
  private stepIdx = 0;
  private eveningTarget = 0;
  private gen = 0;
  private drag: Drag | null = null;
  private advancing = false;
  private speed = 1;
  private secretObj?: Foldable;
  private tap?: { x: number; y: number; t: number };
  auto = false;
  onExit?: () => void;

  constructor(private stage: Stage, private snap: Snapshot, public def: SceneDef) {
    stage.reset();
    stage.autoFrame = true; stage.controls.enabled = true; stage.shadowBox(0, 0, 6);
    reseed(def.seed);
    this.fx = new Fx(stage.scene);
    this.ctx = { scene: stage.scene, fx: this.fx, placed: new Map(), evening: 0, done: false, sound: (l, v) => this.ambience.set(l, v) };
    stage.scene.add(buildBase(def.id, def.base));
    stage.setSky(def.sky.day, def.sky.evening, def.seed);
    stage.setLights(def.light);
    stage.camTarget = def.camTarget ?? 1;
    stage.controls.autoRotate = false;
    stage.userMoved = false; stage.fit(true);
    this.hooks = def.setup(this.ctx);
    (def.sounds ?? []).forEach((l) => this.ambience.set(l, 1));
    this.makeThumbs();

    const st = sceneSave(def.id);
    for (const id of st.placed) if (def.pieces[id]) this.putInstant(id);
    $('hud').classList.add('show');
    $('final').classList.remove('show');
    if (st.done && this.allPlaced()) this.becomeAlive(false);
    else this.startStep(this.firstOpenStep());
    $('hint').style.opacity = save.hinted ? '0' : '1';

    this.bindCanvasTap();
    // the drag follows the pointer on the whole window: on phones the card (hidden while dragging) doesn't reliably get the release
    addEventListener('pointermove', this.onMove); addEventListener('pointerup', this.onUp); addEventListener('pointercancel', this.onUp);
    addEventListener('pointerdown', this.onAnyDown, true); addEventListener('blur', this.onBlur);
  }

  // ── setup helpers
  private instantiate(id: string): Foldable {
    const d = this.def.pieces[id], o = d.build();
    o.position.set(...d.pos); o.rotation.y = d.rotY ?? 0;
    o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return o;
  }
  private makeThumbs() {
    for (const id in this.def.pieces) {
      const k = this.def.id + ':' + id;
      if (thumbs.has(k)) continue;
      const o = this.def.pieces[id].build();
      if (o.userData.setFold) o.userData.setFold(0);
      // flat things (nets, boards) are shown from above, standing ones from the front
      const s = new THREE.Box3().setFromObject(o).getSize(new V3());
      const flat = s.y < 0.3 * Math.max(s.x, s.z);
      thumbs.set(k, this.snap.shoot(o, 144, 144, flat ? new V3(0.3, 1.4, 1) : new V3(0.35, 0.3, 1)));
    }
  }
  private allPlaced() { return Object.keys(this.def.pieces).every((id) => this.ctx.placed.has(id)); }
  private firstOpenStep() {
    const i = this.def.steps.findIndex((s) => s.pieces.some((id) => !this.ctx.placed.has(id)));
    return i < 0 ? this.def.steps.length - 1 : i;
  }
  private putInstant(id: string) {
    const o = this.instantiate(id);
    this.stage.scene.add(o); this.ctx.placed.set(id, o);
    this.onPlaced(id);
  }
  private onPlaced(id: string) {
    const snd = this.def.pieces[id].sound;
    if (snd) this.ambience.set(snd, 1);
    this.hooks.placed?.(id, this.ctx);
  }

  // ── steps, tray and ghosts
  private startStep(i: number) {
    this.stepIdx = i;
    const st = this.def.steps[i];
    $('stepNum').textContent = String(i + 1);
    $('stepName').innerHTML = `${st.name}<small>${st.jp}</small>`;
    $('dots').innerHTML = this.def.steps.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('');
    $('step').style.opacity = '1';
    const tray = $('tray'); tray.innerHTML = '';
    tray.style.setProperty('--n', String(Math.max(4, st.pieces.filter((id) => !this.ctx.placed.has(id)).length)));
    st.pieces.forEach((id, k) => {
      if (this.ctx.placed.has(id)) return;
      this.makeGhost(id);
      const card = document.createElement('div');
      card.className = 'card'; card.style.animationDelay = k * 0.07 + 's'; card.dataset.id = id;
      card.innerHTML = `<img src="${thumbs.get(this.def.id + ':' + id)}" alt=""><span>${this.def.pieces[id].name}</span>`;
      tray.appendChild(card); this.bindCard(card, id);
    });
  }
  private makeGhost(id: string) {
    const o = this.instantiate(id); o.userData.setFold?.(1);
    o.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(o), center = box.getCenter(new V3()), size = box.getSize(new V3());
    this.info[id] = { center, size, radius: size.length() / 2, offset: center.clone().sub(o.position) };
    const mat = new THREE.MeshBasicMaterial({ color: '#fffaf0', transparent: true, opacity: 0, depthWrite: false });
    o.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) { mm.material = mat; mm.castShadow = mm.receiveShadow = false; } });
    o.userData.gmat = mat; o.userData.id = id;
    this.stage.scene.add(o); this.ghosts.set(id, o);
  }

  // ── input
  private bindCard(card: HTMLElement, id: string) {
    card.addEventListener('pointerdown', (e) => {
      if (this.auto || this.ctx.done || this.drag || this.inflight.has(id)) return;
      audio();
      this.drag = { id, card, pid: e.pointerId, x0: e.clientX, y0: e.clientY, started: false, near: false };
      try { card.setPointerCapture(e.pointerId); } catch { /* synthetic events in tests */ }
    });
  }
  private onMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pid) return;
    if (!d.started && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 8) {
      d.started = true; d.card.classList.add('gone'); this.stage.controls.enabled = false;
      const o = this.instantiate(d.id); o.userData.setFold?.(0); this.stage.scene.add(o);
      d.obj = o; this.inflight.add(d.id); sfx.pick();
    }
    if (d.started) this.moveDrag(e);
  };
  private onUp = (e: PointerEvent) => { if (this.drag && e.pointerId === this.drag.pid) this.release(); };
  /** A new touch while a drag is still open means its release got lost: finish it first. */
  private onAnyDown = (e: PointerEvent) => { if (this.drag && e.pointerId !== this.drag.pid) this.release(); };
  private onBlur = () => { if (this.drag) this.release(); };
  private release() {
    const d = this.drag;
    if (!d) return;
    this.drag = null; this.stage.controls.enabled = true;
    if (!d.started) { this.nudge(d.card); return; }
    const o = d.obj!;
    if (d.near) { this.place(d.id, o); return; }
    const s0 = o.scale.x;
    sfx.back();
    this.anim(0.25, (k) => o.scale.setScalar(s0 * (1 - k) + 0.001)).then(() => { this.stage.scene.remove(o); this.inflight.delete(d.id); });
    d.card.classList.remove('gone');
  }
  private ray = new THREE.Raycaster();
  /** A tap only wiggles the card: pieces have to be carried onto the scene. */
  private nudge(card: HTMLElement) {
    card.classList.remove('nudge'); void card.offsetWidth; card.classList.add('nudge');
    if (!this.nudged) { this.nudged = true; toast('Przeciągnij kawałek na scenę'); }
  }
  private nudged = false;
  /** The piece hangs just above the finger at the depth of its target, so it is always visible and already at its final size. */
  private moveDrag(e: PointerEvent) {
    const d = this.drag!, inf = this.info[d.id], cam = this.stage.camera;
    const lift = e.pointerType === 'touch' ? 48 : 14;
    const x = e.clientX, y = e.clientY - lift;
    this.ray.setFromCamera(new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1), cam);
    const at = this.ray.ray.at(cam.position.distanceTo(inf.center), new V3());
    const p = inf.center.clone().project(cam);
    const sx = ((p.x + 1) / 2) * innerWidth, sy = ((1 - p.y) / 2) * innerHeight;
    const dist = Math.hypot(x - sx, y - sy), thr = Math.max(56, Math.min(innerWidth, innerHeight) * 0.13);
    d.near = dist < thr;
    // close to the outline the piece is pulled towards its place, like a magnet
    const pull = clamp(1 - dist / (thr * 1.6), 0, 1) * 0.7;
    at.lerp(inf.center.clone().add(new V3(0, 0.35, 0)), pull * pull);
    d.obj!.position.copy(at).sub(inf.offset);
  }
  /** Taps on the 3D view: only used for the secret after the finale. */
  private bindCanvasTap() {
    const cv = this.stage.canvas;
    cv.onpointerdown = (e) => { this.tap = { x: e.clientX, y: e.clientY, t: performance.now() }; };
    cv.onpointerup = (e) => {
      const t = this.tap; this.tap = undefined;
      if (!t || !this.secretObj || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 8 || performance.now() - t.t > 500) return;
      this.ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), this.stage.camera);
      const hit = this.ray.intersectObject(this.secretObj, true)[0];
      // generous: also count a tap close to it on screen
      const p = this.secretObj.getWorldPosition(new V3()).add(new V3(0, 0.15, 0)).project(this.stage.camera);
      const near = Math.hypot(e.clientX - ((p.x + 1) / 2) * innerWidth, e.clientY - ((1 - p.y) / 2) * innerHeight) < 34;
      if (hit || near) this.foundSecret();
    };
  }

  // ── placing
  private anim(dur: number, fn: (k: number) => void, e = ease.inOut) {
    return new Promise<void>((res) => this.tweens.push({ t: 0, dur, fn, e, res }));
  }
  private wait(d: number) { return this.anim(d, () => {}); }
  async tapPlace(id: string) {
    if (this.inflight.has(id) || this.ctx.placed.has(id)) return;
    this.inflight.add(id);
    $('tray').querySelector(`[data-id="${id}"]`)?.classList.add('gone');
    const o = this.instantiate(id); o.userData.setFold?.(0);
    o.position.y += 2.4; o.scale.setScalar(0.01);
    this.stage.scene.add(o); sfx.pick();
    await this.place(id, o);
  }
  private async place(id: string, obj: Foldable) {
    const my = this.gen, d = this.def.pieces[id], inf = this.info[id], SP = this.speed;
    const g = this.ghosts.get(id);
    if (g) { this.ghosts.delete(id); const m = g.userData.gmat as THREE.MeshBasicMaterial, o0 = m.opacity; this.anim(0.25, (k) => { m.opacity = o0 * (1 - k); }).then(() => this.stage.scene.remove(g)); }
    const target = new V3(...d.pos), hover = target.clone().add(new V3(0, 0.5, 0)), from = obj.position.clone(), s0 = obj.scale.x;
    const alive = () => { if (my !== this.gen) { this.stage.scene.remove(obj); return false; } return true; };
    await this.anim(0.42 * SP, (k) => { obj.position.lerpVectors(from, hover, k); obj.scale.setScalar(lerp(s0, 1, k)); }, ease.out);
    if (!alive()) return;
    if (obj.userData.setFold) { sfx.fold(); await this.anim(0.8 * SP, (k) => obj.userData.setFold!(k), ease.lin); if (!alive()) return; }
    await this.anim(0.2 * SP, (k) => obj.position.lerpVectors(hover, target, k), ease.in);
    if (!alive()) return;
    obj.position.copy(target);
    sfx.tok(clamp(inf.radius / 1.2, 0.5, 1.5));
    this.fx.puff(new V3(inf.center.x, inf.center.y - inf.size.y / 2 + 0.03, inf.center.z), clamp(inf.radius * 0.8, 0.35, 1.4));
    await this.anim(0.35, (k) => { const w = Math.sin(k * Math.PI) * (1 - k); obj.scale.set(1 + 0.07 * w, 1 - 0.12 * w, 1 + 0.07 * w); }, ease.lin);
    if (!alive()) return;
    obj.scale.set(1, 1, 1);
    this.ctx.placed.set(id, obj); this.inflight.delete(id);
    const st = sceneSave(this.def.id);
    if (!st.placed.includes(id)) st.placed.push(id);
    if (!save.hinted) { save.hinted = true; $('hint').style.opacity = '0'; }
    persist();
    this.onPlaced(id);
    await this.checkStep(my);
  }
  private async checkStep(my: number) {
    const st = this.def.steps[this.stepIdx];
    if (this.advancing || !st.pieces.every((id) => this.ctx.placed.has(id))) return;
    this.advancing = true; sfx.chime(); toast(`${st.name} ✓`);
    await this.wait(0.9);
    this.advancing = false;
    if (my !== this.gen) return;
    if (this.stepIdx < this.def.steps.length - 1) this.startStep(this.stepIdx + 1);
    else this.finale();
  }

  // ── finale and the living diorama
  private finale() {
    sceneSave(this.def.id).done = true; persist();
    sfx.finale();
    this.becomeAlive(true);
  }
  private becomeAlive(animated: boolean) {
    this.ctx.done = true;
    $('tray').innerHTML = ''; $('step').style.opacity = '0'; $('hint').style.opacity = '0';
    this.eveningTarget = 1;
    if (!animated) { this.ctx.evening = 1; this.stage.setEvening(1); this.hooks.alive?.(this.ctx); }
    else this.hooks.finale?.(this.ctx);
    this.stage.controls.autoRotate = true;
    const s = this.def.secret, o = s.build();
    o.position.set(...s.pos); o.rotation.y = s.rotY ?? 0;
    o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    if (animated) { o.scale.setScalar(0.001); this.anim(0.6, (k) => o.scale.setScalar(Math.max(0.001, ease.back(k))), ease.lin); }
    this.stage.scene.add(o); this.secretObj = o;
    setTimeout(() => this.showFinal(animated), animated ? 1600 : 0);
  }
  private showFinal(fresh: boolean) {
    const st = sceneSave(this.def.id);
    $('finalJp').textContent = fresh ? 'おつかれさま · gotowe!' : this.def.jp;
    $('finalTitle').textContent = this.def.title;
    $('finalSecret').innerHTML = st.secret ? `Sekret: <b>${this.def.secret.name}</b> ✓` : 'Gdzieś ukrył się sekret. Obróć dioramę i stuknij go.';
    $('duskBtn').textContent = this.eveningTarget ? '☀ Dzień' : '☾ Wieczór';
    $('final').classList.add('show');
  }
  private foundSecret() {
    const st = sceneSave(this.def.id), o = this.secretObj!;
    sfx.secret();
    this.fx.sparkle(o.getWorldPosition(new V3()).add(new V3(0, 0.3, 0)));
    const y0 = o.position.y;
    this.anim(0.5, (k) => { o.position.y = y0 + Math.sin(k * Math.PI) * 0.25; }, ease.lin);
    if (st.secret) return;
    st.secret = true; persist();
    toast(`Sekret znaleziony: ${this.def.secret.name}!`);
    if ($('final').classList.contains('show')) this.showFinal(false);
  }
  toggleEvening() {
    this.eveningTarget = this.eveningTarget > 0.5 ? 0 : 1;
    $('duskBtn').textContent = this.eveningTarget ? '☀ Dzień' : '☾ Wieczór';
  }

  // ── dev / auto
  async runAuto() {
    if (this.auto || this.ctx.done) return;
    this.auto = true; this.speed = 0.7; const my = this.gen;
    while (this.auto && !this.ctx.done && my === this.gen) {
      const ids = this.def.steps[this.stepIdx].pieces.filter((id) => !this.ctx.placed.has(id) && !this.inflight.has(id));
      if (!ids.length) { await this.wait(0.2); continue; }
      await this.tapPlace(ids[0]); await this.wait(0.12);
    }
    this.auto = false; this.speed = 1;
  }

  update(dt: number, t: number) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const w = this.tweens[i]; w.t += dt;
      let k = Math.min(1, w.t / w.dur);
      // a failing animation must not stop every frame after it: drop it and let its piece land
      try { w.fn(w.e(k)); } catch (err) { console.error(err); k = 1; }
      if (k >= 1) { this.tweens.splice(i, 1); w.res(); }
    }
    const c = this.ctx;
    if (c.evening !== this.eveningTarget) {
      c.evening += Math.sign(this.eveningTarget - c.evening) * Math.min(Math.abs(this.eveningTarget - c.evening), dt / 3.5);
      this.stage.setEvening(c.evening);
    }
    this.ghosts.forEach((g) => {
      const d = this.drag, active = d && d.started && d.id === g.userData.id;
      const m = g.userData.gmat as THREE.MeshBasicMaterial;
      m.opacity = lerp(m.opacity, (active ? (d!.near ? 0.6 : 0.38) : 0.2) + 0.07 * Math.sin(t * 3), 0.12);
    });
    c.placed.forEach((o) => (o as Foldable).userData.tick?.(t, c.evening));
    this.secretObj?.userData.tick?.(t, c.evening);
    try { this.hooks.update?.(dt, t, c); } catch (err) { console.error(err); }
    this.fx.update(dt);
    this.ambience.update(c.evening);
  }

  close() {
    removeEventListener('pointermove', this.onMove); removeEventListener('pointerup', this.onUp); removeEventListener('pointercancel', this.onUp);
    removeEventListener('pointerdown', this.onAnyDown, true); removeEventListener('blur', this.onBlur);
    this.gen++; this.auto = false; this.drag = null; this.tweens.length = 0;
    this.stage.controls.enabled = true; this.stage.controls.autoRotate = false;
    this.fx.clear(); this.ambience.clear();
    this.stage.canvas.onpointerdown = this.stage.canvas.onpointerup = null;
    $('tray').innerHTML = ''; $('hud').classList.remove('show'); $('final').classList.remove('show');
  }
}
