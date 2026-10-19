import type { Game } from './engine';
import { W, H, NORMAL_SPD, STAR_MAX, CLOUD_LAYERS, clamp, heart, starShape } from './scenery';

export const HINTS_ULTRA = [
  'Mode ULTRA MUDAH: kepala naga = skate — arahkan mouse, kepala langsung mengejar!',
  'Cincin = boost kecepatan — arah naga tetap 100% ikut mousemu, tanpa belok sendiri ✦',
  'Tahan klik kiri / Spasi untuk melesat hingga 5× · bintang jatuh = 10× ✦',
  'Klik kanan / E = Putaran ↻   ·   tahan untuk putaran beruntun',
  'Scroll mouse / Q = Pusaran Naga ∿   ·   tubuh naga berpilin indah',
  'Setiap trik menaikkan pengganda ALIRAN ×   ·   cincin & gerbang menjaganya tetap hidup',
  'Menabrak batu atau menyentuh tanah saat berputar memutus aliran!',
  'Saat naga meliuk tajam, penunggang otomatis bersalto — tiap salto menambah aliran ✦',
  'Pantul di atas balon udara besar untuk melambung tinggi & salto ganda 🎈',
  'Ikuti tangga cincin atau arus angin naik ⌃ untuk terbang ke langit ☁',
  'Tangkap bintang jatuh: atraksi, melesat hingga 10× & +1 ♥',
  'Masuki gua reruntuhan bawah tanah — awas stalaktit! Terbang tinggi menembus surga awan ✦',
];

export const HINTS_CLASSIC = [
  'Mode KLASIK: naga mengejar mutiara cahaya — jaga momentum seperti Alto!',
  'Cincin = boost kecepatan — arah naga tetap 100% ikut mousemu ✦',
  'Menukik = tambah cepat · menanjak = pakai kecepatan — atur ritmenya',
  'Tahan klik kiri / Spasi untuk melesat · bintang jatuh = 10× ✦',
  'Klik kanan / E = Putaran ↻ · Scroll / Q = Pusaran Naga ∿',
  'Setiap trik menaikkan pengganda ALIRAN × — jangan menabrak!',
];

export const HINTS_ANGLE = [
  'Mode SUDUT: kepala naga menunjuk persis ke arah mousemu — seperti menyetir!',
  'Arahkan ke bawah untuk mendarat & meluncur di tanah — tanpa batasan',
  'Cincin = boost kecepatan — arah naga tetap 100% ikut mousemu ✦',
  'Tahan klik kiri / Spasi untuk melesat · bintang jatuh = 10× ✦',
  'Klik kanan / E = Putaran ↻ · Scroll / Q = Pusaran Naga ∿',
  'Setiap trik menaikkan pengganda ALIRAN × — tabrakan dimaafkan!',
];

export const HINTS = HINTS_ULTRA;
export const hintsFor = (mode: string) => (mode === 'classic' ? HINTS_CLASSIC : mode === 'angle' ? HINTS_ANGLE : HINTS_ULTRA);

export function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.fill();
}

// HUD aliran: pengganda, sisa waktu, poin & nama trik terakhir
export function drawFlow(g: Game) {
  const ctx = g.ctx, f = g.flow;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (f.n > 0) {
    const zen = f.mult >= 5, pulse = 1 + f.pulse * 0.28;
    ctx.font = `700 italic ${Math.round(34 * pulse)}px "Cormorant Garamond", serif`;
    ctx.shadowColor = zen ? 'rgba(140,255,220,0.85)' : 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = zen ? 18 : 6;
    ctx.fillStyle = zen ? `hsl(${(g.time * 80) % 360},90%,86%)` : 'rgba(255,236,190,0.98)';
    ctx.fillText(`×${f.mult}`, W / 2, 34);
    ctx.shadowBlur = 0;
    const bw = 110, k = clamp(f.t / 3.2, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; round(ctx, W / 2 - bw / 2, 56, bw, 3, 1.5);
    ctx.fillStyle = zen ? '#9dffd8' : k < 0.3 ? `rgba(255,170,150,${0.7 + Math.sin(g.time * 14) * 0.3})` : 'rgba(255,236,190,0.95)';
    round(ctx, W / 2 - bw / 2, 56, Math.max(3, bw * k), 3, 1.5);
    ctx.font = '700 10px Quicksand, sans-serif';
    ctx.fillStyle = 'rgba(255,250,240,0.85)';
    ctx.fillText(`${zen ? 'ALIRAN ZEN' : 'ALIRAN'} · ${Math.round(f.pts)} × ${f.mult}`, W / 2, 70);
    // daftar trik ala Alto: berderet di kanan, trik terbaru paling bawah
    const N = f.names.length;
    ctx.textAlign = 'right';
    f.names.forEach((n, i) => {
      const a = clamp(n.t / 0.25, 0, 1), newest = i === N - 1;
      ctx.globalAlpha = a * (newest ? 1 : 0.86);
      ctx.font = `${newest ? 700 : 600} ${newest ? 14 : 12}px Quicksand, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = newest ? 'rgba(255,236,180,1)' : 'rgba(255,250,240,0.95)';
      ctx.fillText((i ? '+ ' : '') + n.s, W - 26 + (1 - a) * 22, 106 + i * 17);
    });
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1;
  }
  if (g.bankPop) {
    const b = g.bankPop, a = clamp(b.t / 0.5, 0, 1), rise = (2.2 - b.t) * 10, y = f.n > 0 ? 150 : 40;
    ctx.globalAlpha = a;
    ctx.font = '700 28px "Cormorant Garamond", serif';
    ctx.fillStyle = b.lost ? 'rgba(255,175,170,0.95)' : 'rgba(255,240,200,0.98)';
    ctx.fillText(b.lost ? 'Aliran putus' : `+${b.pts.toLocaleString('id-ID')}`, W / 2, y - rise);
    ctx.font = '700 10px Quicksand, sans-serif';
    ctx.fillStyle = 'rgba(255,250,240,0.8)';
    ctx.fillText(b.lost ? `pengganda ×${b.mult} hilang` : `aliran ×${b.mult} tersimpan`, W / 2, y + 20 - rise);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function drawToasts(g: Game) {
  const ctx = g.ctx;
  ctx.save();
  g.toasts.forEach((tt, i) => {
    const a = Math.min(1, (3.6 - tt.t) / 0.3, tt.t / 0.5);
    const slide = (1 - Math.min(1, (3.6 - tt.t) / 0.35)) * -30;
    const y = 180 + i * 44 + slide;
    ctx.font = '600 14px Quicksand, sans-serif';
    const label = 'Misi selesai · ' + tt.text;
    const w = ctx.measureText(label).width + 70;
    const x = W / 2 - w / 2;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,14,40,0.45)';
    ctx.beginPath();
    ctx.moveTo(x + 18, y); ctx.arcTo(x + w, y, x + w, y + 36, 18); ctx.arcTo(x + w, y + 36, x, y + 36, 18);
    ctx.arcTo(x, y + 36, x, y, 18); ctx.arcTo(x, y, x + w, y, 18); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,120,1)';
    ctx.beginPath(); ctx.arc(x + 22, y + 18, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(60,30,20,0.9)';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x + 17, y + 18); ctx.lineTo(x + 21, y + 22); ctx.lineTo(x + 27, y + 14); ctx.stroke();
    ctx.fillStyle = 'rgba(255,250,240,1)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 42, y + 18.5);
  });
  ctx.restore();
}

export function drawBanner(g: Game) {
  const ctx = g.ctx;
  const t = g.banner.t;
  const a = Math.min(1, (4.5 - t) / 0.8, t / 1);
  if (a <= 0) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = `rgba(255,250,240,${a * 0.75})`;
  ctx.font = '600 12px Quicksand, sans-serif';
  const y0 = H * 0.3;
  ctx.fillText(g.banner.sub.split('').join(' '), W / 2, y0);
  ctx.fillStyle = `rgba(255,250,240,${a})`;
  ctx.font = '600 40px "Cormorant Garamond", serif';
  ctx.fillText(g.banner.name, W / 2, y0 + 30);
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,250,240,${a * 0.5})`;
  ctx.fillRect(W / 2 - 34 * a, y0 + 56, 68 * a, 1);
  ctx.restore();
}

export function drawHUD(g: Game) {
  const ctx = g.ctx;
  ctx.save();
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = 'rgba(255,250,240,0.95)';
  ctx.textAlign = 'left';
  ctx.font = '700 26px Quicksand, sans-serif';
  const dist = `${g.distanceM()}`;
  ctx.fillText(dist, 26, 22);
  const dw = ctx.measureText(dist).width;
  ctx.font = '600 14px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(255,250,240,0.7)';
  ctx.fillText('m', 30 + dw, 32);

  ctx.textAlign = 'right';
  ctx.font = '700 24px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(255,250,240,0.95)';
  ctx.fillText(`${g.totalScore()}`, W - 26, 22);
  ctx.font = '600 13px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(255,250,240,0.75)';
  ctx.fillText(`◯ ${g.ringCount}`, W - 26, 52);
  for (let i = 0; i < 3; i++) heart(ctx, W - 34 - (2 - i) * 20, 74, 6.5, i < g.lives);
  ctx.shadowBlur = 0;

  drawFlow(g);

  // altimeter lembut (muncul saat terbang tinggi)
  const altA = clamp((g.altS - 60) / 200, 0, 1);
  if (altA > 0.01) {
    const ax = 30, ay0 = H * 0.3, ay1 = H * 0.72, maxA = 260;
    const yOf = (m: number) => ay1 - clamp(m / maxA, 0, 1) * (ay1 - ay0);
    ctx.globalAlpha = altA;
    ctx.strokeStyle = 'rgba(255,250,240,0.28)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax, ay0); ctx.lineTo(ax, ay1); ctx.stroke();
    ctx.font = '600 10px Quicksand, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const L of CLOUD_LAYERS) {
      const y = yOf(L.alt / 10);
      ctx.fillStyle = 'rgba(255,250,240,0.5)'; ctx.fillRect(ax - 4, y, 8, 1);
      ctx.fillText('☁', ax + 8, y);
    }
    const altM = Math.round(g.altS / 10), ya = yOf(altM);
    ctx.fillStyle = 'rgba(255,250,240,0.95)';
    ctx.beginPath(); ctx.arc(ax, ya, 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.font = '700 12px Quicksand, sans-serif';
    ctx.fillText(`${altM} m`, ax + 22, ya);
    ctx.globalAlpha = 1;
  }
  // penunjuk bintang jatuh di luar layar
  if (g.star && g.mode === 'playing') {
    const sx = (g.star.x - g.camX) * g.zoom, sy = (g.star.y - g.camY) * g.zoom;
    if (sx > W - 24 || sy < 10 || sy > H - 10) {
      const px = clamp(sx, 40, W - 28), py = clamp(sy, 40, H - 70);
      const pu = 1 + Math.sin(g.time * 6) * 0.15;
      const gl = ctx.createRadialGradient(px, py, 0, px, py, 22);
      gl.addColorStop(0, 'rgba(255,240,200,0.6)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(px, py); ctx.rotate(g.time); starShape(ctx, 8 * pu, 'rgba(255,255,255,0.95)'); ctx.restore();
      ctx.font = '700 10px Quicksand, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,248,225,0.9)'; ctx.fillText('bintang jatuh ✦', px - 16, py + 18);
    }
  }
  ctx.textBaseline = 'top';

  // pemberitahuan lembut (mis. bintang jatuh muncul)
  if (g.notice) {
    ctx.globalAlpha = Math.max(0, Math.min(1, g.notice.t / 0.5, (3.2 - g.notice.t) / 0.3));
    ctx.textAlign = 'center';
    ctx.font = '600 13px Quicksand, sans-serif';
    ctx.fillStyle = 'rgba(255,240,200,0.96)';
    ctx.fillText(g.notice.text, W / 2, H - 132);
    ctx.globalAlpha = 1;
  }

  // meter kecepatan ×1 – ×10  (×5 = batas tahan biasa · ×10 = Melesat Bintang)
  const bw = 280, bx = W / 2 - bw / 2, by = H - 36;
  const m = clamp(g.spd / STAR_MAX, 0, 1);
  const stall = g.spd < 190;
  const starRush = g.superT > 0 || g.starGrace > 0;
  const rushing = g.throttle > 0.05 || starRush;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  round(ctx, bx, by, bw, 5, 2.5);
  ctx.fillStyle = 'rgba(255,226,150,0.16)'; // zona bintang ×5–×10
  round(ctx, bx + bw / 2, by, bw / 2, 5, 2.5);
  if (starRush) {
    const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    gr.addColorStop(0, '#fff3c4'); gr.addColorStop(0.5, '#ffd27a'); gr.addColorStop(0.78, '#ff9ad5'); gr.addColorStop(1, '#9d8cff');
    ctx.fillStyle = gr;
  } else if (rushing || g.zen) {
    const gr = ctx.createLinearGradient(bx, 0, bx + bw / 2, 0);
    gr.addColorStop(0, '#7dffc4'); gr.addColorStop(0.5, '#6fb8ff'); gr.addColorStop(1, '#ff9ad5');
    ctx.fillStyle = gr;
  } else ctx.fillStyle = stall ? `rgba(255,120,110,${0.7 + Math.sin(g.time * 12) * 0.3})` : g.boost > 0 ? 'rgba(255,226,140,1)' : 'rgba(255,250,240,0.9)';
  round(ctx, bx, by, Math.max(5, bw * m), 5, 2.5);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let k = 1; k < 10; k++) ctx.fillRect(bx + (bw * k) / 10 - 0.5, by - (k === 5 ? 4 : 1), 1, k === 5 ? 13 : 7);
  ctx.textAlign = 'center';
  ctx.font = '700 8px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(255,250,240,0.55)';
  ctx.fillText('×5', bx + bw / 2, by - 14);
  ctx.fillText('×10 ✦', bx + bw - 8, by - 14);
  ctx.font = '600 10px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(255,250,240,0.72)';
  const mult = (g.spd / NORMAL_SPD).toFixed(1);
  ctx.fillText(
    stall ? 'TERLALU LAMBAT · MENUKIKLAH'
      : starRush ? `MELESAT BINTANG ✦  ×${mult}`
      : rushing ? `MELESAT  ×${mult}  ·  maks ×5 — tangkap bintang untuk ×10`
      : `×${mult}  ·  TAHAN KLIK = MELESAT  ·  KLIK KANAN / E = PUTARAN  ·  SCROLL / Q = PUSARAN`,
    W / 2, by + 11,
  );

  // petunjuk bertahap untuk pemain baru (beda tiap mode kontrol)
  const HL = hintsFor(g.controlMode);
  if (g.tutorial && g.playT < HL.length * 4.5 && g.mode === 'playing') {
    const idx = Math.min(HL.length - 1, Math.floor(g.playT / 4.5));
    const lt = g.playT - idx * 4.5;
    const a = Math.max(0, Math.min(1, lt / 0.5, (4.5 - lt) / 0.5));
    if (a > 0) {
      ctx.font = '600 14px Quicksand, sans-serif';
      const tw = ctx.measureText(HINTS[idx]).width + 48;
      const py = H - 96;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(24,16,44,0.34)';
      round(ctx, W / 2 - tw / 2, py, tw, 34, 17);
      ctx.fillStyle = 'rgba(255,250,240,0.96)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(HINTS[idx], W / 2, py + 17.5);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}
