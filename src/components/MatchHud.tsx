import { Pause, Volume2, VolumeX } from 'lucide-react';
import { GameMode, HudSnapshot } from '../game/types';
import { FighterEmblem } from './FighterEmblem';

interface Props {
  hud: HudSnapshot;
  mode: GameMode;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export function MatchHud({ hud, mode, muted, onToggleMute, onPause }: Props) {
  const { p1, p2 } = hud;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-20">
      {/* Top Perimeter Health & Timer Cluster */}
      <div className="flex items-start justify-between gap-3 sm:gap-5 w-full max-w-[1360px] mx-auto">
        {/* P1 Health Cluster */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 bg-[#111520] border border-slate-700 flex items-center justify-center shrink-0">
                <FighterEmblem id={p1.id} className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-xl sm:text-2xl font-extrabold tracking-wider text-white leading-none truncate">
                  {p1.name}
                </div>
                <div className="text-[11px] font-mono text-slate-300 tabular-nums mt-0.5">
                  {p1.activeBar === 'armor'
                    ? `ARMOR ${Math.ceil(p1.armorHp)}/${p1.maxArmorHp}`
                    : `FINAL ${Math.ceil(p1.crimsonHp)}/${p1.maxCrimsonHp}`}
                </div>
              </div>
            </div>
            {/* Remaining Bars Marker */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`w-3.5 h-3.5 border ${
                  p1.activeBar === 'armor' ? 'bg-slate-200 border-white' : 'bg-slate-800 border-slate-700'
                }`}
                title="Armor Bar"
              />
              <span className="w-3.5 h-3.5 border bg-red-600 border-red-400" title="Final Bar" />
            </div>
          </div>

          {/* Dual-Layer Injustice Health Bar (P1 depletes right-to-left or left-to-right toward center) */}
          <div className="relative h-5 bg-[#090B10] border-2 border-slate-700 overflow-hidden">
            {/* Underlying Crimson Bar */}
            <div
              className="absolute inset-y-0 right-0 bg-gradient-to-l from-red-600 to-red-500 transition-[width] duration-100"
              style={{ width: `${(p1.crimsonHp / p1.maxCrimsonHp) * 100}%` }}
            />
            {/* Top Silver Armor Bar */}
            {p1.activeBar === 'armor' && (
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-slate-100 via-slate-300 to-slate-400 transition-[width] duration-75 border-l-2 border-amber-400"
                style={{ width: `${(p1.armorHp / p1.maxArmorHp) * 100}%` }}
              />
            )}
          </div>
        </div>

        {/* Center Match Clock & Controls */}
        <div className="flex flex-col items-center shrink-0 pt-0.5">
          <div className="px-4 py-1.5 bg-[#090B10] border-2 border-slate-700 min-w-[76px] text-center">
            <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-amber-400 leading-none">
              {mode === 'TRAINING' || mode === 'TUTORIAL' ? '∞' : String(hud.timerSeconds).padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause game"
              className="w-8 h-8 bg-[#111520] border border-slate-700 hover:border-amber-400 text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              className="w-8 h-8 bg-[#111520] border border-slate-700 hover:border-amber-400 text-slate-200 flex items-center justify-center cursor-pointer"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* P2 Health Cluster */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-row-reverse">
            <div className="flex items-center gap-2.5 flex-row-reverse min-w-0 text-right">
              <div className="w-9 h-9 bg-[#111520] border border-slate-700 flex items-center justify-center shrink-0">
                <FighterEmblem id={p2.id} className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-xl sm:text-2xl font-extrabold tracking-wider text-white leading-none truncate">
                  {p2.name}
                </div>
                <div className="text-[11px] font-mono text-slate-300 tabular-nums mt-0.5">
                  {p2.activeBar === 'armor'
                    ? `ARMOR ${Math.ceil(p2.armorHp)}/${p2.maxArmorHp}`
                    : `FINAL ${Math.ceil(p2.crimsonHp)}/${p2.maxCrimsonHp}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-3.5 h-3.5 border bg-red-600 border-red-400" title="Final Bar" />
              <span
                className={`w-3.5 h-3.5 border ${
                  p2.activeBar === 'armor' ? 'bg-slate-200 border-white' : 'bg-slate-800 border-slate-700'
                }`}
                title="Armor Bar"
              />
            </div>
          </div>

          <div className="relative h-5 bg-[#090B10] border-2 border-slate-700 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-500 transition-[width] duration-100"
              style={{ width: `${(p2.crimsonHp / p2.maxCrimsonHp) * 100}%` }}
            />
            {p2.activeBar === 'armor' && (
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400 transition-[width] duration-75 border-r-2 border-amber-400"
                style={{ width: `${(p2.armorHp / p2.maxArmorHp) * 100}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mid-Screen Combo Readouts & Round Banners */}
      <div className="relative flex-1 flex items-center justify-between px-2">
        {/* P1 Combo Counter */}
        <div className="w-44">
          {p1.comboCount >= 2 && (
            <div className="text-left">
              <div className="font-display text-5xl font-extrabold italic text-amber-400 leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] tabular-nums">
                {p1.comboCount} HIT
              </div>
              <div className="font-mono text-xs font-bold text-white tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tabular-nums">
                {p1.comboDamage} DMG
              </div>
            </div>
          )}
        </div>

        {/* Center Dramatic Callout Banner (FIGHT! / ARMOR BROKEN! / KNOCKOUT!) */}
        {hud.bannerText && (
          <div className="text-center px-6 py-3 bg-[#090B10]/85 border-y-2 border-amber-400">
            <div className="font-display text-5xl sm:text-6xl font-extrabold italic tracking-wider text-white leading-none">
              {hud.bannerText}
            </div>
            {hud.bannerSubtext && (
              <div className="font-mono text-xs sm:text-sm font-bold tracking-widest text-amber-400 mt-1">
                {hud.bannerSubtext}
              </div>
            )}
          </div>
        )}

        {/* P2 Combo Counter */}
        <div className="w-44 text-right">
          {p2.comboCount >= 2 && (
            <div>
              <div className="font-display text-5xl font-extrabold italic text-red-400 leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] tabular-nums">
                {p2.comboCount} HIT
              </div>
              <div className="font-mono text-xs font-bold text-white tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tabular-nums">
                {p2.comboDamage} DMG
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Perimeter Trait & 4-Bar Super Meters */}
      <div className="flex items-end justify-between gap-6 w-full max-w-[1360px] mx-auto">
        {/* P1 Trait + Super */}
        <div className="w-64 sm:w-80">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className={p1.traitActive ? 'text-amber-300 font-bold' : 'text-slate-300'}>
              {p1.traitName.toUpperCase()} {p1.id === 'nightwarden' && p1.dronesCount > 0 ? `(${p1.dronesCount})` : ''}
            </span>
            <span className="text-slate-400 tabular-nums">
              {p1.traitActive ? 'ACTIVE' : p1.traitCharge >= 100 ? 'READY [U]' : `${Math.floor(p1.traitCharge)}%`}
            </span>
          </div>
          <div className="h-1.5 bg-[#090B10] border border-slate-700 mb-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${p1.traitActive ? 'bg-amber-300' : 'bg-sky-400'}`}
              style={{ width: `${p1.traitActive ? 100 : p1.traitCharge}%` }}
            />
          </div>

          {/* 4-Bar Super Meter */}
          <div className="grid grid-cols-4 gap-1 h-3">
            {[0, 1, 2, 3].map((idx) => {
              const barFill = Math.max(0, Math.min(100, p1.superMeter - idx * 100));
              const full = p1.superMeter >= 400;
              return (
                <div key={idx} className="bg-[#090B10] border border-slate-700 overflow-hidden">
                  <div
                    className={`h-full ${full ? 'bg-amber-400' : 'bg-sky-500'}`}
                    style={{ width: `${barFill}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mt-1">
            <span>
              {p1.superMeter >= 400 ? (
                <span className="text-amber-400 font-bold">SUPER READY [SPACE]</span>
              ) : p1.clashAvailable ? (
                <span className="text-red-400 font-bold">CLASH READY [SPACE ON HIT]</span>
              ) : (
                'SUPER METER'
              )}
            </span>
            <span className="tabular-nums">{Math.floor(p1.superMeter / 100)}/4 BARS</span>
          </div>
        </div>

        {/* Center Stage Name */}
        <div className="hidden md:block text-center text-[11px] font-mono text-slate-400 pb-1">
          {hud.stageName} · Esc Pause
        </div>

        {/* P2 Trait + Super */}
        <div className="w-64 sm:w-80 text-right">
          <div className="flex items-center justify-between flex-row-reverse text-[11px] font-mono mb-1">
            <span className={p2.traitActive ? 'text-red-300 font-bold' : 'text-slate-300'}>
              {p2.traitName.toUpperCase()} {p2.id === 'nightwarden' && p2.dronesCount > 0 ? `(${p2.dronesCount})` : ''}
            </span>
            <span className="text-slate-400 tabular-nums">
              {p2.traitActive ? 'ACTIVE' : p2.traitCharge >= 100 ? 'READY' : `${Math.floor(p2.traitCharge)}%`}
            </span>
          </div>
          <div className="h-1.5 bg-[#090B10] border border-slate-700 mb-2 overflow-hidden">
            <div
              className={`h-full ml-auto transition-all duration-100 ${p2.traitActive ? 'bg-amber-300' : 'bg-red-500'}`}
              style={{ width: `${p2.traitActive ? 100 : p2.traitCharge}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-1 h-3">
            {[3, 2, 1, 0].map((idx) => {
              const barFill = Math.max(0, Math.min(100, p2.superMeter - idx * 100));
              const full = p2.superMeter >= 400;
              return (
                <div key={idx} className="bg-[#090B10] border border-slate-700 overflow-hidden">
                  <div
                    className={`h-full ml-auto ${full ? 'bg-amber-400' : 'bg-red-500'}`}
                    style={{ width: `${barFill}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between flex-row-reverse text-[11px] font-mono text-slate-300 mt-1">
            <span>{p2.superMeter >= 400 ? 'SUPER READY' : 'SUPER METER'}</span>
            <span className="tabular-nums">{Math.floor(p2.superMeter / 100)}/4 BARS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
