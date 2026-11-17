import { ArrowLeft, BookOpen, Swords } from 'lucide-react';
import { FIGHTER_LIST, FIGHTERS, STAGE_LIST } from '../game/roster';
import { DifficultyLevel, FighterId, GameMode, StageId } from '../game/types';
import { FighterEmblem } from './FighterEmblem';

interface Props {
  mode: GameMode;
  p1Id: FighterId;
  p2Id: FighterId;
  stageId: StageId;
  difficulty: DifficultyLevel;
  onSelectP1: (id: FighterId) => void;
  onSelectP2: (id: FighterId) => void;
  onSelectStage: (id: StageId) => void;
  onSelectDifficulty: (d: DifficultyLevel) => void;
  onBack: () => void;
  onOpenControls: () => void;
  onLaunch: () => void;
}

export function SelectScreen({
  mode,
  p1Id,
  p2Id,
  stageId,
  difficulty,
  onSelectP1,
  onSelectP2,
  onSelectStage,
  onSelectDifficulty,
  onBack,
  onOpenControls,
  onLaunch,
}: Props) {
  const p1 = FIGHTERS[p1Id];
  const p2 = FIGHTERS[p2Id];

  return (
    <div className="w-full h-full bg-[#090B10] text-slate-100 flex flex-col justify-between p-6 lg:p-10 overflow-y-auto">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4 shrink-0 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 border border-slate-700 bg-[#111520] hover:border-slate-500 text-slate-200 text-sm font-medium flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Title
          </button>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-wider uppercase text-white leading-none">
              Assemble Combatants
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'ARCADE'
                ? 'Select your fighter, opponent, difficulty, and battleground'
                : mode === 'VERSUS_P2'
                ? 'Player 1 vs Player 2 Local Matchup'
                : mode === 'TUTORIAL'
                ? 'Guided Combat Dojo drills covering movement, combos, traits, hazards, and Supers'
                : 'Practice combos, Traits, and Super Moves with auto-regenerating health'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === 'ARCADE' && (
            <div className="flex items-center gap-1 p-1 bg-[#111520] border border-slate-800">
              {(['ROOKIE', 'HERO', 'GODLIKE'] as DifficultyLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onSelectDifficulty(lvl)}
                  className={`px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    difficulty === lvl ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl === 'ROOKIE' ? 'Rookie AI' : lvl === 'HERO' ? 'Hero AI' : 'Godlike AI'}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenControls}
            className="px-3.5 py-2 border border-slate-700 bg-[#111520] hover:border-amber-400 text-slate-200 text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            Controls &amp; Guide
          </button>
        </div>
      </div>

      {/* Main Selection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-5 flex-1 min-h-0 items-stretch">
        {/* Left: P1 Card */}
        <div className="lg:col-span-4 bg-[#111520] border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">PLAYER 1</span>
              <span className="text-xs text-slate-400">{p1.archetype}</span>
            </div>
            <div className="flex items-center gap-3.5 mb-3">
              <div
                className="w-14 h-14 flex items-center justify-center border border-slate-700 shrink-0"
                style={{ backgroundColor: `${p1.colors.primary}22` }}
              >
                <FighterEmblem id={p1.id} className="w-10 h-10" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-extrabold tracking-wide text-white leading-none">
                  {p1.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{p1.epithet}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{p1.summary}</p>

            {/* Stat Bars */}
            <div className="space-y-2 mb-4">
              {(
                [
                  { label: 'Power', val: p1.stats.power },
                  { label: 'Speed', val: p1.stats.speed },
                  { label: 'Defense', val: p1.stats.defense },
                ] as const
              ).map((s) => (
                <div key={s.label} className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-slate-400 font-medium">{s.label}</span>
                  <div className="flex-1 h-1.5 bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${s.val}%` }} />
                  </div>
                  <span className="w-7 text-right font-mono tabular-nums text-slate-300">{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Trait (U)</span>
              <span className="text-amber-300 font-semibold">{p1.traitName}</span>
            </div>
            <p className="text-slate-400 leading-snug">{p1.traitDescription}</p>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Super (Space)</span>
              <span className="text-red-400 font-semibold">{p1.superName}</span>
            </div>
          </div>
        </div>

        {/* Center: Roster Grid & Arena Strip */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          <div className="bg-[#111520] border border-slate-800 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-semibold text-slate-200">Select Fighter</span>
              <span>Click for P1 · Shift+Click for P2</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {FIGHTER_LIST.map((f) => {
                const isP1 = f.id === p1Id;
                const isP2 = f.id === p2Id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={(e) => {
                      if (e.shiftKey) onSelectP2(f.id);
                      else onSelectP1(f.id);
                    }}
                    className={`p-3 border text-left transition-colors cursor-pointer relative ${
                      isP1 && isP2
                        ? 'border-amber-400 bg-slate-800/80'
                        : isP1
                        ? 'border-amber-400 bg-amber-500/10'
                        : isP2
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-slate-800 bg-[#090B10] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <FighterEmblem id={f.id} className="w-7 h-7" />
                      <div className="flex gap-1.5 text-[11px] font-mono font-bold">
                        {isP1 && <span className="text-amber-400">P1</span>}
                        {isP2 && <span className="text-red-400">P2</span>}
                      </div>
                    </div>
                    <div className="font-display text-lg font-bold tracking-wide text-white leading-tight">
                      {f.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{f.archetype}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opponent quick selector */}
          <div className="bg-[#111520] border border-slate-800 p-4">
            <div className="text-xs font-semibold text-slate-200 mb-2.5">
              {mode === 'VERSUS_P2' ? 'Player 2 Fighter' : 'Opponent Fighter'}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {FIGHTER_LIST.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelectP2(f.id)}
                  className={`py-2 px-1 text-center border text-xs font-display font-bold tracking-wide transition-colors cursor-pointer ${
                    p2Id === f.id
                      ? 'border-red-500 bg-red-600/20 text-white'
                      : 'border-slate-800 bg-[#090B10] text-slate-400 hover:text-white'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Stage Selector */}
          <div className="bg-[#111520] border border-slate-800 p-4">
            <div className="text-xs font-semibold text-slate-200 mb-2.5">Battleground Stage</div>
            <div className="grid grid-cols-3 gap-2">
              {STAGE_LIST.map((st) => {
                const active = stageId === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onSelectStage(st.id)}
                    className={`relative h-20 overflow-hidden border text-left transition-colors cursor-pointer ${
                      active ? 'border-amber-400' : 'border-slate-800 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={st.imageUrl}
                      alt={st.name}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="relative z-10 h-full flex flex-col justify-end p-2">
                      <span className="font-display text-xs font-bold tracking-wide text-white leading-tight truncate">
                        {st.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: P2 / Opponent Card */}
        <div className="lg:col-span-4 bg-[#111520] border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-red-400 tracking-wider">
                {mode === 'VERSUS_P2' ? 'PLAYER 2' : 'OPPONENT'}
              </span>
              <span className="text-xs text-slate-400">{p2.archetype}</span>
            </div>
            <div className="flex items-center gap-3.5 mb-3">
              <div
                className="w-14 h-14 flex items-center justify-center border border-slate-700 shrink-0"
                style={{ backgroundColor: `${p2.colors.primary}22` }}
              >
                <FighterEmblem id={p2.id} className="w-10 h-10" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-extrabold tracking-wide text-white leading-none">
                  {p2.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{p2.epithet}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{p2.summary}</p>

            {/* Stat Bars */}
            <div className="space-y-2 mb-4">
              {(
                [
                  { label: 'Power', val: p2.stats.power },
                  { label: 'Speed', val: p2.stats.speed },
                  { label: 'Defense', val: p2.stats.defense },
                ] as const
              ).map((s) => (
                <div key={s.label} className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-slate-400 font-medium">{s.label}</span>
                  <div className="flex-1 h-1.5 bg-slate-800 overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${s.val}%` }} />
                  </div>
                  <span className="w-7 text-right font-mono tabular-nums text-slate-300">{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Trait</span>
              <span className="text-red-300 font-semibold">{p2.traitName}</span>
            </div>
            <p className="text-slate-400 leading-snug">{p2.traitDescription}</p>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Super Move</span>
              <span className="text-amber-400 font-semibold">{p2.superName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Launch Bar */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-800/80 pt-4 shrink-0">
        <div className="text-xs font-mono text-slate-400">
          {p1.name} vs {p2.name} · {STAGE_LIST.find((s) => s.id === stageId)?.name}
        </div>
        <button
          type="button"
          onClick={onLaunch}
          className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-display font-bold text-2xl tracking-wider uppercase flex items-center gap-3 whitespace-nowrap shrink-0 cursor-pointer shadow-[0_0_24px_rgba(220,38,38,0.4)]"
        >
          <Swords className="w-5 h-5" />
          Start Match
        </button>
      </div>
    </div>
  );
}
