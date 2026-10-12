// The diorama's base board: a thick rounded slab, printed ground on top, soil layers on the sides.
import * as THREE from 'three';
import { dab, grain, newCanvas, rrect, toTex, type Ctx } from '../core/paint';
import { pick, rand, rgba } from '../core/util';
import { memo, paperMat } from './kit';

export interface BaseDef {
  w: number; d: number;
  paint: (c: Ctx, W: number, D: number) => void;
  grassTop?: [string, string]; // lip colour on the sides
}
export const BASE_T = 0.32;

export function buildBase(key: string, def: BaseDef): THREE.Mesh {
  const { geo, mats } = memo('base:' + key, () => {
    const { w: W, d: D } = def, T = BASE_T;
    const outline = (p: Ctx | THREE.Shape) => rrect(p, -W / 2, -D / 2, W / 2, D / 2, 0.45);
    const shape = new THREE.Shape(); outline(shape);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 10 });
    const lid = geo.groups.find((g) => g.materialIndex === 0)!, pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = lid.start; i < lid.start + lid.count; i++) uv.setXY(i, (pos.getX(i) + W / 2) / W, (pos.getY(i) + D / 2) / D);
    // top print: shape coords, y up = towards the back of the diorama
    const s = Math.min(170, 1024 / Math.max(W, D)), cv = newCanvas(W * s, D * s), c = cv.getContext('2d')!;
    c.setTransform(s, 0, 0, -s, (W / 2) * s, (D / 2) * s);
    def.paint(c, W, D);
    c.strokeStyle = 'rgba(50,70,35,.25)'; c.lineWidth = 0.12; c.beginPath(); outline(c); c.stroke();
    grain(cv, 7);
    // sides: soil strata under a grass lip (flipY off so the canvas top is the top edge)
    const sc = newCanvas(1024, 128), x = sc.getContext('2d')!;
    x.fillStyle = '#8a6546'; x.fillRect(0, 0, 1024, 128);
    for (let i = 0; i < 14; i++) {
      x.fillStyle = rgba(pick(['#7a573b', '#9c7656', '#6e4e35']), 0.5);
      const y = rand(25, 128); x.beginPath(); x.moveTo(0, y);
      for (let k = 0; k <= 1024; k += 32) x.lineTo(k, y + Math.sin(k * 0.02 + i) * 3);
      x.lineTo(1024, y + 8); x.lineTo(0, y + 6); x.fill();
    }
    for (let i = 0; i < 260; i++) dab(x, rand(0, 1024), rand(24, 128), rand(1, 3), pick(['#b59a7a', '#5f4532']));
    const [g1, g2] = def.grassTop ?? ['#86b463', '#a3cd78'];
    x.fillStyle = g1; x.fillRect(0, 0, 1024, 20);
    for (let k = 0; k < 1024; k += 5) x.fillRect(k, 18, 5, rand(2, 12));
    x.fillStyle = g2; x.fillRect(0, 0, 1024, 5);
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,15,5,.35)');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 128);
    const st = toTex(sc, false);
    st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(0.5, 1 / T); st.offset.set(0, -(1 - T) / T);
    return { geo, mats: [paperMat(toTex(cv)), new THREE.MeshStandardMaterial({ map: st, roughness: 1 })] };
  });
  const m = new THREE.Mesh(geo, mats);
  m.rotation.x = -Math.PI / 2; m.position.y = -BASE_T; m.receiveShadow = true;
  return m;
}
