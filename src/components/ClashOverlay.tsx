import { ClashState, HudSnapshot } from '../game/types';

interface Props {
  clash: ClashState;
  hud: HudSnapshot;
  onWager: (slot: 1 | 2, bars: number) => void;
}

export function ClashOverlay({ clash, hud, onWager }: Props) {
  const p1MaxBars = Math.floor(hud.p1.superMeter / 100);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 pointer-events-auto bg-black/55">
      <div className="w-full max-w-3xl bg-[#090B10] border-2 border-amber-400 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <div className="text-xs font-mono font-bold text-amber-400 tracking-widest">
              CLASH WAGER SHOWDOWN
            </div>
            <h2 className="font-display text-4xl font-extrabold italic tracking-wide text-white mt-0.5">
              {clash.phase === 'WAGERING' ? 'WAGER YOUR SUPER METER' : 'CLASH RESOLVED'}
            </h2>
          </div>
          <div className="font-mono text-3xl font-bold tabular-nums text-amber-400 border border-slate-700 px-4 py-1.5 bg-[#111520]">
            {Math.ceil(Math.max(0, clash.timer))}s
          </div>
        </div>

        {/* Fighter Clash Banter */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111520] border border-slate-800 p-4">
            <div className="text-xs font-mono text-amber-400 mb-1">{hud.p1.name}</div>
            <p className="text-sm text-slate-200 italic">&ldquo;{clash.quote1}&rdquo;</p>
            <div className="mt-3 text-xs font-mono text-slate-400 tabular-nums">
              {clash.phase === 'REVEAL'
                ? `WAGERED: ${clash.p1Wager ?? 0} BARS`
                : clash.p1Wager !== null
                ? 'WAGER LOCKED'
                : `AVAILABLE: ${p1MaxBars} BARS`}
            </div>
          </div>

          <div className="bg-[#111520] border border-slate-800 p-4 text-right">
            <div className="text-xs font-mono text-red-400 mb-1">{hud.p2.name}</div>
            <p className="text-sm text-slate-200 italic">&ldquo;{clash.quote2}&rdquo;</p>
            <div className="mt-3 text-xs font-mono text-slate-400 tabular-nums">
              {clash.phase === 'REVEAL'
                ? `WAGERED: ${clash.p2Wager ?? 0} BARS`
                : clash.p2Wager !== null
                ? 'WAGER LOCKED'
                : 'DECIDING...'}
            </div>
          </div>
        </div>

        {clash.phase === 'WAGERING' ? (
          <div>
            <div className="text-xs font-mono text-slate-400 mb-2.5">
              Select bars to wager (Keys 0–4) — Winner heals or deals massive bonus damage
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {[0, 1, 2, 3, 4].map((bars) => {
                const disabled = bars > p1MaxBars || clash.p1Wager !== null;
                const selected = clash.p1Wager === bars;
                return (
                  <button
                    key={bars}
                    type="button"
                    disabled={disabled}
                    onClick={() => onWager(1, bars)}
                    className={`py-3 font-display text-2xl font-bold tracking-wider border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : disabled
                        ? 'bg-[#111520] text-slate-600 border-slate-800 cursor-not-allowed'
                        : 'bg-[#111520] hover:bg-amber-500/20 hover:border-amber-400 text-white border-slate-700'
                    }`}
                  >
                    {bars} {bars === 1 ? 'BAR' : 'BARS'}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-2 font-display text-3xl font-extrabold tracking-wider text-amber-400">
            {clash.winnerSlot === 1
              ? `${hud.p1.name} WINS THE CLASH!`
              : clash.winnerSlot === 2
              ? `${hud.p2.name} WINS THE CLASH!`
              : 'EVEN CLASH — STALEMATE!'}
          </div>
        )}
      </div>
    </div>
  );
}
