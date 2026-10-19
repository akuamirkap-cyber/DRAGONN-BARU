import { useState, type ReactNode } from 'react';
import { SKINS, customSkin, resolveSkin, type Save, type Skin } from '../game/progress';
import { PART_KEYS, PART_LABEL, PART_OPTIONS, partName, type PartKey, type Parts } from '../game/dragon';
import { RIDERS, riderById } from '../game/rider';
import { Btn, DragonPreview, Icon, LookThumb, stop, type Focus } from './ui';

type Tab = 'color' | PartKey | 'rider';
const TABS: { id: Tab; label: string }[] = [
  { id: 'color', label: 'Warna' },
  ...PART_KEYS.map((k) => ({ id: k as Tab, label: PART_LABEL[k] })),
  { id: 'rider', label: 'Penunggang' },
];
const TIPS: Partial<Record<Tab, string>> = {
  wing: 'Sayap mengepak kuat saat naik, melipat saat menukik, dan terbentang saat atraksi bintang.',
  fin: 'Sirip punggung mengikuti lekuk tubuh dan tidak menutupi pelana penunggang.',
  frill: 'Hiasan sirip di kepala, leher, lengan, atau ekor — bisa dipadukan bebas dengan sirip punggung.',
  rider: 'Penunggang menggenggam surai naga dan tubuhnya ikut condong saat menukik, naik, dan beratraksi.',
};

interface Card { key: string; name: string; sub?: string; active: boolean; badge?: string; pick: () => void; node: ReactNode }

export function Hangar({ save, onClose, sfx, onSkin, onParts, onRider, onRandom, onShine, onCustom }: {
  save: Save; onClose: () => void; sfx: () => void;
  onSkin: (id: string) => void; onParts: (p: Parts) => void; onRider: (id: string) => void; onRandom: () => void;
  onShine: (v: number) => void; onCustom: (c: string[]) => void;
}) {
  const [tab, setTab] = useState<Tab>('color');
  const skin = resolveSkin(save);
  const rider = riderById(save.rider);
  const parts = save.parts;

  let cards: Card[];
  if (tab === 'color') {
    const list: Skin[] = [...SKINS, customSkin(save.custom)];
    cards = list.map((s) => ({
      key: s.id, name: s.name, sub: s.title.split(' · ')[0], active: save.skin === s.id,
      badge: s.premium ? '✦ PREMIUM' : s.id === 'kustom' ? 'KUSTOM' : undefined,
      pick: () => onSkin(s.id),
      node: <LookThumb skin={s} parts={parts} rider={null} focus="all" width={96} height={56} />,
    }));
  } else if (tab === 'rider') {
    cards = RIDERS.map((r) => ({
      key: r.id, name: r.name, sub: r.title, active: save.rider === r.id, badge: r.isNew ? 'BARU' : undefined,
      pick: () => onRider(r.id),
      node: <LookThumb skin={skin} parts={parts} rider={r} focus="rider" width={96} height={56} />,
    }));
  } else {
    const k = tab;
    cards = PART_OPTIONS[k].map((o) => {
      const np = { ...parts, [k]: o.id } as Parts;
      return {
        key: o.id, name: o.name, active: parts[k] === o.id, badge: o.isNew ? 'BARU' : undefined,
        pick: () => onParts(np),
        node: <LookThumb skin={skin} parts={np} rider={null} focus={k as Focus} width={96} height={56} />,
      };
    });
  }

  return (
    <div className="anim-fade absolute inset-0 flex items-center justify-center bg-[#1c1530]/30 backdrop-blur-[6px]">
      <div className="anim-rise relative flex h-[504px] w-[924px] flex-col rounded-[32px] border border-white/15 bg-white/[0.09] px-7 py-5 text-white shadow-[0_30px_80px_rgba(20,10,40,0.3)] backdrop-blur-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="mb-1 text-[10px] font-medium tracking-[0.5em] text-white/50">RACIK NAGA & PENUNGGANGMU</div>
            <h2 className="font-title text-[36px] font-medium leading-none tracking-wide">Sanggar Naga</h2>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="soft" onClick={() => { sfx(); onRandom(); }}>⟳ Acak desain</Btn>
            <button onPointerDown={stop} onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 gap-5">
          <div
            className="flex w-[350px] shrink-0 flex-col items-center justify-between rounded-3xl px-3 pb-3 pt-1"
            style={{ background: `radial-gradient(circle at 50% 40%, rgba(${skin.glow},0.3), rgba(255,255,255,0.03) 72%)` }}
          >
            <DragonPreview skin={skin} parts={parts} rider={rider} width={330} height={250} shine={save.shine} />
            <div className="text-center">
              <div className="text-[10px] font-medium tracking-[0.4em] text-white/55">{skin.title}</div>
              <div className="font-title text-[26px] font-medium leading-tight">{skin.name}</div>
              <div className="mt-1 text-[11px] leading-snug text-white/65">
                Tanduk {partName('horn', parts.horn)} · Mata {partName('eye', parts.eye)} · Sayap {partName('wing', parts.wing)}
                <br />Sirip {partName('fin', parts.fin)} · Ekor {partName('tail', parts.tail)} · Corak {partName('pattern', parts.pattern)}
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11.5px] text-white/85">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: rider.scarf }} />
                Ditunggangi <b className="font-semibold">{rider.name}</b> · {rider.title}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {TABS.map((tb) => (
                <button
                  key={tb.id}
                  onPointerDown={stop}
                  onClick={() => { sfx(); setTab(tb.id); }}
                  className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${tab === tb.id ? 'bg-white/90 text-[#4a3352]' : 'bg-white/[0.07] text-white/75 hover:bg-white/15 hover:text-white'}`}
                >
                  {tb.label}
                </button>
              ))}
            </div>
            <div className={`scroll-soft grid grid-cols-4 content-start gap-2 overflow-y-auto pr-1 ${tab === 'color' ? 'max-h-[232px]' : 'max-h-[300px]'}`}>
              {cards.map((c) => (
                <button
                  key={c.key}
                  onPointerDown={stop}
                  onClick={() => { sfx(); c.pick(); }}
                  className={`relative flex flex-col items-center rounded-2xl border px-1 pb-1.5 pt-1.5 transition duration-300 ${c.active ? 'border-white/60 bg-white/15' : 'border-white/10 bg-white/[0.05] hover:bg-white/10'}`}
                >
                  <div className="h-[56px] w-[96px] overflow-hidden rounded-xl bg-black/10">{c.node}</div>
                  <div className="mt-1 flex max-w-full items-center gap-1 truncate px-1 text-[11.5px] font-semibold">
                    {c.active && <Icon name="check" size={11} stroke={2.6} />}<span className="truncate">{c.name}</span>
                  </div>
                  {c.sub && <div className="max-w-full truncate px-1 text-[9px] tracking-wide text-white/50">{c.sub}</div>}
                  {c.badge && (
                    <span className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-[1px] text-[7.5px] font-bold tracking-wider ${c.badge.startsWith('✦') ? 'bg-amber-100/90 text-[#5a3a1a]' : 'bg-white/85 text-[#4a3352]'}`}>{c.badge}</span>
                  )}
                </button>
              ))}
            </div>
            {tab === 'color' ? (
              <div className="mt-3 flex items-center gap-5 rounded-2xl bg-white/[0.06] px-4 py-2.5" onPointerDown={stop}>
                <label className="flex-1">
                  <div className="mb-1 flex justify-between text-[10px] font-semibold tracking-[0.3em] text-white/55">
                    <span>INTENSITAS KILAU</span><span>{Math.round(save.shine * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={save.shine} onChange={(e) => onShine(Number(e.target.value))} className="w-full" />
                </label>
                <div>
                  <div className="mb-1 text-[10px] font-semibold tracking-[0.3em] text-white/55">GRADIEN KUSTOM</div>
                  <div className="flex items-center gap-1.5">
                    {save.custom.map((c, i) => (
                      <input
                        key={i}
                        type="color"
                        value={c}
                        onChange={(e) => { const nc = [...save.custom]; nc[i] = e.target.value; onCustom(nc); }}
                        className="h-8 w-8 cursor-pointer rounded-full border border-white/30 bg-transparent p-0"
                        aria-label={`Warna gradien ${i + 1}`}
                      />
                    ))}
                    <div className="ml-1 h-6 w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${save.custom.join(',')})` }} />
                  </div>
                </div>
              </div>
            ) : (
              TIPS[tab] && <p className="mt-2.5 px-1 text-[11.5px] leading-relaxed text-white/60">{TIPS[tab]}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
