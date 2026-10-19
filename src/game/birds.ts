// Burung-burung indah: bangau (formasi V), walet (lincah), merpati putih bercahaya (langit tinggi)
export type BirdType = 'bangau' | 'walet' | 'merpati';
export interface Bird { ox: number; oy: number; px: number; py: number; ph: number; s: number; rate: number; seed: number }
export interface Flock { x: number; y: number; vx: number; type: BirdType; birds: Bird[]; t: number; met: boolean; react: number }

const SPEED: Record<BirdType, number> = { bangau: 120, walet: 200, merpati: 150 };
const FLAP: Record<BirdType, number> = { bangau: 1.35, walet: 4.4, merpati: 2.4 };

export function makeFlock(x: number, y: number, type: BirdType): Flock {
  const birds: Bird[] = [];
  const n = type === 'walet' ? 7 + Math.floor(Math.random() * 5) : type === 'bangau' ? 5 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    let ox: number, oy: number;
    if (type === 'bangau') {
      const k = Math.ceil(i / 2), side = i % 2 ? -1 : 1;
      ox = -k * 34; oy = side * k * 19;
    } else if (type === 'merpati') {
      ox = -i * 30 + (Math.random() - 0.5) * 14; oy = (Math.random() - 0.5) * 50;
    } else {
      ox = (Math.random() - 0.5) * 140; oy = (Math.random() - 0.5) * 70;
    }
    birds.push({
      ox, oy, px: 0, py: 0, ph: Math.random() * 6.28, rate: 0.88 + Math.random() * 0.24, seed: Math.random() * 100,
      s: (type === 'bangau' ? 1.45 : type === 'merpati' ? 1.15 : 0.95) * (0.88 + Math.random() * 0.24),
    });
  }
  return { x, y, vx: SPEED[type] * (0.9 + Math.random() * 0.2), type, birds, t: 0, met: false, react: 0 };
}

export function birdPos(f: Flock, b: Bird) {
  let x = f.x + b.ox + b.px, y = f.y + b.oy + b.py + Math.sin(f.t * 0.9 + b.seed) * 3;
  if (f.type === 'walet') { x += Math.sin(f.t * 1.3 + b.seed) * 14; y += Math.cos(f.t * 1.7 + b.seed * 1.3) * 9; }
  return { x, y };
}

// mengembalikan true saat naga pertama kali terbang bersama kawanan ini
export function updateFlock(f: Flock, dt: number, hx: number, hy: number): boolean {
  f.t += dt;
  f.x += f.vx * dt;
  f.y += Math.sin(f.t * 0.45) * 7 * dt;
  f.react = Math.max(0, f.react - dt * 0.5);
  let metNow = false;
  for (const b of f.birds) {
    const p = birdPos(f, b);
    const dx = p.x - hx, dy = p.y - hy, d = Math.hypot(dx, dy);
    if (d < 95) {
      const k = (95 - d) / 95, l = d || 1;
      b.px += (dx / l) * k * 170 * dt;
      b.py += ((dy / l) * 0.7 - 0.6) * k * 170 * dt;
      if (!f.met) { f.met = true; metNow = true; f.react = 1; }
    }
    b.px *= 1 - dt * 0.45;
    b.py *= 1 - dt * 0.45;
    b.ph += dt * Math.PI * 2 * FLAP[f.type] * b.rate * (1 + f.react * 1.3);
  }
  return metNow;
}

// ---------------- MENGGAMBAR ----------------
function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, r = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, r, 0, Math.PI * 2); ctx.fill(); }
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function poly(ctx: CanvasRenderingContext2D, p: number[]) {
  ctx.beginPath(); ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  ctx.closePath(); ctx.fill();
}

// sayap tampak samping: w = sin(fase) → +1 di atas, −1 di bawah
function wing(ctx: CanvasRenderingContext2D, w: number, span: number, sweep: number, broad: number, col: string, tip?: string) {
  const ty = -span * w, tx = -sweep - Math.abs(w) * 1.5;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(broad * 0.5, -0.8);
  ctx.quadraticCurveTo(broad * 0.45, ty * 0.6, tx + 1, ty);
  ctx.quadraticCurveTo(-broad * 0.55, ty * 0.75, -broad * 0.6, -0.6);
  ctx.closePath(); ctx.fill();
  if (tip) {
    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.moveTo(tx + 1, ty);
    ctx.lineTo(tx + broad * 0.32, ty * 0.66);
    ctx.lineTo(tx - broad * 0.32, ty * 0.7);
    ctx.closePath(); ctx.fill();
  }
}

function crane(ctx: CanvasRenderingContext2D, ph: number, glide: number) {
  const w = Math.sin(ph) * glide + (1 - glide) * 0.15;
  wing(ctx, w * 0.92, 15, 2, 9, '#c9d0dc', '#2a2a34');
  ctx.strokeStyle = '#3a3a46'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-5, 0.8); ctx.lineTo(-15.5, 2); ctx.stroke();
  ctx.fillStyle = '#fbfbfd'; ell(ctx, 0, 0, 7.6, 2.7);
  ctx.fillStyle = '#2a2a34'; poly(ctx, [-6.4, -1.2, -10, 0.2, -6.4, 1.6]);
  ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(5.5, -0.8); ctx.quadraticCurveTo(9, -1.2, 12.5, -1.8); ctx.stroke();
  ctx.fillStyle = '#fbfbfd'; dot(ctx, 13.4, -1.9, 1.75);
  ctx.fillStyle = '#e2483a'; dot(ctx, 13.5, -3.2, 0.85);
  ctx.strokeStyle = '#cdb27a'; ctx.lineWidth = 0.85;
  ctx.beginPath(); ctx.moveTo(14.9, -1.7); ctx.lineTo(18.6, -1.2); ctx.stroke();
  ctx.fillStyle = '#1a1a22'; dot(ctx, 13.9, -2.1, 0.35);
  wing(ctx, w, 16, 1, 10, '#ffffff', '#2a2a34');
}

function swallow(ctx: CanvasRenderingContext2D, ph: number) {
  const w = Math.sin(ph);
  wing(ctx, w * 0.9, 9, 5, 4, '#2a3150');
  ctx.fillStyle = '#26304e';
  poly(ctx, [-3.2, -0.6, -11, -2.8, -5, 0]);
  poly(ctx, [-3.2, 0.6, -11, 2.6, -5, 0]);
  ell(ctx, 0, 0, 4.4, 1.6);
  ctx.fillStyle = '#f4efe6'; ell(ctx, 0.6, 0.75, 3, 0.75);
  ctx.fillStyle = '#26304e'; dot(ctx, 3.8, -0.3, 1.35);
  ctx.fillStyle = '#c8553d'; dot(ctx, 4.5, 0.45, 0.65);
  wing(ctx, w, 10, 5.5, 4.4, '#1e2642');
}

function dove(ctx: CanvasRenderingContext2D, ph: number, t: number, seed: number) {
  const w = Math.sin(ph);
  const g = ctx.createRadialGradient(0, -1, 0, 0, -1, 16);
  g.addColorStop(0, `rgba(255,250,235,${0.32 + 0.12 * Math.sin(t * 3 + seed)})`);
  g.addColorStop(1, 'rgba(255,250,235,0)');
  ctx.fillStyle = g; dot(ctx, 0, -1, 16);
  wing(ctx, w * 0.9, 12, 1.5, 9, '#e4e6f0');
  ctx.fillStyle = '#f0f1f6'; poly(ctx, [-4, -1.2, -9.5, -2.6, -9.5, 2.2, -4, 1.2]);
  ctx.fillStyle = '#ffffff'; ell(ctx, 0, 0, 5.4, 2.5);
  dot(ctx, 4.9, -1.3, 1.95);
  ctx.fillStyle = '#f0a050'; poly(ctx, [6.6, -1.5, 8.6, -1, 6.6, -0.6]);
  ctx.fillStyle = '#2a2230'; dot(ctx, 5.4, -1.7, 0.4);
  wing(ctx, w, 13, 1, 10, '#ffffff');
  ctx.strokeStyle = 'rgba(190,196,214,0.7)'; ctx.lineWidth = 0.4;
  for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(-1 + k * 1.6, -0.8); ctx.lineTo(-2 + k * 1.2, -13 * w * (0.4 + k * 0.12)); ctx.stroke(); }
}

export function drawFlock(ctx: CanvasRenderingContext2D, f: Flock, t: number) {
  for (const b of f.birds) {
    const p = birdPos(f, b);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(b.s, b.s);
    if (f.type === 'bangau') {
      const glide = f.react > 0.2 ? 1 : 0.35 + 0.65 * Math.max(0, Math.sin(t * 0.35 + b.seed));
      crane(ctx, b.ph, glide);
    } else if (f.type === 'walet') swallow(ctx, b.ph);
    else dove(ctx, b.ph, t, b.seed);
    ctx.restore();
  }
}

// siluet burung kecil di kejauhan (ruang layar)
export function farBird(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, ph: number, col: string) {
  const w = Math.sin(ph) * 0.8;
  ctx.strokeStyle = col; ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x - 5 * s, y - 3 * s * w);
  ctx.quadraticCurveTo(x - 2 * s, y - 2.6 * s * w, x, y);
  ctx.quadraticCurveTo(x + 2 * s, y - 2.6 * s * w, x + 5 * s, y - 3 * s * w);
  ctx.stroke();
}
