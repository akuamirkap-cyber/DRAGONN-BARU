import { useEffect, useRef, type ReactNode, type SyntheticEvent } from 'react';
import { dragonGeo, paintDragon, seatFrame, BODY_N, DEFAULT_PARTS, type Parts, type Vec } from '../game/dragon';
import { Rider, RIDERS, type RiderStyle } from '../game/rider';
import type { Goal, GoalType, Skin } from '../game/progress';

export const stop = (e: SyntheticEvent) => e.stopPropagation();

function previewBody(t: number, wave: number): Vec[] {
  const body: Vec[] = [];
  for (let i = 0; i < BODY_N; i++) {
    body.push({ x: 92 - i * 6.2, y: (Math.sin(t * 2 - i * 0.22) * 12 + Math.sin(i * 0.12) * 4) * wave + (1 - wave) * Math.sin(i * 0.25) * 3 });
  }
  return body;
}

// ---------- pratinjau naga + penunggang (animasi, dengan fisika) ----------
export function DragonPreview({ skin, parts = DEFAULT_PARTS, rider = RIDERS[0], width = 260, height = 110, speed = 1, shine = 0.6 }: {
  skin: Skin; parts?: Parts; rider?: RiderStyle | null; width?: number; height?: number; speed?: number; shine?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * 1.5;
    c.width = width * dpr;
    c.height = height * dpr;
    const R = rider ? new Rider(rider) : null;
    let raf = 0, last = performance.now();
    const t0 = last;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.033, (now - last) / 1000) * speed;
      last = now;
      const t = ((now - t0) / 1000) * speed;
      const g = dragonGeo(previewBody(t, 1), t, 320);
      const sf = seatFrame(g);
      if (R) R.update(dt, { ...sf, lean: 0.5 + Math.sin(t * 1.3) * 0.12 }, { wind: { x: -300, y: 0 }, gravity: 700 });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const sc = Math.min(width / 400, height / 170) * 1.05;
      ctx.translate(width / 2 + 70 * sc, height / 2 + 14 * sc);
      ctx.scale(sc, sc);
      R?.drawBack(ctx);
      paintDragon(ctx, g, skin, parts, { t, spd: 320, boost: 0.5 + Math.sin(t) * 0.3, flap: t * Math.PI * 2 * 1.1, amp: 0.8, fold: 0, saddle: rider ? rider.scarf : undefined, shine, grip: R ? sf.grip : null });
      if (R) { R.drawFront(ctx); R.drawScarf(ctx); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [skin, parts, rider, width, height, speed, shine]);
  return <canvas ref={ref} style={{ width, height }} />;
}

// ---------- thumbnail statis per pilihan ----------
export type Focus = 'all' | 'horn' | 'eye' | 'wing' | 'fin' | 'frill' | 'tail' | 'leg' | 'pattern' | 'rider';
const FOCUS: Record<Focus, [number, number, number]> = {
  all: [-62, -10, 0.25], horn: [80, -14, 1.5], eye: [99, -5, 3.3], wing: [26, -26, 0.92], fin: [-40, -8, 0.6],
  frill: [28, -4, 0.62], tail: [-226, 0, 0.9], leg: [54, 17, 1.4], pattern: [-10, 0, 1.3], rider: [60, -15, 1.65],
};

export function LookThumb({ skin, parts, rider, focus, width = 120, height = 70 }: {
  skin: Skin; parts: Parts; rider: RiderStyle | null; focus: Focus; width?: number; height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = width * dpr;
    c.height = height * dpr;
    const t = 0.9;
    const g = dragonGeo(previewBody(t, 0), t, 900, true);
    const [cx, cy, z] = FOCUS[focus];
    const s = z * (width / 100);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.scale(s, s);
    ctx.translate(-cx, -cy);
    let R: Rider | null = null;
    if (rider && (focus === 'rider' || focus === 'all')) {
      R = new Rider(rider);
      R.snap({ ...seatFrame(g), lean: 0.35 });
    }
    R?.drawBack(ctx);
    paintDragon(ctx, g, skin, parts, { t, spd: 300, flap: Math.PI / 2, amp: 0.55, fold: 0, saddle: R ? R.style.scarf : undefined, shine: 0.7, grip: R ? seatFrame(g).grip : null });
    if (R) { R.drawFront(ctx); R.drawScarf(ctx); }
  }, [skin, parts, rider, focus, width, height]);
  return <canvas ref={ref} style={{ width, height }} />;
}

// ---------- ikon garis minimalis ----------
export type IconName =
  | 'flag' | 'dragon' | 'rank' | 'sliders' | 'play' | 'pause' | 'sound' | 'mute' | 'mouse' | 'down' | 'up'
  | 'ring' | 'gate' | 'path' | 'combo' | 'spark' | 'target' | 'wave' | 'mountain' | 'close' | 'check' | 'star' | 'cloud'
  | 'loop' | 'spiral' | 'bolt' | 'bird' | 'shield' | 'dive' | 'flow';

const PATHS: Record<IconName, ReactNode> = {
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  dragon: <><path d="M2 15c2.5 0 3.2-4 6-4s3.4 5 6.2 5S18 11 19.5 9" /><path d="M19.5 9l2.5-1M19.5 9l1 2.4" /><path d="M6 11.5l-.8-2M10 12.5l.3-2.2M14 15l.8-2" /></>,
  rank: <path d="M4 20v-7h4v7M10 20V8h4v12M16 20v-5h4v5" />,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  play: <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" /></>,
  sound: <><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></>,
  mute: <><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="m22 9-6 6M16 9l6 6" /></>,
  mouse: <><rect x="7" y="3" width="10" height="18" rx="5" /><path d="M12 7v3" /></>,
  down: <><path d="M4 6c5 0 8 4 10 9l1.5 3" /><path d="M16 19h-5M16 19v-5" /></>,
  up: <><path d="M4 18c5 0 8-4 10-9l1.5-3" /><path d="M16 5h-5M16 5v5" /></>,
  ring: <ellipse cx="12" cy="12" rx="5" ry="9" />,
  gate: <path d="M3 6c6 1.4 12 1.4 18 0M5 10h14M7 7v14M17 7v14" />,
  path: <><path d="M4 19c4 0 4-6 8-6s4-6 8-6" /><path d="M17 4l3 3-3 3" /></>,
  combo: <><ellipse cx="6" cy="12" rx="2.2" ry="4.5" /><ellipse cx="12" cy="12" rx="2.2" ry="4.5" /><ellipse cx="18" cy="12" rx="2.2" ry="4.5" /></>,
  spark: <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" fill="currentColor" /></>,
  wave: <><path d="M3 11c2-3 4-3 6 0s4 3 6 0 4-3 6 0" /><path d="M3 18h18" /></>,
  mountain: <path d="M3 19l6-10 4 6 2-3 6 7z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12 5 5L20 7" />,
  star: <path d="M12 3l2.2 6.3L21 12l-6.8 2.7L12 21l-2.2-6.3L3 12l6.8-2.7z" />,
  cloud: <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.5 4.3 4.3 0 0 0 7 18z" />,
  loop: <><path d="M20 12a8 8 0 1 1-3-6.2" /><path d="M20 4v5h-5" /></>,
  spiral: <path d="M12 12a1.6 1.6 0 1 1 1.6 1.6A3.6 3.6 0 1 1 15.6 9a5.6 5.6 0 1 1-8.2 7.4" />,
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6z" />,
  bird: <path d="M2 11c3-3 6-3 9 1 3-4 7-4 11-1M7 15c2-1.5 3.5-1.5 5 0" />,
  shield: <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  dive: <><path d="M5 4c3 3 6 7 7 12" /><path d="M8.5 14.5 12 17l2.5-3.5" /><path d="M3 20h18" /></>,
  flow: <><path d="M3 9c3-3 6-3 9 0s6 3 9 0" /><path d="M3 15c3-3 6-3 9 0s6 3 9 0" /></>,
};

export function Icon({ name, size = 18, className = '', stroke = 1.6 }: { name: IconName; size?: number; className?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {PATHS[name]}
    </svg>
  );
}

const GOAL_ICON: Record<GoalType, IconName> = {
  dist: 'path', rings: 'ring', combo: 'combo', score: 'spark', perfect: 'target', skim: 'wave', biome: 'mountain', gate: 'gate', star: 'star', alt: 'cloud',
  loop: 'loop', spiral: 'spiral', chain: 'flow', near: 'mountain', speed: 'bolt', bird: 'bird', nohit: 'shield', sky: 'cloud', dive: 'dive', bank: 'spark', multi: 'loop',
};
export function GoalIcon({ type, size = 17 }: { type: GoalType; size?: number }) {
  return <Icon name={GOAL_ICON[type]} size={size} />;
}

// ---------- tombol & panel ----------
export function Btn({ children, onClick, variant = 'ghost', className = '' }: { children: ReactNode; onClick: () => void; variant?: 'primary' | 'ghost' | 'soft'; className?: string }) {
  const base = 'rounded-full font-semibold tracking-wide transition duration-300 active:scale-95 select-none';
  const v = {
    primary: 'bg-white/90 text-[#4a3352] hover:bg-white px-8 py-3 text-[14px] shadow-[0_10px_30px_rgba(40,20,60,0.22)]',
    soft: 'border border-white/20 bg-white/[0.08] text-white/90 hover:bg-white/20 px-6 py-2.5 text-[13px] backdrop-blur-md',
    ghost: 'text-white/70 hover:text-white px-3 py-2 text-[13px]',
  }[variant];
  return (
    <button onPointerDown={stop} onClick={onClick} className={`${base} ${v} ${className}`}>
      {children}
    </button>
  );
}

export function Panel({ title, sub, children, onClose }: { title: string; sub?: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="anim-fade absolute inset-0 flex items-center justify-center bg-[#1c1530]/25 backdrop-blur-[6px]">
      <div className="anim-rise relative flex h-[440px] w-[740px] flex-col rounded-[32px] border border-white/15 bg-white/[0.09] px-9 py-8 text-white shadow-[0_30px_80px_rgba(20,10,40,0.3)] backdrop-blur-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            {sub && <div className="mb-1 text-[10px] font-medium tracking-[0.5em] text-white/50">{sub}</div>}
            <h2 className="font-title text-[40px] font-medium leading-none tracking-wide">{title}</h2>
          </div>
          <button onPointerDown={stop} onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function Check({ done, fresh }: { done: boolean; fresh?: boolean }) {
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition duration-500 ${done ? 'border-amber-100 bg-amber-100 text-[#5a3a1a]' : 'border-white/30 text-transparent'} ${fresh ? 'anim-stamp' : ''}`}>
      <Icon name="check" size={13} stroke={2.6} />
    </span>
  );
}

export function MissionRow({ goal, done, fresh, progress, compact }: { goal: Goal; done: boolean; fresh?: boolean; progress?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3.5 rounded-2xl px-4 transition duration-500 ${compact ? 'py-2.5' : 'py-3.5'} ${done ? 'bg-amber-100/[0.13]' : 'bg-white/[0.06]'}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? 'bg-amber-100/20 text-amber-100' : 'bg-white/10 text-white/75'}`}>
        <GoalIcon type={goal.type} />
      </span>
      <span className={`flex-1 text-[13.5px] font-medium leading-snug ${done ? 'text-amber-50/85' : 'text-white/90'}`}>{goal.text}</span>
      {progress && !done && <span className="text-[11.5px] font-semibold tabular-nums text-white/55">{progress}</span>}
      <Check done={done} fresh={fresh} />
    </div>
  );
}

// ---------- awan lembut (DOM) ----------
const BACK_CLOUDS = [
  { x: 70, y: 58, s: 1.15, o: 0.5, d: 44 },
  { x: 620, y: 36, s: 0.95, o: 0.45, d: 50 },
  { x: 330, y: 128, s: 1.35, o: 0.28, d: 58 },
  { x: 730, y: 148, s: 0.8, o: 0.35, d: 38 },
];
const FRONT_CLOUDS = [
  { x: 150, y: 186, s: 1.0, o: 0.4, d: 36 },
  { x: 560, y: 198, s: 1.15, o: 0.34, d: 42 },
];

export function Clouds({ front = false }: { front?: boolean }) {
  const list = front ? FRONT_CLOUDS : BACK_CLOUDS;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {list.map((c, i) => (
        <div key={i} className="cloud" style={{ left: c.x, top: c.y, opacity: c.o, animationDuration: `${c.d}s`, animationDelay: `${-i * 9}s` }}>
          <span style={{ left: 0, top: 26 * c.s, width: 130 * c.s, height: 56 * c.s }} />
          <span style={{ left: 54 * c.s, top: 0, width: 120 * c.s, height: 84 * c.s }} />
          <span style={{ left: 128 * c.s, top: 16 * c.s, width: 120 * c.s, height: 66 * c.s }} />
          <span style={{ left: 30 * c.s, top: 44 * c.s, width: 210 * c.s, height: 48 * c.s }} />
        </div>
      ))}
    </div>
  );
}
