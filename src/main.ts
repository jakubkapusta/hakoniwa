import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-ext-600.css';
import '@fontsource/nunito/latin-ext-700.css';
import '@fontsource/nunito/latin-ext-800.css';
import './style.css';
import { audio, setMuted, sfx } from './audio/audio';
import { Session } from './game/session';
import { persist, save, sceneSave } from './game/save';
import { SCENES } from './scenes';
import type { SceneDef } from './scenes/types';
import { Snapshot, Stage } from './stage/stage';
import { $ } from './ui/dom';
import { ShelfView } from './ui/shelf';

const stage = new Stage($('c') as HTMLCanvasElement);
const snap = new Snapshot();
let session: Session | null = null;

const shelf = new ShelfView(stage, snap, (def) => openScene(def));
/** Fade to paper, swap views, fade back. */
function through(swap: () => void) {
  const f = $('fade');
  if (f.classList.contains('show')) { swap(); requestAnimationFrame(() => f.classList.remove('show')); return; }
  f.classList.add('show');
  setTimeout(() => { swap(); requestAnimationFrame(() => f.classList.remove('show')); }, 560);
}
function showShelf(fade = true) {
  const go = () => { session?.close(); session = null; $('shelf').classList.add('show'); shelf.show(SCENES); };
  fade ? through(go) : go();
}
function openScene(def: SceneDef) {
  audio(); sfx.open();
  through(() => {
    shelf.hide(); session?.close();
    session = new Session(stage, snap, def);
    $('shelf').classList.remove('show');
  });
}

function syncMute() { for (const id of ['muteBtn', 'muteBtn2']) $(id).textContent = save.muted ? '🔇' : '🔊'; }
function toggleMute() { save.muted = !save.muted; setMuted(save.muted); persist(); syncMute(); }
setMuted(save.muted); syncMute();
$('muteBtn').onclick = toggleMute; $('muteBtn2').onclick = toggleMute;
$('backBtn').onclick = () => { sfx.back(); showShelf(); };
$('shelfBtn').onclick = () => { sfx.back(); showShelf(); };
$('duskBtn').onclick = () => session?.toggleEvening();
$('againBtn').onclick = () => {
  if (!session) return;
  const def = session.def, st = sceneSave(def.id);
  st.placed = []; st.done = false; persist();
  openScene(def);
};
if (location.hash.includes('auto')) { $('autoBtn').hidden = false; $('autoBtn').onclick = () => session?.runAuto(); }

let last = performance.now(), time = 0;
stage.renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt;
  if (session) session.update(dt, time); else shelf.update(dt, time);
  stage.render(dt);
  document.body.classList.toggle('evening', (session ? session.ctx.evening : shelf.evening) > 0.5);
});

showShelf(false);
const dev = { stage, get session() { return session; }, open: (id: string) => { const d = SCENES.find((s) => s.id === id); if (d) openScene(d); }, auto: () => session?.runAuto() };
(window as unknown as { __hk: typeof dev }).__hk = dev;

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
