import { useState } from 'react';
import { Btn, Icon, MissionRow, Panel, stop, type IconName } from './ui';
import { fullBoard, goalsForLevel, rankTitle, skinById, type Save } from '../game/progress';

interface P { save: Save; onClose: () => void; sfx: () => void }

function HowTo({ icon, text }: { icon: IconName; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80"><Icon name={icon} size={15} /></span>
      <span>{text}</span>
    </li>
  );
}

export function GoalsPanel({ save, onClose }: P) {
  const goals = goalsForLevel(save.level);
  const doneCount = save.done.filter(Boolean).length;
  return (
    <Panel title="Misi" sub={`LEVEL ${save.level} · ${rankTitle(save.level).toUpperCase()}`} onClose={onClose}>
      <div className="flex h-full gap-7">
        <div className="flex flex-1 flex-col">
          <p className="mb-4 text-[13px] leading-relaxed text-white/70">
            Selesaikan ketiga misi untuk naik level. Setiap misi harus dicapai dalam <b className="font-semibold text-white/90">satu kali terbang</b>.
          </p>
          <div className="space-y-2.5">
            {goals.map((g, i) => <MissionRow key={i} goal={g} done={save.done[i]} />)}
          </div>
          <div className="mt-auto flex items-center gap-3 pt-4">
            <div className="flex flex-1 gap-1.5">
              {[0, 1, 2].map((i) => <div key={i} className={`h-1 flex-1 rounded-full transition ${save.done[i] ? 'bg-amber-100' : 'bg-white/15'}`} />)}
            </div>
            <span className="text-[10px] font-semibold tracking-[0.3em] text-white/55">{doneCount}/3 SELESAI</span>
          </div>
        </div>
        <div className="w-[226px] rounded-3xl bg-white/[0.05] p-5">
          <div className="mb-4 text-[10px] font-semibold tracking-[0.4em] text-white/50">CARA BERMAIN</div>
          <ul className="space-y-3.5 text-[12.5px] leading-snug text-white/80">
            <HowTo icon="mouse" text={(save.control ?? 'ultra') === 'angle' ? 'Mode SUDUT: kepala menunjuk persis ke arah mouse — arahkan ke bawah untuk mendarat!' : (save.control ?? 'ultra') === 'ultra' ? 'Mode ULTRA: kepala = skate — arahkan mouse ke mana saja, langsung mengejar!' : 'Gerakkan mouse ke mana saja — naga mengejar mutiara cahaya, bisa berbalik arah'} />
            <HowTo icon="down" text="Menukik membuat naga makin cepat" />
            <HowTo icon="up" text={(save.control ?? 'ultra') === 'classic' ? 'Naik membuat naga melambat' : 'Naik tetap mudah — tanpa takut mogok'} />
            <HowTo icon="gate" text="Cincin = boost kecepatan — arah naga selalu ikut mousemu ✦" />
            <HowTo icon="spark" text="Tahan klik / Spasi = melesat 5× · bintang jatuh ✦ = 10×" />
            <HowTo icon="loop" text="Klik kanan / E = Putaran · Scroll / Q = Pusaran" />
            <HowTo icon="flow" text="Trik menaikkan pengganda aliran — jangan menabrak!" />
          </ul>
        </div>
      </div>
    </Panel>
  );
}



export function LeaderboardPanel({ save, onClose, sfx, highlight }: P & { highlight?: number }) {
  const [tab, setTab] = useState<'all' | 'me'>('all');
  const all = fullBoard(save);
  const list = tab === 'all' ? all : [...save.board].sort((a, b) => b.score - a.score);
  const myIdx = all.findIndex((e) => e.me);
  return (
    <Panel title="Peringkat" sub="PARA PENERBANG LANGIT" onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1 rounded-full bg-white/[0.07] p-1">
            {(['all', 'me'] as const).map((t) => (
              <button
                key={t}
                onPointerDown={stop}
                onClick={() => { sfx(); setTab(t); }}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${tab === t ? 'bg-white/90 text-[#4a3352]' : 'text-white/70 hover:text-white'}`}
              >
                {t === 'all' ? 'Semua' : 'Riwayatku'}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-white/60">
            Peringkat terbaikmu <span className="font-title ml-1 text-[20px] text-amber-100">{myIdx >= 0 ? `#${myIdx + 1}` : '—'}</span>
          </div>
        </div>
        <div className="grid grid-cols-[44px_1fr_90px_70px_90px] border-b border-white/10 px-3 pb-2 text-[9.5px] font-semibold tracking-[0.25em] text-white/45">
          <span>#</span><span>PENERBANG</span><span className="text-right">JARAK</span><span className="text-right">CINCIN</span><span className="text-right">SKOR</span>
        </div>
        <div className="scroll-soft min-h-0 flex-1 overflow-y-auto pr-1">
          {list.length === 0 && <div className="py-10 text-center text-[13px] text-white/55">Belum ada perjalanan. Ayo terbang!</div>}
          {list.slice(0, 40).map((e, i) => {
            const sk = skinById(e.skin);
            const hl = e.me && highlight !== undefined && e.date === highlight;
            return (
              <div
                key={`${e.name}-${e.date}-${i}`}
                className={`grid grid-cols-[44px_1fr_90px_70px_90px] items-center border-b border-white/[0.06] px-3 py-2.5 text-[13px] ${hl ? 'anim-glow rounded-xl bg-amber-100/[0.14]' : e.me ? 'bg-white/[0.07]' : ''}`}
              >
                <span className={`font-title text-[17px] ${i < 3 ? 'text-amber-100' : 'text-white/55'}`}>{i + 1}</span>
                <span className="flex items-center gap-2.5 truncate font-medium">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: `radial-gradient(circle at 35% 35%, ${sk.fin}, ${sk.body} 60%, ${sk.dark})` }} />
                  {e.name}
                  {e.me && <span className="rounded-full bg-white/15 px-2 text-[9px] font-bold tracking-wider text-white/85">KAMU</span>}
                </span>
                <span className="text-right text-white/65">{e.distance} m</span>
                <span className="text-right text-white/65">{e.rings}</span>
                <span className="text-right font-semibold">{e.score.toLocaleString('id-ID')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

export function SettingsPanel({ save, onClose, sfx, onChange, onReset }: P & { onChange: (s: Partial<Save>) => void; onReset: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Panel title="Setelan" sub="SUARA & PROFIL" onClose={onClose}>
      <div className="flex h-full flex-col gap-6">
        <label className="block">
          <div className="mb-2 text-[10px] font-semibold tracking-[0.35em] text-white/55">NAMA PENERBANG</div>
          <input
            value={save.name}
            maxLength={14}
            onPointerDown={stop}
            onKeyDown={stop}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-[320px] rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-[15px] font-medium text-white outline-none transition focus:border-white/50"
          />
        </label>
        <div className="flex gap-10">
          <Slider label="MUSIK" value={save.musicVol} onChange={(v) => onChange({ musicVol: v })} />
          <Slider label="EFEK SUARA" value={save.sfxVol} onChange={(v) => onChange({ sfxVol: v })} />
        </div>
        <Slider label="KEPEKAAN KEMUDI (50% = NORMAL)" value={(save.steer ?? 1) - 0.5} onChange={(v) => onChange({ steer: 0.5 + v })} />
        <div>
          <div className="mb-2 text-[10px] font-semibold tracking-[0.35em] text-white/55">MODE KONTROL</div>
          <div className="flex gap-2">
            <button
              onPointerDown={stop}
              onClick={() => { sfx(); onChange({ control: 'ultra' }); }}
              className={`flex-1 rounded-2xl border px-4 py-3 text-left transition ${(save.control ?? 'ultra') === 'ultra' ? 'border-emerald-200/70 bg-emerald-200/10' : 'border-white/15 bg-white/[0.05] hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-2 text-[13px] font-bold text-white"><Icon name="bolt" size={14} className="text-emerald-200" />Ultra Mudah</div>
              <div className="mt-1 text-[11px] leading-snug text-white/60">Kepala = skate pengemudi. Arahkan mouse, langsung mengejar. Tanpa mogok.</div>
            </button>
            <button
              onPointerDown={stop}
              onClick={() => { sfx(); onChange({ control: 'angle' }); }}
              className={`flex-1 rounded-2xl border px-4 py-3 text-left transition ${(save.control ?? 'ultra') === 'angle' ? 'border-sky-200/70 bg-sky-200/10' : 'border-white/15 bg-white/[0.05] hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-2 text-[13px] font-bold text-white"><Icon name="target" size={14} className="text-sky-200" />Sudut</div>
              <div className="mt-1 text-[11px] leading-snug text-white/60">Kepala menunjuk persis ke arah mouse. Tanpa batas — bisa mendarat.</div>
            </button>
            <button
              onPointerDown={stop}
              onClick={() => { sfx(); onChange({ control: 'classic' }); }}
              className={`flex-1 rounded-2xl border px-4 py-3 text-left transition ${(save.control ?? 'ultra') === 'classic' ? 'border-amber-100/70 bg-amber-100/10' : 'border-white/15 bg-white/[0.05] hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-2 text-[13px] font-bold text-white"><Icon name="wave" size={14} className="text-amber-100" />Klasik</div>
              <div className="mt-1 text-[11px] leading-snug text-white/60">Fisika momentum ala Alto. Menanjak butuh kecepatan. Untuk master.</div>
            </button>
          </div>
        </div>
        <p className="text-[12.5px] leading-relaxed text-white/60">
          Kontrol: gerakkan <b className="text-white/85">mouse ke mana saja</b> — naga mengejar mutiara cahaya, termasuk meliuk berbalik arah (atau geser jari / tombol panah). Tahan <b className="text-white/85">klik kiri / Spasi</b> untuk melesat hingga 5×. Tekan <b className="text-white/85">Esc</b> untuk jeda.
        </p>
        <div className="mt-auto flex items-center gap-3">
          {!confirm ? (
            <Btn variant="soft" onClick={() => { sfx(); setConfirm(true); }}>Hapus semua progres</Btn>
          ) : (
            <>
              <span className="text-[13px] text-rose-100">Yakin? Level & rekor akan hilang.</span>
              <Btn variant="soft" className="!bg-rose-300/30" onClick={() => { onReset(); setConfirm(false); }}>Ya, hapus</Btn>
              <Btn variant="ghost" onClick={() => setConfirm(false)}>Batal</Btn>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block w-[280px]" onPointerDown={stop}>
      <div className="mb-1.5 flex justify-between text-[10px] font-semibold tracking-[0.35em] text-white/55">
        <span>{label}</span><span>{Math.round(value * 100)}%</span>
      </div>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}
