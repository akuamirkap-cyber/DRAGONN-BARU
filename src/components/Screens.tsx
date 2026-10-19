import { useEffect, useState } from 'react';
import { Btn, Clouds, Icon, MissionRow, stop, type IconName } from './ui';
import { goalProgress, rankTitle, type Goal, type RunStats, type Save } from '../game/progress';

export type MenuTab = 'goals' | 'skins' | 'board' | 'settings';

// ---------------- MENU UTAMA (minimalis, judul di antara awan) ----------------
export function MainMenu({ save, onPlay, onOpen, onToggleControl }: { save: Save; onPlay: () => void; onOpen: (t: MenuTab) => void; onToggleControl: () => void }) {
  const mode = save.control ?? 'ultra';
  const doneCount = save.done.filter(Boolean).length;
  const nav: { id: MenuTab; label: string; icon: IconName }[] = [
    { id: 'goals', label: 'Misi', icon: 'flag' },
    { id: 'skins', label: 'Naga', icon: 'dragon' },
    { id: 'board', label: 'Peringkat', icon: 'rank' },
    { id: 'settings', label: 'Setelan', icon: 'sliders' },
  ];
  return (
    <div className="absolute inset-0 cursor-pointer select-none text-white" onClick={onPlay}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 55% 42% at 50% 30%, rgba(48,26,70,0.2), transparent 72%), linear-gradient(to top, rgba(34,20,52,0.3), transparent 30%)' }}
      />
      <Clouds />

      <div className="anim-fade pointer-events-none absolute left-9 top-7">
        <div className="text-[10px] font-medium tracking-[0.45em] text-white/60">LEVEL {save.level}</div>
        <div className="font-title text-[21px] font-medium leading-tight">{rankTitle(save.level)}</div>
        <div className="mt-1.5 flex gap-1.5">
          {[0, 1, 2].map((i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${save.done[i] ? 'bg-amber-100' : 'bg-white/30'}`} />)}
        </div>
      </div>
      <div className="anim-fade pointer-events-none absolute right-9 top-7 text-right">
        <div className="text-[10px] font-medium tracking-[0.45em] text-white/60">TERBAIK</div>
        <div className="font-title text-[24px] font-medium leading-tight">{save.best.toLocaleString('id-ID')}</div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[96px] text-center">
        <div className="anim-rise text-[10px] font-medium tracking-[0.7em] text-white/75">龍 · A ZEN DRAGON JOURNEY</div>
        <h1 className="anim-rise title-glow font-title mt-3 text-[96px] font-medium leading-none" style={{ animationDelay: '.12s' }}>
          Into <span className="font-normal italic text-white/90">the</span> Clouds
        </h1>
        <div className="anim-rise mt-5 flex items-center justify-center gap-4 text-[12px] tracking-[0.3em] text-white/75" style={{ animationDelay: '.24s' }}>
          <span className="h-px w-12 bg-white/40" />perjalanan naga menembus langit<span className="h-px w-12 bg-white/40" />
        </div>
      </div>
      <Clouds front />

      <div className="pointer-events-none absolute inset-x-0 top-[330px] flex flex-col items-center gap-2.5">
        <div className="anim-breathe flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/[0.06]">
          <Icon name="play" size={16} className="ml-0.5" />
        </div>
        <div className="anim-breathe text-[10.5px] font-semibold tracking-[0.45em] text-white/85">KLIK UNTUK TERBANG</div>
        <button
          onPointerDown={stop}
          onClick={(e) => { e.stopPropagation(); onToggleControl(); }}
          className="pointer-events-auto mt-1 flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.07] px-4 py-1.5 backdrop-blur-sm transition hover:border-white/60 hover:bg-white/15"
          aria-label="Ganti mode kontrol"
        >
          <Icon name={mode === 'classic' ? 'wave' : mode === 'angle' ? 'target' : 'bolt'} size={13} className={mode === 'classic' ? 'text-amber-100' : mode === 'angle' ? 'text-sky-200' : 'text-emerald-200'} />
          <span className="text-[10px] font-bold tracking-[0.22em] text-white/85">
            {mode === 'classic' ? 'KLASIK' : mode === 'angle' ? 'SUDUT' : 'ULTRA MUDAH'}
          </span>
          <span className="text-[9px] font-medium tracking-wider text-white/50">
            {mode === 'classic' ? 'momentum' : mode === 'angle' ? 'kendali sudut' : 'kepala = skate'}
          </span>
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-7 flex justify-center gap-9">
        {nav.map((n) => (
          <button
            key={n.id}
            onPointerDown={stop}
            onClick={(e) => { e.stopPropagation(); onOpen(n.id); }}
            className="group flex w-[72px] flex-col items-center gap-2 text-white/75 transition hover:text-white"
          >
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/[0.06] backdrop-blur-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white/60 group-hover:bg-white/15">
              <Icon name={n.icon} size={18} />
              {n.id === 'goals' && doneCount < 3 && <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-amber-200" />}
            </span>
            <span className="text-[9.5px] font-semibold tracking-[0.28em]">{n.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- AKHIR PERJALANAN ----------------
export interface RunResult {
  stats: RunStats; goals: Goal[]; before: boolean[]; after: boolean[];
  leveledUp: boolean; oldLevel: number; newLevel: number;
  rank: number; total: number; isBest: boolean; best: number; date: number;
}

export function GameOver({ r, onRetry, onMenu, onBoard, onLevelFx }: { r: RunResult; onRetry: () => void; onMenu: () => void; onBoard: () => void; onLevelFx: () => void }) {
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const k = Math.min(1, (now - t0) / 1100);
      setScore(Math.round(r.stats.score * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const a = setTimeout(() => setPhase(1), 900);
    const b = setTimeout(() => { if (r.leveledUp) { setPhase(2); onLevelFx(); } }, 2300);
    return () => { cancelAnimationFrame(raf); clearTimeout(a); clearTimeout(b); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);
  const doneCount = r.after.filter(Boolean).length;

  return (
    <div className="anim-fade absolute inset-0 flex items-center justify-center text-white" style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(30,18,50,0.22), rgba(30,18,50,0.5))' }}>
      <div className="w-[600px] text-center">
        <div className="anim-rise text-[10px] font-medium tracking-[0.5em] text-white/60">PERJALANAN SELESAI · {r.stats.biome.toUpperCase()}</div>
        <div className="anim-rise title-glow font-title mt-1 text-[96px] font-medium leading-none tabular-nums">{score.toLocaleString('id-ID')}</div>
        <div className="mt-1 h-6">
          {r.isBest ? (
            <span className="anim-stamp inline-block rounded-full bg-amber-100/90 px-3 py-1 text-[10px] font-bold tracking-[0.3em] text-[#5a3a1a]">✦ REKOR BARU</span>
          ) : (
            <span className="text-[11px] font-medium tracking-[0.3em] text-white/55">TERBAIK {r.best.toLocaleString('id-ID')}</span>
          )}
        </div>
        <div className="mx-auto mt-4 flex w-fit divide-x divide-white/15 rounded-full bg-white/[0.06] px-2 py-2">
          <Stat v={`${r.stats.distance} m`} l="jarak" />
          <Stat v={r.stats.rings} l="cincin" />
          <Stat v={r.stats.tricks} l="trik" />
          <Stat v={r.stats.stars} l="bintang" />
          <Stat v={`${r.stats.maxAlt} m`} l="tertinggi" />
          <Stat v={`×${r.stats.bestChain}`} l="aliran" />
        </div>
        <div className="mx-auto mt-5 min-h-[160px] w-[480px]">
          {phase < 2 ? (
            <div className="space-y-2 text-left">
              <div className="flex justify-between px-1 text-[10px] font-semibold tracking-[0.35em] text-white/50">
                <span>MISI · LEVEL {r.oldLevel}</span><span>{doneCount}/3</span>
              </div>
              {r.goals.map((g, i) => {
                const show = phase >= 1 ? r.after[i] : r.before[i];
                return <MissionRow key={i} goal={g} done={show} fresh={phase >= 1 && !r.before[i] && r.after[i]} progress={goalProgress(g, r.stats)} compact />;
              })}
            </div>
          ) : (
            <div className="anim-rise flex flex-col items-center pt-3">
              <div className="text-[10px] font-semibold tracking-[0.5em] text-amber-100">NAIK LEVEL</div>
              <div className="anim-stamp anim-glow font-title my-3 flex h-20 w-20 items-center justify-center rounded-full border border-amber-100/80 text-[40px] text-amber-50">{r.newLevel}</div>
              <div className="font-title text-[28px]">{rankTitle(r.newLevel)}</div>
              <div className="mt-1 text-[12px] text-white/60">Misi baru menunggumu di langit.</div>
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Btn variant="primary" onClick={onRetry}>Terbang lagi</Btn>
          <Btn variant="soft" onClick={onMenu}>Menu</Btn>
          <Btn variant="ghost" onClick={onBoard}>Peringkat #{r.rank}</Btn>
        </div>
      </div>
    </div>
  );
}

function Stat({ v, l }: { v: string | number; l: string }) {
  return (
    <div className="px-5">
      <div className="text-[17px] font-semibold leading-tight">{v}</div>
      <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/50">{l}</div>
    </div>
  );
}

// ---------------- JEDA ----------------
export function PauseMenu({ goals, done, stats, onResume, onRestart, onMenu }: {
  goals: Goal[]; done: boolean[]; stats: RunStats | null; onResume: () => void; onRestart: () => void; onMenu: () => void;
}) {
  return (
    <div className="anim-fade absolute inset-0 flex items-center justify-center bg-[#1c1530]/35 text-white backdrop-blur-[6px]">
      <div className="w-[500px] text-center">
        <div className="text-[10px] font-medium tracking-[0.5em] text-white/55">JEDA</div>
        <h2 className="font-title text-[52px] font-medium leading-tight">Tarik napas</h2>
        <div className="mt-5 space-y-2 text-left">
          <div className="px-1 text-[10px] font-semibold tracking-[0.35em] text-white/50">MISI PERJALANAN INI</div>
          {goals.map((g, i) => <MissionRow key={i} goal={g} done={done[i]} progress={goalProgress(g, stats)} compact />)}
        </div>
        <div className="mt-7 flex justify-center gap-3">
          <Btn variant="primary" onClick={onResume}>Lanjutkan</Btn>
          <Btn variant="soft" onClick={onRestart}>Ulangi</Btn>
          <Btn variant="soft" onClick={onMenu}>Menu</Btn>
        </div>
      </div>
    </div>
  );
}
