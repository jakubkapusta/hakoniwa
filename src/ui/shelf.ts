// The shelf: one kit box per scene, with box art rendered from the finished diorama.
import * as THREE from 'three';
import { buildBase } from '../kit/base';
import { reseed } from '../core/util';
import type { SceneDef } from '../scenes/types';
import type { Snapshot } from '../stage/stage';
import { sceneSave } from '../game/save';
import { $ } from './dom';

const art = new Map<string, string>();

function boxArt(def: SceneDef, snap: Snapshot): string {
  reseed(def.seed);
  const g = new THREE.Group();
  g.add(buildBase(def.id, def.base));
  for (const id in def.pieces) {
    const p = def.pieces[id], o = p.build();
    o.position.set(...p.pos); o.rotation.y = p.rotY ?? 0;
    g.add(o);
  }
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return snap.shoot(g, 520, 400, new THREE.Vector3(0.5, 0.42, 1), 0.82);
}

export function renderShelf(scenes: SceneDef[], snap: Snapshot, open: (def: SceneDef) => void) {
  const list = $('boxes');
  list.innerHTML = '';
  for (const def of scenes) {
    const st = sceneSave(def.id), total = Object.keys(def.pieces).length, n = st.placed.length;
    const state = st.done ? 'Gotowe ✓' : n ? `W trakcie · ${n}/${total}` : 'Nowy zestaw';
    const el = document.createElement('button');
    el.className = 'box' + (st.done ? ' done' : '');
    el.style.setProperty('--b1', def.box[0]); el.style.setProperty('--b2', def.box[1]);
    el.innerHTML = `
      <div class="lid"><span class="jp">${def.jp}</span><span class="season">${def.season}</span></div>
      <div class="art">${art.has(def.id) ? `<img src="${art.get(def.id)}" alt="">` : '<i class="painting">maluję…</i>'}</div>
      <div class="label"><b>${def.title}</b><small>${def.blurb}</small>
        <span class="meta"><em>${state}</em>${st.secret ? '<em class="secret">sekret ✓</em>' : ''}<em>${total} kawałków</em></span></div>`;
    el.onclick = () => { el.classList.add('opening'); setTimeout(() => open(def), 380); };
    list.appendChild(el);
  }
  // paint missing box art one scene per frame, after the shelf is on screen
  const todo = scenes.filter((d) => !art.has(d.id));
  const next = () => {
    const def = todo.shift();
    if (!def || !$('shelf').classList.contains('show')) return;
    art.set(def.id, boxArt(def, snap));
    const i = scenes.indexOf(def), slot = list.children[i]?.querySelector('.art');
    if (slot) slot.innerHTML = `<img src="${art.get(def.id)}" alt="">`;
    setTimeout(next, 30);
  };
  setTimeout(next, 60);
}
