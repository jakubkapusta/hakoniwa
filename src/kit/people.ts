// Shared outlines and faces for the cardboard people (newer scenes; the first six keep their own copies).
import { dab, soft, type Ctx, type Pen } from '../core/paint';

/** A standing figure in a robe: body widening to the hem, round head. Height h, half-width w at the hem. */
export function figure(h: number, w: number) {
  return (p: Pen) => {
    p.moveTo(-w, 0); p.lineTo(w, 0); p.lineTo(w * 0.8, h * 0.6); p.bezierCurveTo(w * 1.0, h * 0.72, w * 0.9, h * 0.8, w * 0.5, h * 0.8);
    p.bezierCurveTo(w * 0.85, h * 0.86, w * 0.8, h * 1.02, 0, h * 1.02); p.bezierCurveTo(-w * 0.8, h * 1.02, -w * 0.85, h * 0.86, -w * 0.5, h * 0.8);
    p.bezierCurveTo(-w * 0.9, h * 0.8, -w * 1.0, h * 0.72, -w * 0.8, h * 0.6); p.closePath();
  };
}
/** A person sitting on a bench edge, seen from the front: shins down to y = 0, lap at y ≈ 0.24–0.3. */
export function seatedOutline(p: Pen) {
  p.moveTo(-0.1, 0); p.lineTo(0.1, 0); p.lineTo(0.13, 0.22); p.lineTo(0.21, 0.24); p.lineTo(0.21, 0.3);
  p.bezierCurveTo(0.2, 0.42, 0.19, 0.5, 0.1, 0.53); p.bezierCurveTo(0.12, 0.6, 0.1, 0.7, 0, 0.7); p.bezierCurveTo(-0.1, 0.7, -0.12, 0.6, -0.1, 0.53);
  p.bezierCurveTo(-0.19, 0.5, -0.2, 0.42, -0.21, 0.3); p.lineTo(-0.21, 0.24); p.lineTo(-0.13, 0.22); p.closePath();
}
/** Eyes (closed, smiling arcs or open dots) and blush, for a head of radius r centred at (0, y). */
export function face(c: Ctx, y: number, r: number, closed = true) {
  c.lineCap = 'round'; c.strokeStyle = '#2a2420'; c.lineWidth = r * 0.12;
  [-r * 0.38, r * 0.38].forEach((x) => { if (closed) { c.beginPath(); c.arc(x, y + r * 0.05, r * 0.16, 0.3, Math.PI - 0.3); c.stroke(); } else dab(c, x, y, r * 0.09, '#2a201a'); });
  soft(c, -r * 0.6, y - r * 0.25, r * 0.22, '#f08a7a', 0.6); soft(c, r * 0.6, y - r * 0.25, r * 0.22, '#f08a7a', 0.6);
}
