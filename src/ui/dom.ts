// DOM helpers shared by the shelf and the session.
export const $ = (id: string) => document.getElementById(id) as HTMLElement;

let toastTimer = 0;
export function toast(s: string) {
  const el = $('toast');
  el.textContent = s; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 1600);
}

// Ink-line icons (instead of emoji, which look like a phone's UI rather than a paper kit).
const svg = (d: string) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const ICON = {
  sound: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9c1.2 1.6 1.2 4.4 0 6"/><path d="M18.3 6.5c2.4 3 2.4 8 0 11"/>'),
  mute: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
  moon: svg('<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>'),
  back: svg('<path d="M14.5 6l-6 6 6 6"/>'),
  again: svg('<path d="M5 12a7 7 0 1 0 2.1-5"/><path d="M5 4.5V8h3.5"/>'),
  play: svg('<path d="M8 5.5l10 6.5-10 6.5z"/>'),
};
/** The day/evening toggle shows where a tap takes you. */
export const timeLabel = (evening: boolean) => (evening ? `${ICON.sun}<span>Dzień</span>` : `${ICON.moon}<span>Wieczór</span>`);
