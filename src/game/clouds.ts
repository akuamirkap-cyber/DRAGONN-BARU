// Awan alami bergaya ilustrasi:
// • satu siluet menyatu (semua lobus digabung dalam satu path → tanpa sambungan "gelembung")
// • tepi lembut berbulu (2 lapis halo tipis)
// • gradasi cahaya dari puncak yang tersinari ke perut yang teduh
// • lipatan bayangan halus di bagian bawah (bukan sorot lingkaran per lobus)
// Ringan untuk mobile: hanya elips + 2 gradien linear per gugus awan.
export interface CloudCols { light: string; body: string; shade: string; shadeRGB: number[] }
export interface CloudOpts { alpha?: number; soft?: number; shadow?: boolean; flat?: boolean; rects?: number[] }
interface P2 { x: number; y: number }

// L = [x, y, rx, ry, x, y, rx, ry, ...]; rects = [x, y, w, h, ...]
function lobePath(ctx: CanvasRenderingContext2D, L: number[], grow: number, rects?: number[]) {
  ctx.beginPath();
  for (let i = 0; i < L.length; i += 4) {
    const rx = L[i + 2] + grow, ry = L[i + 3] + grow;
    if (rx <= 0.5 || ry <= 0.5) continue;
    ctx.moveTo(L[i] + rx, L[i + 1]);
    ctx.ellipse(L[i], L[i + 1], rx, ry, 0, 0, Math.PI * 2);
  }
  if (rects) for (let i = 0; i < rects.length; i += 4) ctx.rect(rects[i] - grow, rects[i + 1] - grow, rects[i + 2] + grow * 2, rects[i + 3] + grow * 2);
}

/** g0 → g1 = arah gradasi cahaya (puncak → perut awan). */
export function paintCloud(ctx: CanvasRenderingContext2D, L: number[], g0: P2, g1: P2, c: CloudCols, o: CloudOpts = {}) {
  if (L.length < 4 && !o.rects) return;
  const a = o.alpha ?? 1, soft = o.soft ?? 1, ga = ctx.globalAlpha;
  if (a <= 0.01) return;
  // 1) tepi berbulu
  if (soft > 0) {
    ctx.fillStyle = c.body;
    ctx.globalAlpha = ga * a * 0.09; lobePath(ctx, L, 8 * soft, o.rects); ctx.fill();
    ctx.globalAlpha = ga * a * 0.2; lobePath(ctx, L, 3.6 * soft, o.rects); ctx.fill();
  }
  // 2) badan awan dengan gradasi cahaya
  ctx.globalAlpha = ga * a;
  if (o.flat) ctx.fillStyle = c.body;
  else {
    const gr = ctx.createLinearGradient(g0.x, g0.y, g1.x, g1.y);
    gr.addColorStop(0, c.light);
    gr.addColorStop(0.52, c.body);
    gr.addColorStop(1, c.shade);
    ctx.fillStyle = gr;
  }
  lobePath(ctx, L, 0, o.rects);
  ctx.fill();
  // 3) lipatan bayangan lembut di dalam siluet
  if (o.shadow !== false && !o.flat) {
    const [r, g, b] = c.shadeRGB;
    ctx.save();
    ctx.clip();
    const sg = ctx.createLinearGradient(g0.x, g0.y, g1.x, g1.y);
    sg.addColorStop(0.28, `rgba(${r | 0},${g | 0},${b | 0},0)`);
    sg.addColorStop(1, `rgba(${r | 0},${g | 0},${b | 0},0.55)`);
    ctx.fillStyle = sg;
    ctx.beginPath();
    for (let i = 0; i < L.length; i += 4) {
      const rx = L[i + 2] * 0.94, ry = L[i + 3] * 0.86;
      if (rx <= 0.5 || ry <= 0.5) continue;
      const x = L[i] + L[i + 2] * 0.1, y = L[i + 1] + L[i + 3] * 0.62;
      ctx.moveTo(x + rx, y);
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = ga;
}
