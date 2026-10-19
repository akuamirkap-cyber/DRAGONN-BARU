import type { RGB } from './biomes';
import { W, H, clamp, lerp, smooth, mix, rgba, hash, type Pal } from './scenery';

type Ctx = CanvasRenderingContext2D;

// ================= KONFIGURASI DUNIA VERTIKAL =================
// Gua: segmen lorong bawah tanah 5× lebih panjang (~28.000px, 2× lebih tinggi ~960px).
// Tanpa duri menggantung di langit-langit, tanpa anomali balok kotak hitam di pintu masuk.
export const CAVE_START = 4500;    // lorong gua pertama dimulai (~12 dtk terbang)
export const CAVE_LEN = 28000;     // panjang lorong gua (5× dari semula, teratur & pas)
export const CAVE_EVERY = 54000;   // siklus gua berikutnya
export const CAVE_FADE = 1800;     // zona transisi spasial yang mulus
export const CAVE_H = 960;         // tinggi lorong (tanah → langit-langit: 2× lebih tinggi, lapang & rapi)
export const HEAVEN_A0 = 1500;     // surga mulai terlihat di langit tinggi
export const HEAVEN_A1 = 2500;     // surga penuh di atas awan

// ================= PROFIL KEDALAMAN TANAH GUA =================
// Lereng ngarai menurun mulus & alami menuju pintu masuk gua (2400px turunan landai),
// terjaga dalam di bawah tanah tanpa patahan ekstrem, lalu menanjak kembali ke permukaan saat keluar.
export function caveGroundOffset(x: number): number {
  const leadIn = 2400;   // lereng turun landai & megah 2400px menuju mulut gua
  const leadOut = 2400;  // lereng naik landai & megah 2400px keluar mulut gua
  const maxDepth = 380;  // kedalaman ngarai bawah tanah yang lapang & nyaman

  // Sebelum gua pertama sama sekali
  if (x < CAVE_START - leadIn) return 0;

  // Mendekati mulut gua pertama (turunan mulus tanpa patahan)
  if (x < CAVE_START) {
    const u = (x - (CAVE_START - leadIn)) / leadIn;
    return smooth(clamp(u, 0, 1)) * maxDepth;
  }

  // Siklus gua (berulang per CAVE_EVERY)
  const rel = x - CAVE_START;
  const m = ((rel % CAVE_EVERY) + CAVE_EVERY) % CAVE_EVERY;

  // Di dalam lorong gua (0 s/d CAVE_LEN)
  if (m <= CAVE_LEN) {
    let depthFactor = 1;
    // Mendekati pintu keluar (CAVE_LEN - leadOut s/d CAVE_LEN)
    if (m > CAVE_LEN - leadOut) {
      depthFactor = smooth((CAVE_LEN - m) / leadOut);
    }
    // Riak alami lantai gua yang lembut (faded out di mulut masuk & keluar agar tersambung sempurna)
    const blendIn = smooth(clamp(m / leadIn, 0, 1));
    const blendOut = smooth(clamp((CAVE_LEN - m) / leadOut, 0, 1));
    const ripple = (Math.sin(x * 0.0032) * 26 + Math.sin(x * 0.0075 + 1.2) * 12) * blendIn * blendOut;

    return depthFactor * maxDepth + ripple;
  }

  // Di luar gua, mendekati siklus berikutnya
  const distToNext = CAVE_EVERY - m;
  if (distToNext <= leadIn) {
    const u = (leadIn - distToNext) / leadIn;
    return smooth(clamp(u, 0, 1)) * maxDepth;
  }

  return 0;
}

export function caveInfo(x: number): { amt: number; idx: number } {
  const rel = x - CAVE_START;
  if (rel < 0) return { amt: 0, idx: -1 };
  const m = ((rel % CAVE_EVERY) + CAVE_EVERY) % CAVE_EVERY;
  const idx = Math.floor(rel / CAVE_EVERY);
  if (m < 0 || m > CAVE_LEN) return { amt: 0, idx };
  return { amt: smooth(clamp(Math.min(m / CAVE_FADE, (CAVE_LEN - m) / CAVE_FADE), 0, 1)), idx };
}

// Langit-langit gua (koordinat dunia). Plafon 960px di atas tanah (lapang, bersih tanpa duri).
export function caveCeilY(g: number, x: number): number {
  const amt = caveInfo(x).amt;
  if (amt <= 0) return g - 3000;
  return g - lerp(3000, CAVE_H, amt) + (Math.sin(x * 0.004) * 16 + Math.sin(x * 0.012 + 1.5) * 8) * amt;
}

export function heavenAmt(altS: number): number {
  return smooth(clamp((altS - HEAVEN_A0) / (HEAVEN_A1 - HEAVEN_A0), 0, 1));
}

// 4 Zona Spektakuler di sepanjang perjalanan 28.000px di dalam gua
export interface CaveZoneData {
  zone: number;
  name: string;
  sub: string;
  crystalRGB: RGB;
  crystalGlow: string;
  lightRay: string;
}

export function caveZone(x: number): CaveZoneData {
  const rel = x - CAVE_START;
  const m = ((rel % CAVE_EVERY) + CAVE_EVERY) % CAVE_EVERY;
  const p = clamp(m / CAVE_LEN, 0, 1);

  if (p < 0.25) {
    return {
      zone: 0,
      name: 'Lembah Safir Bawah Tanah',
      sub: 'SAPPHIRE CAVERN · 藍晶洞窟',
      crystalRGB: [70, 190, 255],
      crystalGlow: 'rgba(70,190,255,',
      lightRay: 'rgba(160,225,255,',
    };
  } else if (p < 0.5) {
    return {
      zone: 1,
      name: 'Katedral Kristal Ametis',
      sub: 'AMETHYST CATHEDRAL · 紫晶大堂',
      crystalRGB: [200, 115, 255],
      crystalGlow: 'rgba(200,115,255,',
      lightRay: 'rgba(235,185,255,',
    };
  } else if (p < 0.75) {
    return {
      zone: 2,
      name: 'Hutan Jamur Zamrud Berpendar',
      sub: 'EMERALD BIOLUMINESCENT GROVE · 翠綠菌林',
      crystalRGB: [60, 235, 160],
      crystalGlow: 'rgba(60,235,160,',
      lightRay: 'rgba(180,255,220,',
    };
  } else {
    return {
      zone: 3,
      name: 'Aula Emas Menuju Cakrawala',
      sub: 'GOLDEN HALL TO SUNLIGHT · 金光曙門',
      crystalRGB: [255, 210, 85],
      crystalGlow: 'rgba(255,210,85,',
      lightRay: 'rgba(255,240,185,',
    };
  }
}

// ================= PALET =================
const CAVE = {
  skyTop: [16, 14, 28] as RGB, skyBot: [35, 38, 58] as RGB, fog: [46, 52, 75] as RGB,
  far: [38, 41, 60] as RGB, mid: [28, 30, 46] as RGB, near: [20, 20, 34] as RGB,
  groundTop: [88, 80, 106] as RGB, ground: [44, 38, 56] as RGB,
  rock: [36, 32, 48] as RGB, rockLight: [72, 68, 94] as RGB,
};
const HEAVEN = {
  skyTop: [120, 140, 255] as RGB, skyBot: [255, 190, 216] as RGB, fog: [255, 224, 238] as RGB,
  far: [192, 166, 255] as RGB, mid: [255, 178, 216] as RGB, near: [255, 206, 178] as RGB,
  groundTop: [255, 240, 230] as RGB, ground: [230, 190, 220] as RGB,
  rock: [150, 140, 200] as RGB, rockLight: [210, 200, 240] as RGB,
  sun: [255, 244, 214] as RGB,
};

export function applyRealmTints(p: Pal, caveK: number, heavenK: number) {
  if (caveK > 0.01) {
    const k = clamp(caveK, 0, 1) * 0.7;
    p.skyTop = mix(p.skyTop, CAVE.skyTop, k);
    p.skyBot = mix(p.skyBot, CAVE.skyBot, k);
    p.fog = mix(p.fog, CAVE.fog, k * 0.7);
    p.far = mix(p.far, CAVE.far, k);
    p.mid = mix(p.mid, CAVE.mid, k);
    p.near = mix(p.near, CAVE.near, k);
    p.groundTop = mix(p.groundTop, CAVE.groundTop, k * 0.75);
    p.ground = mix(p.ground, CAVE.ground, k * 0.75);
    p.rock = mix(p.rock, CAVE.rock, k);
    p.rockLight = mix(p.rockLight, CAVE.rockLight, k);
    p.sunA *= 1 - k * 0.85;
    p.moonA *= 1 - k * 0.5;
    p.star = lerp(p.star, 0.15, k);
  }
  if (heavenK > 0.01) {
    const k = clamp(heavenK, 0, 1) * 0.7;
    p.skyTop = mix(p.skyTop, HEAVEN.skyTop, k);
    p.skyBot = mix(p.skyBot, HEAVEN.skyBot, k);
    p.fog = mix(p.fog, HEAVEN.fog, k * 0.65);
    p.far = mix(p.far, HEAVEN.far, k * 0.75);
    p.mid = mix(p.mid, HEAVEN.mid, k * 0.75);
    p.near = mix(p.near, HEAVEN.near, k * 0.75);
    p.groundTop = mix(p.groundTop, HEAVEN.groundTop, k * 0.65);
    p.ground = mix(p.ground, HEAVEN.ground, k * 0.65);
    p.rock = mix(p.rock, HEAVEN.rock, k * 0.7);
    p.rockLight = mix(p.rockLight, HEAVEN.rockLight, k * 0.7);
    p.sun = mix(p.sun, HEAVEN.sun, k);
    p.sunA = Math.max(p.sunA, k);
    p.star = lerp(p.star, 0.35, k);
    p.aurora = Math.max(p.aurora, k * 0.35);
  }
}

// ================= LATAR GUA RAPI & TEROPTIMASI =================
export function drawCaveBackdrop(ctx: Ctx, t: number, camX: number, zoom: number) {
  const colAmt = (sx: number) => caveInfo(camX + sx / zoom).amt;
  const midAmt = colAmt(W * 0.5);
  if (midAmt < 0.05) return;

  const currentZone = caveZone(camX + (W * 0.5) / zoom);

  // 1. Berkas Sinar Cahaya Mistis (God Rays)
  for (let k = 0; k < 3; k++) {
    const bx = (((k * 360 + 140 - camX * 0.035 + t * 4) % (W + 500) + W + 500) % (W + 500)) - 250;
    const a = colAmt(bx + 100);
    if (a < 0.2) continue;
    
    const rayWidth = 80 + (k % 2) * 40;
    ctx.fillStyle = currentZone.lightRay + `${0.08 * a})`;
    ctx.beginPath();
    ctx.moveTo(bx, -20);
    ctx.lineTo(bx + rayWidth, -20);
    ctx.lineTo(bx + rayWidth + 200, H);
    ctx.lineTo(bx + 200, H);
    ctx.closePath();
    ctx.fill();
  }

  // 2. Formasi Geode Kristal di Dinding Belakang
  const span = 520, off = camX * 0.06;
  const i0 = Math.floor((off - 260) / span), i1 = Math.floor((off + W + 260) / span);
  for (let i = i0; i <= i1; i++) {
    if (hash(i * 3.7 + 1.1) < 0.25) continue;
    const x = i * span - off + (hash(i * 7.9) - 0.5) * 140;
    if (x < -180 || x > W + 180) continue;
    const a = colAmt(clamp(x, 0, W));
    if (a < 0.2) continue;

    const zData = caveZone(camX + x / zoom);
    const grow = smooth(clamp((a - 0.2) / 0.5, 0, 1));
    const y = H * (0.22 + hash(i * 5.3) * 0.32);
    const rw = (75 + hash(i * 9.1) * 90) * (0.4 + 0.6 * grow);
    const rh = (55 + hash(i * 4.3) * 75) * (0.4 + 0.6 * grow);
    const pulse = 0.85 + 0.15 * Math.sin(t * 1.8 + i);

    ctx.fillStyle = zData.crystalGlow + `${0.22 * grow * pulse})`;
    ctx.beginPath();
    ctx.arc(x, y, rw * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = zData.crystalGlow + `${0.45 * grow * pulse})`;
    ctx.beginPath();
    ctx.arc(x, y, rw * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Kristal bersegi
    const shardCount = 4;
    for (let s = 0; s < shardCount; s++) {
      const sa = (s / shardCount) * Math.PI * 2 + hash(i + s) * 0.5;
      const sLen = rh * (0.7 + hash(i * 3 + s) * 0.5);
      const sW = rw * 0.2;
      const tx = x + Math.cos(sa) * sLen;
      const ty = y + Math.sin(sa) * sLen;

      ctx.fillStyle = rgba(mix(zData.crystalRGB, [255, 255, 255], 0.35), 0.75 * grow * pulse);
      ctx.beginPath();
      ctx.moveTo(x - Math.sin(sa) * sW, y + Math.cos(sa) * sW);
      ctx.lineTo(tx, ty);
      ctx.lineTo(x + Math.sin(sa) * sW, y - Math.cos(sa) * sW);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 3. Air Terjun Latar Belakang Berpendar
  for (let k = 0; k < 2; k++) {
    const fx = (((k * 600 + 260 - camX * 0.08) % (W + 600) + W + 600) % (W + 600)) - 300;
    const a = colAmt(clamp(fx, 0, W));
    if (a < 0.25) continue;

    const zData = caveZone(camX + fx / zoom);
    const fw = 18 + hash(k * 7.7) * 12;
    const fTop = H * 0.12;
    const fBot = H * 0.85;

    ctx.fillStyle = zData.crystalGlow + `${0.4 * a})`;
    ctx.fillRect(fx - fw / 2, fTop, fw, fBot - fTop);

    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx - fw * 0.2, fTop);
    ctx.lineTo(fx - fw * 0.2, fBot);
    ctx.moveTo(fx + fw * 0.25, fTop);
    ctx.lineTo(fx + fw * 0.25, fBot);
    ctx.stroke();

    ctx.fillStyle = zData.crystalGlow + `${0.35 * a})`;
    ctx.beginPath();
    ctx.arc(fx, fBot, fw * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ================= RERUNTUHAN GUA & PILAR KUNO RAKSASA =================
export function drawCaveRuins(ctx: Ctx, t: number, camX: number, gy: number, zoom: number) {
  const par = 0.28, off = camX * par, slot = 400;
  const i0 = Math.floor((off - 350) / slot), i1 = Math.floor((off + W + 350) / slot);
  const rock = '#231d2b', rockDk = '#171420';
  const cover = (sx: number) => smooth(clamp((caveInfo(camX + clamp(sx, 0, W) / zoom).amt - 0.1) / 0.45, 0, 1));
  type Tower = { x: number; top: number; w: number };
  const towers: Tower[] = [];

  for (let i = i0; i <= i1; i++) {
    const r0 = hash(i * 11.7 + 1.2);
    if (r0 < 0.25) continue;
    const x = i * slot - off + (hash(i * 6.3) - 0.5) * 100;
    const ca = cover(x);
    if (ca < 0.02) continue;

    const zData = caveZone(camX + x / zoom);

    ctx.save();
    ctx.globalAlpha = ca;
    const s = 1.0 + hash(i * 3.1) * 0.5;
    const bh = (220 + hash(i * 4.3) * 240) * s;
    const bw = (42 + hash(i * 8.7) * 28) * s;
    const top = gy - bh;

    // Pilar batu kuno menopang gua
    ctx.fillStyle = rockDk;
    ctx.fillRect(x - bw / 2 - 4 * s, gy - 20 * s, bw + 8 * s, 20 * s + 90);
    ctx.fillStyle = rock;
    ctx.fillRect(x - bw / 2, top, bw, gy - top + 90);

    // Kepala pilar kuno
    ctx.fillStyle = '#332b40';
    ctx.fillRect(x - bw * 0.62, top - 12 * s, bw * 1.24, 12 * s);
    ctx.fillRect(x - bw * 0.52, top - 18 * s, bw * 1.04, 6 * s);

    // Kristal bercahaya di badan pilar
    const nCrystals = 2;
    for (let c = 0; c < nCrystals; c++) {
      const cy = top + 50 * s + c * 60 * s;
      if (cy > gy - 50 * s) break;
      const cx = x + (hash(i * 5.5 + c) - 0.5) * bw * 0.4;
      const fl = 0.75 + 0.25 * Math.sin(t * 2.5 + i + c * 2);

      ctx.fillStyle = zData.crystalGlow + `${0.5 * fl})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 18 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = rgba(mix(zData.crystalRGB, [255, 255, 255], 0.6), 0.95 * fl);
      ctx.beginPath();
      ctx.arc(cx, cy, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    towers.push({ x, top, w: bw });
    ctx.restore();
  }

  // Untaian lentera kuno antar pilar
  for (let i = 0; i + 1 < towers.length; i++) {
    const a = towers[i], b = towers[i + 1];
    if (b.x - a.x > 560) continue;
    const y0 = a.top + 16, y1 = b.top + 16;
    const wa = Math.min(cover(a.x), cover(b.x));
    if (wa < 0.02) continue;

    ctx.save();
    ctx.globalAlpha = wa;
    ctx.strokeStyle = 'rgba(24,18,32,0.95)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(a.x, y0);
    ctx.quadraticCurveTo((a.x + b.x) / 2, Math.max(y0, y1) + 55, b.x, y1);
    ctx.stroke();

    const nLamps = Math.floor((b.x - a.x) / 44);
    for (let k = 1; k < nLamps; k++) {
      const u = k / nLamps;
      const mx = lerp(a.x, b.x, u);
      const my = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * (Math.max(y0, y1) + 55) + u * u * y1;
      const fl = 0.7 + 0.3 * Math.sin(t * 3.2 + k * 1.5 + i);

      ctx.fillStyle = `rgba(255,210,135,${0.65 * fl})`;
      ctx.beginPath();
      ctx.arc(mx, my, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,235,175,${fl})`;
      ctx.fillRect(mx - 2.5, my - 3.5, 5, 7);
    }
    ctx.restore();
  }
}

// ================= LANGIT-LANGIT GUA MEGAH (RAPI & TANPA DURI DI ATAS) =================
export function drawCaveCeiling(
  ctx: Ctx, x0: number, x1: number, topY: number,
  ceilYat: (x: number) => number, amtAt: (x: number) => number,
  t: number, rock: RGB, rockLight: RGB, alpha: number,
) {
  if (alpha < 0.02) return;
  const step = 32;
  let run: number[] = [];

  const flush = () => {
    if (run.length < 4) { run = []; return; }
    let aMax = 0;
    for (let i = 0; i < run.length; i += 2) aMax = Math.max(aMax, amtAt(run[i]));
    const a = alpha * clamp(aMax, 0, 1);
    if (a <= 0.02) { run = []; return; }

    ctx.save();
    ctx.globalAlpha = a;
    let yEdge = -Infinity;
    for (let i = 1; i < run.length; i += 2) yEdge = Math.max(yEdge, run[i]);

    // Kubah batu atap gua yang masif, megah, dan mulus
    const g = ctx.createLinearGradient(0, topY, 0, yEdge + 60);
    g.addColorStop(0, rgba(mix(rock, [6, 5, 12], 0.85)));
    g.addColorStop(0.65, rgba(rock));
    g.addColorStop(1, rgba(mix(rock, rockLight, 0.4)));

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(run[0] - 60, topY);
    ctx.lineTo(run[0], run[1]);
    for (let i = 2; i < run.length; i += 2) {
      const mx = (run[i - 2] + run[i]) / 2, my = (run[i - 1] + run[i + 1]) / 2;
      ctx.quadraticCurveTo(run[i - 2], run[i - 1], mx, my);
    }
    ctx.lineTo(run[run.length - 2], run[run.length - 1]);
    ctx.lineTo(run[run.length - 2] + 60, topY);
    ctx.closePath();
    ctx.fill();

    // Garis rim light berkilau di sepanjang bibir langit-langit (bersih & rapi)
    const xa = run[0], xb = run[run.length - 2];
    const zData = caveZone(xa);

    ctx.strokeStyle = zData.crystalGlow + '0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(run[0], run[1]);
    for (let i = 2; i < run.length; i += 2) {
      const mx = (run[i - 2] + run[i]) / 2, my = (run[i - 1] + run[i + 1]) / 2;
      ctx.quadraticCurveTo(run[i - 2], run[i - 1], mx, my);
    }
    ctx.stroke();

    // Urat kristal & lumut berpendar yang MENEMPEL RATA di atap gua (TANPA duri menonjol)
    for (let sx = Math.floor(xa / 110) * 110; sx < xb; sx += 110) {
      if (hash(sx * 0.053 + 7.1) < 0.35) continue;
      const mx = sx + hash(sx * 0.029) * 70;
      const cy = ceilYat(mx);
      const my = cy - 6 - hash(sx * 0.041) * 18; // menempel aman di dalam batu atap
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 2.2 + sx * 0.04));

      ctx.fillStyle = zData.crystalGlow + `${0.7 * tw})`;
      ctx.beginPath();
      ctx.arc(mx, my, 2.5 + hash(sx) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Inti kilau kristal
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    run = [];
  };

  for (let x = x0 - 90; x <= x1 + 90; x += step) {
    if (amtAt(x) > 0.02) {
      run.push(x, ceilYat(x));
      if (run.length >= 26) {
        const keep = run.slice(-2);
        flush();
        run = keep;
      }
    } else flush();
  }
  flush();
}

// ================= BINGKAI DEPAN ATAP GUA (MULUS, TANPA DURI) =================
export function drawCaveFront(ctx: Ctx, t: number, camX: number, zoom: number) {
  const par = 0.16, off = camX * par;
  const colAmt = (sx: number) => smooth(clamp((caveInfo(camX + clamp(sx, 0, W) / zoom).amt - 0.1) / 0.5, 0, 1));

  // Bingkai atap atas melengkung mulus
  const lipY = (sx: number) => {
    const w = sx + off;
    return 60 + Math.sin(w * 0.006) * 10 + Math.sin(w * 0.015 + 1.2) * 6;
  };

  const cg = ctx.createLinearGradient(0, -20, 0, 120);
  cg.addColorStop(0, '#0c0a15');
  cg.addColorStop(0.7, '#181424');
  cg.addColorStop(1, '#251e34');

  let seg: number[] = [];
  const flushLip = () => {
    if (seg.length < 4) { seg = []; return; }
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(seg[0] - 15, -20);
    ctx.lineTo(seg[seg.length - 2] + 15, -20);
    ctx.lineTo(seg[seg.length - 2] + 15, seg[seg.length - 1]);
    for (let i = seg.length - 2; i >= 2; i -= 2) {
      const mx = (seg[i - 2] + seg[i]) / 2, my = (seg[i - 1] + seg[i + 1]) / 2;
      ctx.quadraticCurveTo(seg[i], seg[i + 1], mx, my);
    }
    ctx.closePath();
    ctx.fill();
    seg = [];
  };

  for (let sx = -40; sx <= W + 40; sx += 26) {
    const here = colAmt(sx), prev = colAmt(sx - 26), next = colAmt(sx + 26);
    const edge = Math.min(here, Math.max(prev, next));
    if (edge > 0.02) seg.push(sx, lerp(-30, lipY(sx), edge));
    else flushLip();
  }
  flushLip();

  // Partikel spora lembut melayang di udara (bersih & tenang)
  const zData = caveZone(camX + (W * 0.5) / zoom);
  for (let i = 0; i < 16; i++) {
    const spanX = W + 100, spanY = H + 100;
    const mx = (((hash(i * 7.1) * spanX + t * (8 + hash(i) * 10) * (i % 2 ? 1 : -1)) % spanX) + spanX) % spanX - 50;
    const a = colAmt(mx);
    if (a < 0.08) continue;
    const my = (((hash(i * 3.7 + 5) * spanY + t * 6) % spanY) + spanY) % spanY - 50;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.6 + i * 2.1));

    ctx.fillStyle = zData.crystalGlow + `${0.45 * tw * a})`;
    ctx.beginPath();
    ctx.arc(mx, my, 1.2 + hash(i * 5.1) * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ================= GERBANG PINTU MASUK GUA ALAMI (TANPA ANOMALI KOTAK HITAM DI LANGIT) =================
// Menghilangkan kotak hitam terapung di langit (Gambar 2).
// Gerbang kini berdiri di atas tanah secara alami dengan 2 pilar batu berukir & lentera penjaga,
// menyatu sempurna dengan turunan ngarai dan atap langit-langit gunung.
// ================= GERBANG PINTU MASUK GUA ALAMI & JALAN NGARAI MEWAH =================
// Menghilangkan anomali visual. Jalan masuk berlantai batu tersusun rapi mengikuti kontur lereng,
// diapit pilar gerbang megalit kuno yang menancap kokoh di tanah, lentera batu bercahaya hangat,
// dan sorotan berkas cahaya matahari yang menembus ke dalam mulut ngarai.
export function drawCaveMouths(ctx: Ctx, x0: number, x1: number, groundYat: (x: number) => number, t: number) {
  const segs: { bx: number; isExit: boolean; idx: number }[] = [];
  const k0 = Math.floor((x0 - 800 - CAVE_START) / CAVE_EVERY), k1 = Math.floor((x1 + 800 - CAVE_START) / CAVE_EVERY);

  for (let k = k0; k <= k1; k++) {
    const sx = CAVE_START + k * CAVE_EVERY;
    if (sx + CAVE_LEN >= x0 - 400 && sx <= x1 + 400) {
      segs.push({ bx: sx, isExit: false, idx: k });
      segs.push({ bx: sx + CAVE_LEN, isExit: true, idx: k });
    }
  }

  for (const { bx, isExit, idx } of segs) {
    if (bx < x0 - 500 || bx > x1 + 500) continue;
    const gEntrance = groundYat(bx);

    // 1. UBIN BATU KUNO TERSUSUN RAPI MENGIKUTI KONTUR LERENG JALAN
    // Membentang sepanjang turunan ngarai (bx - 700 s/d bx + 350)
    ctx.save();
    const roadStart = bx - (isExit ? 350 : 700);
    const roadEnd = bx + (isExit ? 700 : 350);
    const paverStep = 36;

    for (let rx = roadStart; rx <= roadEnd; rx += paverStep) {
      const ry = groundYat(rx);
      const ryNext = groundYat(rx + paverStep);
      const sl = Math.atan2(ryNext - ry, paverStep);

      ctx.save();
      ctx.translate(rx + paverStep * 0.5, ry);
      ctx.rotate(sl);

      // Paving batu candi kuno rata & rapi
      ctx.fillStyle = '#262030';
      ctx.fillRect(-paverStep * 0.46, -3, paverStep * 0.92, 7);
      ctx.fillStyle = '#3c3248';
      ctx.fillRect(-paverStep * 0.44, -4, paverStep * 0.88, 2.5);
      // Lis emas/rune kecil tertanam di ubin jalan
      if ((Math.abs(Math.floor(rx / 72)) % 3) === 0) {
        ctx.fillStyle = isExit ? 'rgba(255,220,140,0.6)' : 'rgba(90,210,255,0.55)';
        ctx.fillRect(-6, -4.5, 12, 1.2);
      }
      ctx.restore();
    }
    ctx.restore();

    // 2. BERKAS CAHAYA MATAHARI ALAMI MENYOROT KE DALAM MULUT NGARAI
    ctx.save();
    const rayG = ctx.createLinearGradient(bx - 120, gEntrance - 650, bx + 160, gEntrance + 50);
    const rayCol = isExit ? 'rgba(255,240,190,' : 'rgba(180,230,255,';
    rayG.addColorStop(0, rayCol + '0.22)');
    rayG.addColorStop(0.5, rayCol + '0.08)');
    rayG.addColorStop(1, rayCol + '0)');

    ctx.fillStyle = rayG;
    ctx.beginPath();
    ctx.moveTo(bx - 80, gEntrance - 650);
    ctx.lineTo(bx + 40, gEntrance - 650);
    ctx.lineTo(bx + 260, gEntrance + 30);
    ctx.lineTo(bx - 40, gEntrance + 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. SEPASANG MONOLIT GERBANG PENJAGA MEGALIT KUNO (KOKOH DI ATAS TANAH)
    const pW = 34;
    const pH = 260;
    const offsets = isExit ? [-140, 140] : [-160, 160];

    for (const off of offsets) {
      const px = bx + off;
      const py = groundYat(px);
      const top = py - pH;
      const fl = 0.8 + 0.2 * Math.sin(t * 2.6 + off * 0.05 + idx);

      ctx.save();
      // Bayangan pondasi di tanah
      ctx.fillStyle = 'rgba(12,8,20,0.45)';
      ctx.beginPath();
      ctx.ellipse(px, py + 2, pW * 1.2, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Badan pilar batu bertingkat
      ctx.fillStyle = '#1c1728';
      ctx.fillRect(px - pW / 2, top, pW, pH + 4);

      // Detail relief & pahatan vertikal batu
      ctx.fillStyle = '#2b233a';
      ctx.fillRect(px - pW * 0.35, top + 15, pW * 0.7, pH - 30);
      ctx.fillStyle = '#3a304e';
      ctx.fillRect(px - pW * 0.15, top + 25, pW * 0.3, pH - 50);

      // Kepala mahkota pilar
      ctx.fillStyle = '#342a44';
      ctx.fillRect(px - pW * 0.7, top - 12, pW * 1.4, 12);
      ctx.fillRect(px - pW * 0.55, top - 20, pW * 1.1, 8);
      ctx.fillStyle = isExit ? '#dca850' : '#45b8ea';
      ctx.fillRect(px - 4, top - 26, 8, 6);

      // Lentera gantung batu kuno di sisi luar pilar
      const ly = top + 65;
      const lx = px + (off > 0 ? 18 : -18);

      ctx.fillStyle = `rgba(255,215,130,${0.6 * fl})`;
      ctx.beginPath();
      ctx.arc(lx, ly, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,240,175,${0.95 * fl})`;
      ctx.fillRect(lx - 5, ly - 8, 10, 16);
      ctx.fillStyle = '#241a12';
      ctx.fillRect(lx - 7, ly - 11, 14, 3);
      ctx.fillRect(lx - 7, ly + 8, 14, 3);

      // Tali gantungan lentera
      ctx.strokeStyle = '#241a12';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, top + 45);
      ctx.lineTo(lx, ly - 10);
      ctx.stroke();

      ctx.restore();
    }

    // 4. LINTEL LENGKUNG BATU KUNO MENGHUBUNGKAN ATAP GERBANG
    const leftP = bx + offsets[0];
    const rightP = bx + offsets[1];
    const leftTop = groundYat(leftP) - pH;
    const rightTop = groundYat(rightP) - pH;
    const midTop = Math.min(leftTop, rightTop) - 24;

    ctx.save();
    ctx.strokeStyle = '#241d32';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(leftP - 8, leftTop + 8);
    ctx.quadraticCurveTo((leftP + rightP) / 2, midTop, rightP + 8, rightTop + 8);
    ctx.stroke();

    // Garis hiasan ukiran atas lintel
    ctx.strokeStyle = isExit ? 'rgba(255,215,130,0.5)' : 'rgba(90,210,255,0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leftP + 12, leftTop - 2);
    ctx.quadraticCurveTo((leftP + rightP) / 2, midTop - 8, rightP - 12, rightTop - 2);
    ctx.stroke();

    // Permata rune bercahaya di puncak busur tengah
    const midX = (leftP + rightP) / 2;
    const runeGlow = isExit ? 'rgba(255,225,140,' : 'rgba(90,215,255,';
    const flMid = 0.8 + 0.2 * Math.sin(t * 3.1 + idx);
    ctx.fillStyle = runeGlow + `${0.85 * flMid})`;
    ctx.beginPath();
    ctx.arc(midX, midTop - 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(midX, midTop - 4, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ================= SURGA (Spasial Murni di Langit Tinggi) =================
export function drawHeavenBackdrop(ctx: Ctx, t: number, horizonY: number) {
  if (horizonY < -80) return;
  const hy = Math.min(horizonY, H + 60);

  const sx = W * 0.5, sy = hy - H * 0.35, pulse = 1 + Math.sin(t * 0.8) * 0.02;
  if (sy > -220) {
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, 340 * pulse);
    halo.addColorStop(0, 'rgba(255,252,240,0.9)');
    halo.addColorStop(0.3, 'rgba(255,240,205,0.5)');
    halo.addColorStop(0.7, 'rgba(255,210,180,0.18)');
    halo.addColorStop(1, 'rgba(255,210,180,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(sx, sy, 340 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath(); ctx.arc(sx, sy, 65 * pulse, 0, Math.PI * 2); ctx.fill();
  }

  for (let i = 0; i < 7; i++) {
    const span = W + 500;
    const x = (((hash(i * 13.7) * span + t * (10 + hash(i * 3.3) * 14)) % span) + span) % span - 250;
    const y = hy - H * 0.08 - hash(i * 7.9) * Math.max(120, hy * 0.75);
    if (y < -160) continue;
    const r = 60 + hash(i * 5.1) * 100;
    ctx.fillStyle = 'rgba(255,235,245,0.32)';
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function heavenIsland(ctx: Ctx, x: number, y: number, s: number, t: number, sd: number) {
  const yy = y + Math.sin(t * 0.45 + sd * 2.2) * 6 * s;
  const w = 125 * s;

  ctx.fillStyle = 'rgba(255,246,220,0.45)';
  ctx.beginPath(); ctx.arc(x, yy - 60 * s, 160 * s, 0, Math.PI * 2); ctx.fill();

  for (let k = 0; k < 4; k++) {
    const cx = x - w * 0.8 + k * w * 0.5 + (hash(sd * 7 + k) - 0.5) * 25 * s;
    const cy = yy + 78 * s + hash(sd + k * 3) * 30 * s;
    const cr = (34 + hash(sd * 3 + k * 5) * 26) * s;
    ctx.fillStyle = 'rgba(255,244,250,0.65)';
    ctx.beginPath(); ctx.ellipse(cx, cy, cr * 1.5, cr * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  }

  const rg = ctx.createLinearGradient(0, yy, 0, yy + 130 * s);
  rg.addColorStop(0, '#9d94cc');
  rg.addColorStop(0.45, '#7a72ab');
  rg.addColorStop(1, '#57507f');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(x - w, yy);
  ctx.quadraticCurveTo(x - w * 0.72, yy + 62 * s, x - w * 0.16, yy + 108 * s);
  ctx.quadraticCurveTo(x, yy + 128 * s, x + w * 0.14, yy + 104 * s);
  ctx.quadraticCurveTo(x + w * 0.68, yy + 58 * s, x + w, yy);
  ctx.closePath(); ctx.fill();

  heavenTemple(ctx, x + (hash(sd * 3.3) - 0.5) * w * 0.3, yy, s);
}

function heavenTemple(ctx: Ctx, x: number, y: number, s: number) {
  const marble = '#f6f1ff', marbleDk = '#d9d0f0', gold = '#ffd98a';
  ctx.fillStyle = marbleDk;
  ctx.fillRect(x - 52 * s, y - 8 * s, 104 * s, 8 * s);
  ctx.fillStyle = marble;
  ctx.fillRect(x - 46 * s, y - 11 * s, 92 * s, 6 * s);

  const towers = [
    { o: -34, w: 15, h: 66, sp: 30 },
    { o: 34, w: 15, h: 66, sp: 30 },
    { o: 0, w: 20, h: 96, sp: 44 },
  ];
  for (const tw of towers) {
    const tx = x + tw.o * s, hh = tw.h * s, ww = tw.w * s, yb = y - 11 * s;
    ctx.fillStyle = marble;
    ctx.fillRect(tx - ww / 2, yb - hh, ww, hh);
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(tx - ww * 0.55, yb - hh);
    ctx.lineTo(tx, yb - hh - tw.sp * s);
    ctx.lineTo(tx + ww * 0.55, yb - hh);
    ctx.closePath(); ctx.fill();
  }
}

export function drawHeavenPalaces(ctx: Ctx, t: number, camX: number, horizonY: number) {
  if (horizonY < -120) return;
  const layers = [
    { par: 0.05, slot: 760, s: 0.52, off0: 320, a: 0.7 },
    { par: 0.12, slot: 980, s: 0.95, off0: 180, a: 1 },
  ];
  layers.forEach((L, li) => {
    const off = camX * L.par;
    const i0 = Math.floor((off - 600) / L.slot), i1 = Math.floor((off + W + 600) / L.slot);
    for (let i = i0; i <= i1; i++) {
      if (hash(i * 7.7 + li * 13.1) < 0.3) continue;
      const x = i * L.slot - off + (hash(i * 3.9 + li) - 0.5) * 160;
      if (x < -420 || x > W + 420) continue;
      const y = horizonY - L.off0 - hash(i * 5.5 + li * 2.7) * 260 + Math.sin(t * 0.4 + i + li * 3) * 8;
      if (y < -320) continue;
      const fadeIn = smooth(clamp((y + 320) / 160, 0, 1));
      ctx.save();
      ctx.globalAlpha = L.a * fadeIn;
      heavenIsland(ctx, x, y, L.s * (0.9 + hash(i * 9.1) * 0.25), t, i * 1.31 + li * 7.7);
      ctx.restore();
    }
  });
}
