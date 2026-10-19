import type { RGB } from './biomes';
import { clamp, mix, rgba } from './scenery';

type Ctx = CanvasRenderingContext2D;

// Balon udara besar yang melayang pelan — naga bisa memantul di atasnya (Pantulan Balon)
export interface Balloon { x: number; y: number; r: number; vx: number; ph: number; c1: RGB; c2: RGB; sq: number; sqT: number; cd: number; burn: number }

const COLS: [RGB, RGB][] = [
  [[232, 72, 58], [255, 236, 204]],
  [[46, 150, 160], [250, 240, 222]],
  [[242, 180, 60], [140, 40, 62]],
  [[245, 150, 182], [255, 248, 250]],
  [[42, 62, 122], [242, 196, 92]],
  [[255, 140, 62], [255, 222, 112]],
  [[132, 92, 202], [232, 212, 255]],
  [[62, 160, 112], [250, 236, 192]],
];

export function makeBalloon(x: number, y: number, r: number): Balloon {
  const [c1, c2] = COLS[Math.floor(Math.random() * COLS.length)];
  return { x, y, r, vx: -7 + Math.random() * 16, ph: Math.random() * 6.28, c1, c2, sq: 0, sqT: 0, cd: 0, burn: Math.random() * 3 };
}

export function balloonBob(b: Balloon, t: number) { return Math.sin(t * 0.8 + b.ph) * 4; }

// setengah lebar amplop pada ketinggian lokal y (puncak −r, mulut +1.05r)
function hw(y: number, r: number) {
  const yt = -r, ym = -0.1 * r, yb = 1.05 * r;
  if (y <= ym) { const u = (y - ym) / (ym - yt); return r * Math.sqrt(Math.max(0, 1 - u * u)); }
  const v = clamp((y - ym) / (yb - ym), 0, 1);
  return r * (0.24 + 0.76 * Math.pow(Math.cos((v * Math.PI) / 2), 1.15));
}

function envelopePath(ctx: Ctx, r: number) {
  const n = 22;
  ctx.beginPath();
  for (let k = 0; k <= n; k++) { const y = -r + (2.05 * r * k) / n; const x = hw(y, r); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  for (let k = n; k >= 0; k--) { const y = -r + (2.05 * r * k) / n; ctx.lineTo(-hw(y, r), y); }
  ctx.closePath();
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, rr: number) {
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawBalloon(ctx: Ctx, b: Balloon, t: number, night: number) {
  const r = b.r;
  const sq = b.sq * Math.cos(b.sqT * 16); // goyangan pegas setelah dipantuli
  ctx.save();
  ctx.translate(b.x, b.y + balloonBob(b, t));
  ctx.rotate(Math.sin(t * 0.6 + b.ph) * 0.035);
  ctx.scale(1 + 0.15 * sq, 1 - 0.15 * sq);
  // tali
  ctx.strokeStyle = 'rgba(70,46,34,0.8)';
  ctx.lineWidth = Math.max(0.7, r * 0.012);
  ctx.beginPath();
  for (const k of [-0.23, -0.08, 0.08, 0.23]) { ctx.moveTo(k * r, 1.08 * r); ctx.lineTo(k * 0.62 * r, 1.42 * r); }
  ctx.stroke();
  // keranjang anyaman
  ctx.fillStyle = '#7a4c2c';
  roundRect(ctx, -0.16 * r, 1.42 * r, 0.32 * r, 0.2 * r, 0.035 * r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,22,12,0.5)';
  ctx.lineWidth = Math.max(0.5, r * 0.008);
  ctx.beginPath();
  for (let k = 1; k < 4; k++) { const yy = 1.42 * r + k * 0.05 * r; ctx.moveTo(-0.16 * r, yy); ctx.lineTo(0.16 * r, yy); }
  ctx.stroke();
  ctx.fillStyle = '#5a341c';
  ctx.fillRect(-0.18 * r, 1.4 * r, 0.36 * r, 0.04 * r);
  // api pembakar yang menyala sesekali
  const fire = 0.5 + 0.5 * Math.sin(t * 9 + b.burn) * Math.sin(t * 2.1 + b.burn * 2);
  if (fire > 0.35) {
    const fl = (fire - 0.35) / 0.65;
    const gfl = ctx.createRadialGradient(0, 1.2 * r, 0, 0, 1.2 * r, 0.24 * r);
    gfl.addColorStop(0, `rgba(255,236,170,${0.9 * fl})`);
    gfl.addColorStop(0.5, `rgba(255,150,60,${0.6 * fl})`);
    gfl.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = gfl;
    ctx.beginPath(); ctx.arc(0, 1.2 * r, 0.24 * r, 0, Math.PI * 2); ctx.fill();
  }
  // amplop bergaris (gore) — garis menyempit di tepi → kesan bulat 3D
  envelopePath(ctx, r);
  ctx.save();
  ctx.clip();
  const G = 8, n = 14;
  for (let k = 0; k < G; k++) {
    const s0 = Math.sin(-Math.PI / 2 + (k / G) * Math.PI), s1 = Math.sin(-Math.PI / 2 + ((k + 1) / G) * Math.PI);
    ctx.fillStyle = rgba(k % 2 ? b.c2 : b.c1);
    ctx.beginPath();
    for (let j = 0; j <= n; j++) { const y = -r + (2.05 * r * j) / n; const x = s0 * hw(y, r) - 0.5; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    for (let j = n; j >= 0; j--) { const y = -r + (2.05 * r * j) / n; ctx.lineTo(s1 * hw(y, r) + 0.5, y); }
    ctx.closePath();
    ctx.fill();
  }
  // pita hias
  ctx.fillStyle = rgba(mix(b.c1, [40, 20, 24], 0.3));
  ctx.fillRect(-1.1 * r, 0.46 * r, 2.2 * r, 0.08 * r);
  ctx.fillStyle = rgba(mix(b.c2, [255, 255, 255], 0.3), 0.85);
  for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.arc(k * 0.15 * r, 0.5 * r, 0.025 * r, 0, Math.PI * 2); ctx.fill(); }
  // sorot cahaya & sisi bayangan
  const hl = ctx.createRadialGradient(-0.4 * r, -0.5 * r, 0, -0.2 * r, -0.25 * r, 1.25 * r);
  hl.addColorStop(0, 'rgba(255,255,255,0.45)');
  hl.addColorStop(0.45, 'rgba(255,255,255,0.08)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(-1.2 * r, -1.1 * r, 2.4 * r, 2.3 * r);
  const sh = ctx.createLinearGradient(-r, 0, r, 0);
  sh.addColorStop(0, 'rgba(20,10,30,0)');
  sh.addColorStop(0.55, 'rgba(20,10,30,0.06)');
  sh.addColorStop(1, 'rgba(20,10,30,0.34)');
  ctx.fillStyle = sh;
  ctx.fillRect(-1.2 * r, -1.1 * r, 2.4 * r, 2.3 * r);
  // malam: amplop bercahaya hangat dari dalam
  if (night > 0.15) {
    const ig = ctx.createRadialGradient(0, 0.95 * r, 0, 0, 0.5 * r, 1.3 * r);
    ig.addColorStop(0, `rgba(255,170,80,${0.5 * night * (0.55 + 0.45 * fire)})`);
    ig.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = ig;
    ctx.fillRect(-1.2 * r, -1.1 * r, 2.4 * r, 2.3 * r);
  }
  ctx.restore();
  // mulut amplop
  ctx.fillStyle = rgba(mix(b.c1, [30, 14, 18], 0.45));
  ctx.beginPath();
  ctx.moveTo(-0.25 * r, 1.0 * r); ctx.lineTo(0.25 * r, 1.0 * r); ctx.lineTo(0.2 * r, 1.12 * r); ctx.lineTo(-0.2 * r, 1.12 * r);
  ctx.closePath();
  ctx.fill();
  envelopePath(ctx, r);
  ctx.strokeStyle = 'rgba(40,20,30,0.28)';
  ctx.lineWidth = Math.max(0.8, r * 0.014);
  ctx.stroke();
  ctx.restore();
}

// siluet balon di kejauhan (latar)
export function balloonSilhouette(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  envelopePath(ctx, r);
  ctx.fill();
  ctx.fillRect(-0.15 * r, 1.38 * r, 0.3 * r, 0.2 * r);
  ctx.strokeStyle = fill;
  ctx.lineWidth = Math.max(0.5, r * 0.04);
  ctx.beginPath();
  ctx.moveTo(-0.22 * r, 1.05 * r); ctx.lineTo(-0.12 * r, 1.4 * r);
  ctx.moveTo(0.22 * r, 1.05 * r); ctx.lineTo(0.12 * r, 1.4 * r);
  ctx.stroke();
  ctx.restore();
}
