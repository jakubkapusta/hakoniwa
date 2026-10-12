// DOM helpers shared by the shelf and the session.
export const $ = (id: string) => document.getElementById(id) as HTMLElement;

let toastTimer = 0;
export function toast(s: string) {
  const el = $('toast');
  el.textContent = s; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 1600);
}
