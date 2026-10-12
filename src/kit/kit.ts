// The cardboard kit: printed boards, cutouts and fold-up nets. Pieces of every scene are built from these.
import * as THREE from 'three';
import { grain, newCanvas, toTex, type Ctx, type Outline } from '../core/paint';
import { clamp, ease } from '../core/util';

const V3 = THREE.Vector3;
const memoMap = new Map<string, unknown>();
/** Build once, reuse forever (textures and geometry are shared by the piece, its ghost and its thumbnail). */
export function memo<T>(k: string, f: () => T): T {
  if (!memoMap.has(k)) memoMap.set(k, f());
  return memoMap.get(k) as T;
}

/** Cut edge of the cardboard (lighter) and the unprinted back (grey-brown). */
export const EDGE = new THREE.MeshStandardMaterial({ color: '#ecdcbf', roughness: 1 });
export const BACKM = new THREE.MeshStandardMaterial({ color: '#cdb592', roughness: 1 });
export const paperMat = (map: THREE.Texture, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ map, roughness: 0.9, metalness: 0, ...o });
export const plain = (color: string, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
export const plainM = (key: string, color: string, o: THREE.MeshStandardMaterialParameters = {}) => memo('plain:' + key, () => plain(color, o));

/** Material whose emissiveIntensity the scene drives with the evening. */
export const glowing = (m: THREE.MeshStandardMaterial) => { m.emissive = new THREE.Color('#ffffff'); m.emissiveIntensity = 0; return m; };

/** Flat board lying in XZ: +y face printed, -y face plain back, sides are cut edges. */
export function board(w: number, l: number, t: number, top: THREE.Material, bottom: THREE.Material = BACKM): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, t, l), [EDGE, EDGE, top, bottom, EDGE, EDGE]);
}
/** Standing board in XY: +z face printed (canvas top = top), -z face `back`. */
export function panel(w: number, h: number, t: number, front: THREE.Material, back: THREE.Material = BACKM): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, t), [EDGE, EDGE, EDGE, EDGE, front, back]);
}

/** Print for a board: painted in world units with y down. `emissive` paints a glow map on black. */
export function boardMat(key: string, W: number, H: number, paint: (c: Ctx, W: number, H: number) => void,
  { ppu = 320, emissive }: { ppu?: number; emissive?: (c: Ctx, W: number, H: number) => void } = {}): THREE.MeshStandardMaterial {
  return memo(key, () => {
    let s = ppu;
    if (W * s > 1024 || H * s > 1024) s = 1024 / Math.max(W, H);
    const mk = (fn: (c: Ctx, W: number, H: number) => void, bg?: string) => {
      const cv = newCanvas(Math.max(8, Math.ceil(W * s)), Math.max(8, Math.ceil(H * s)));
      const c = cv.getContext('2d')!;
      c.scale(cv.width / W, cv.height / H);
      if (bg) { c.fillStyle = bg; c.fillRect(0, 0, W, H); }
      fn(c, W, H);
      return cv;
    };
    const cv = mk(paint); grain(cv, 8);
    const m = paperMat(toTex(cv));
    if (emissive) { glowing(m); m.emissiveMap = toTex(mk(emissive, '#000000')); }
    return m;
  });
}

export interface CutoutAsset { geo: THREE.ExtrudeGeometry; mat: THREE.MeshStandardMaterial }
/** A shape cut out of cardboard: outline extruded to the board thickness, print painted with the same outline (y up). */
export function cutoutAsset(key: string, outline: Outline, paint: (c: Ctx, bb: THREE.Box3) => void,
  { ppu = 300, t = 0.035, emissive, ink = 0.022 }: { ppu?: number; t?: number; emissive?: (c: Ctx, bb: THREE.Box3) => void; ink?: number } = {}): CutoutAsset {
  return memo(key, () => {
    const shape = new THREE.Shape(); outline(shape);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 14 });
    geo.translate(0, 0, -t / 2); geo.computeBoundingBox();
    const bb = geo.boundingBox!, W = bb.max.x - bb.min.x, H = bb.max.y - bb.min.y;
    const lid = geo.groups.find((g) => g.materialIndex === 0)!;
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = lid.start; i < lid.start + lid.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / W, (pos.getY(i) - bb.min.y) / H);
    let s = ppu;
    if (W * s > 1024 || H * s > 1024) s = 1024 / Math.max(W, H);
    const mk = (fn: (c: Ctx, bb: THREE.Box3) => void, bg?: string) => {
      const cv = newCanvas(Math.ceil(W * s), Math.ceil(H * s)), c = cv.getContext('2d')!;
      c.setTransform(s, 0, 0, -s, -bb.min.x * s, bb.max.y * s);
      if (bg) { c.fillStyle = bg; c.fillRect(bb.min.x, bb.min.y, W, H); }
      c.save(); c.beginPath(); outline(c); c.clip(); fn(c, bb);
      if (ink && !bg) { c.lineWidth = ink; c.strokeStyle = 'rgba(74,52,38,.55)'; c.beginPath(); outline(c); c.stroke(); }
      c.restore();
      return cv;
    };
    const cv = mk(paint); grain(cv, 9);
    const mat = paperMat(toTex(cv));
    if (emissive) { glowing(mat); mat.emissiveMap = toTex(mk(emissive, '#000000')); }
    return { geo, mat };
  });
}
export const cutout = (a: CutoutAsset) => new THREE.Mesh(a.geo, [a.mat, EDGE]);

/** Lathe (lanterns, bowls, post boxes) with a painted wrap-around print. */
export function latheMat(key: string, w: number, h: number, paint: (c: Ctx, w: number, h: number) => void, o: THREE.MeshStandardMaterialParameters = {}) {
  return memo(key, () => {
    const cv = newCanvas(w, h), c = cv.getContext('2d')!;
    paint(c, w, h); grain(cv, 7);
    const t = toTex(cv); t.wrapS = THREE.RepeatWrapping;
    return paperMat(t, o);
  });
}

export type Foldable = THREE.Group & { userData: { setFold?: (k: number) => void; tick?: (t: number, ev: number) => void } };

/** Box folded from a net: lid on top and four flaps hinged at its edges. setFold(0) = flat net, 1 = box. */
export function foldBox({ w, d, h, t = 0.03, top, front, back, left, right }:
  { w: number; d: number; h: number; t?: number; top: THREE.Material; front: THREE.Material; back: THREE.Material; left: THREE.Material; right: THREE.Material }): Foldable {
  const root = new THREE.Group() as Foldable;
  const lid = board(w, d, t, top); lid.position.y = h - t / 2; root.add(lid);
  const defs: [THREE.Material, number, THREE.Vector3, number][] = [
    [front, w, new V3(0, h, d / 2), 0], [right, d, new V3(w / 2, h, 0), Math.PI / 2],
    [back, w, new V3(0, h, -d / 2), Math.PI], [left, d, new V3(-w / 2, h, 0), -Math.PI / 2]];
  const hinges = defs.map(([mat, width, p, ry]) => {
    const pv = new THREE.Group(); pv.position.copy(p); pv.rotation.y = ry;
    const hg = new THREE.Group(); pv.add(hg);
    const m = board(width, h, t, mat); m.position.set(0, -t / 2, h / 2); hg.add(m);
    root.add(pv); return hg;
  });
  root.userData.setFold = (k) => hinges.forEach((hg, i) => { hg.rotation.x = ease.inOut(clamp((k - i * 0.1) / 0.7, 0, 1)) * Math.PI / 2; });
  root.userData.setFold(1);
  return root;
}

/** Three walls from one strip: back wall standing, side walls hinged vertically, folding forward. Origin at floor centre. */
export function wallNet({ w, d, h, t = 0.03, back, side, outside }:
  { w: number; d: number; h: number; t?: number; back: THREE.Material; side: THREE.Material; outside: THREE.Material }): Foldable {
  const root = new THREE.Group() as Foldable;
  const bw = panel(w, h, t, back, outside); bw.position.set(0, h / 2, -d / 2 + t / 2); root.add(bw);
  const hinges = [-1, 1].map((s) => {
    const hg = new THREE.Group(); hg.position.set((s * w) / 2, 0, -d / 2 + t / 2);
    const m = panel(d, h, t, side, outside); m.position.set((s * d) / 2, h / 2, 0); hg.add(m); root.add(hg);
    return { hg, s };
  });
  root.userData.setFold = (k) => hinges.forEach(({ hg, s }, i) => { hg.rotation.y = -s * ease.inOut(clamp((k - i * 0.15) / 0.85, 0, 1)) * Math.PI / 2; });
  root.userData.setFold(1);
  return root;
}

/** A roof of two boards hinged at the ridge; flat when unfolded. Origin at the ridge. */
export function gableRoof({ w, l, angle, t = 0.035, top, under, ridge }:
  { w: number; l: number; angle: number; t?: number; top: THREE.Material; under: THREE.Material; ridge?: THREE.Material }): Foldable {
  const root = new THREE.Group() as Foldable;
  const hs = [0, Math.PI].map((ry) => {
    const pv = new THREE.Group(); pv.rotation.y = ry;
    const hg = new THREE.Group(); pv.add(hg);
    const m = board(w, l, t, top, under); m.position.set(0, -t / 2, l / 2); hg.add(m);
    root.add(pv); return hg;
  });
  if (ridge) { const r = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.06, 0.1), ridge); r.position.y = 0.01; root.add(r); }
  root.userData.setFold = (k) => hs.forEach((hg, i) => { hg.rotation.x = ease.inOut(clamp((k - i * 0.15) / 0.85, 0, 1)) * angle; });
  root.userData.setFold(1);
  return root;
}

export function group(...objs: THREE.Object3D[]): Foldable {
  const g = new THREE.Group() as Foldable;
  objs.forEach((o) => g.add(o));
  return g;
}
export function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, ry = 0): T {
  o.position.set(x, y, z); o.rotation.y = ry; return o;
}
