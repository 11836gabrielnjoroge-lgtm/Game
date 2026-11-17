import { BookOpen, RotateCcw, Users } from 'lucide-react';
import { FIGHTERS } from '../game/roster';
import { GameMode, HudSnapshot } from '../game/types';

interface PauseModalProps {
  hud: HudSnapshot;
  mode: GameMode;
  onResume: () => void;
  onRestart: () => void;
  onSelectRoster: () => void;
  onOpenControls: () => void;
}

export function PauseModal({ hud, mode, onResume, onRestart, onSelectRoster, onOpenControls }: PauseModalProps) {
  const p1 = FIGHTERS[hud.p1.id];

  return (
    <div className="absolute inset-0 z-40 bg-black/75 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#090B10] border border-slate-700 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <h2 className="font-display text-4xl font-extrabold tracking-wider text-white uppercase leading-none">
              Match Paused
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {hud.p1.name} vs {hud.p2.name} · {hud.stageName}
            </p>
          </div>
          <button
            type="button"
            onClick={onResume}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xl tracking-wider uppercase cursor-pointer"
          >
            Resume
          </button>
        </div>

        {/* Move List & Controls Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
          <div className="bg-[#111520] border border-slate-800 p-4 space-y-2">
            <div className="font-semibold text-amber-400 mb-1">Player 1 Controls</div>
            <div className="flex justify-between"><span className="text-slate-400">Move / Jump / Crouch</span><span className="font-mono text-white">W A S D</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Block High / Low</span><span className="font-mono text-white">Hold Back / S+Back</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Light / Medium / Heavy</span><span className="font-mono text-white">J / K / L</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Sweep / Overhead / Launcher</span><span className="font-mono text-white">S+K / Fwd+K / S+L</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Stage Interactable</span><span className="font-mono text-white">H or O near prop</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Super Move / Clash</span><span className="font-mono text-white">Space</span></div>
          </div>

          <div className="bg-[#111520] border border-slate-800 p-4 space-y-2">
            <div className="font-semibold text-sky-400 mb-1">{p1.name} Signature Kit</div>
            <div>
              <span className="text-white font-semibold">[U] {p1.traitName}:</span>{' '}
              <span className="text-slate-400">{p1.traitDescription}</span>
            </div>
            <div>
              <span className="text-white font-semibold">[I] {p1.special1Name}:</span>{' '}
              <span className="text-slate-400">{p1.special1Desc}</span>
            </div>
            <div>
              <span className="text-white font-semibold">[O] {p1.special2Name}:</span>{' '}
              <span className="text-slate-400">{p1.special2Desc}</span>
            </div>
            <div>
              <span className="text-amber-400 font-semibold">[Space] {p1.superName}:</span>{' '}
              <span className="text-slate-400">{p1.superDesc}</span>
            </div>
            {mode === 'VERSUS_P2' && (
              <div className="pt-1 border-t border-slate-800 text-slate-400">
                P2 Keys: Arrows Move · , . / Attacks · ; &apos; [ Trait/Specials · Enter Super
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={onOpenControls}
            className="px-4 py-2.5 border border-slate-700 bg-[#111520] hover:border-amber-400 text-slate-200 text-sm font-medium flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            Full Controls &amp; Guide
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSelectRoster}
              className="px-4 py-2.5 border border-slate-700 bg-[#111520] hover:border-slate-500 text-slate-200 text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Change Fighters
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="px-4 py-2.5 border border-slate-700 bg-[#111520] hover:border-amber-400 text-slate-200 text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GameOverModalProps {
  hud: HudSnapshot;
  onRematch: () => void;
  onSelectRoster: () => void;
}

export function GameOverModal({ hud, onRematch, onSelectRoster }: GameOverModalProps) {
  const winner =
    hud.winnerSlot === 1
      ? FIGHTERS[hud.p1.id]
      : hud.winnerSlot === 2
      ? FIGHTERS[hud.p2.id]
      : null;

  return (
    <div className="absolute inset-0 z-40 bg-black/75 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-[#090B10] border-2 border-amber-400 p-6 sm:p-8 shadow-2xl">
        <div className="text-xs font-mono font-bold text-amber-400 tracking-widest mb-1">
          {hud.winnerSlot === 1 ? 'PLAYER 1 VICTORY' : hud.winnerSlot === 2 ? 'PLAYER 2 VICTORY' : 'DRAW'}
        </div>
        <h2 className="font-display text-5xl font-extrabold italic tracking-wide text-white leading-none">
          {winner ? `${winner.name} PREVAILS` : 'STALEMATE'}
        </h2>
        {winner && (
          <p className="text-slate-300 text-sm italic mt-2 mb-6">&ldquo;{winner.victoryQuote}&rdquo;</p>
        )}

        {/* Match Stats Breakdown */}
        <div className="grid grid-cols-3 gap-4 border-y border-slate-800 py-4 mb-6 text-center">
          <div>
            <div className="text-[11px] font-mono text-slate-400">P1 MAX COMBO</div>
            <div className="font-display text-3xl font-bold text-amber-400 tabular-nums mt-0.5">
              {hud.matchStats.p1MaxCombo} HITS
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400">TOTAL DAMAGE</div>
            <div className="font-display text-3xl font-bold text-white tabular-nums mt-0.5">
              {hud.matchStats.p1Damage}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400">CLASHES WON</div>
            <div className="font-display text-3xl font-bold text-sky-400 tabular-nums mt-0.5">
              {hud.matchStats.p1ClashesWon}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onSelectRoster}
            className="px-5 py-2.5 border border-slate-700 bg-[#111520] hover:border-slate-500 text-slate-200 text-sm font-medium flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Fighter Select
          </button>
          <button
            type="button"
            onClick={onRematch}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-display font-bold text-xl tracking-wider uppercase flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Rematch
          </button>
        </div>
      </div>
    </div>
  );
}
