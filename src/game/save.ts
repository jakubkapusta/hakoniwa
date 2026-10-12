// Progress in localStorage: which pieces of which scene are placed, finished scenes, found secrets.
export interface SceneSave { placed: string[]; done: boolean; secret: boolean }
export interface SaveData { v: 1; scenes: Record<string, SceneSave>; muted: boolean; hinted: boolean }

const KEY = 'hakoniwa.v1';
const fresh = (): SaveData => ({ v: 1, scenes: {}, muted: false, hinted: false });

export const save: SaveData = (() => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d && d.v === 1) return { ...fresh(), ...d };
  } catch { /* private mode or broken data */ }
  return fresh();
})();

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* storage unavailable: progress lives for this visit only */ }
}
export function sceneSave(id: string): SceneSave {
  return (save.scenes[id] ??= { placed: [], done: false, secret: false });
}
