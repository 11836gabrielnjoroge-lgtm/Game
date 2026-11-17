import { CheckCircle2, Circle, Swords } from 'lucide-react';
import { TutorialProgress } from '../game/types';

interface Props {
  progress: TutorialProgress;
  onStartArcade: () => void;
}

interface DrillStep {
  id: string;
  title: string;
  hint: string;
  done: boolean;
}

export function TutorialOverlay({ progress, onStartArcade }: Props) {
  const drills: DrillStep[] = [
    {
      id: 'move',
      title: 'Move, Jump & Crouch',
      hint: 'Press A / D to move, W to jump, and S to crouch',
      done: progress.moved && progress.jumped && progress.crouched,
    },
    {
      id: 'combo',
      title: 'Land a 3-Hit Target Combo',
      hint: 'Chain hits quickly: J → J → K (or J → K → L)',
      done: progress.combo3,
    },
    {
      id: 'mixup',
      title: 'Low Sweep or Overhead',
      hint: 'Hit opponent with S + K (Low Sweep) or Fwd + K (Overhead)',
      done: progress.mixup,
    },
    {
      id: 'powers',
      title: 'Character Trait & Special Move',
      hint: 'Press U to trigger your Trait, then I or O for a Special',
      done: progress.traitUsed && progress.specialUsed,
    },
    {
      id: 'hazard',
      title: 'Trigger a Stage Hazard',
      hint: 'Walk near a glowing arena prop and press H or O',
      done: progress.interactableUsed,
    },
    {
      id: 'super',
      title: 'Unleash a Super Move',
      hint: 'Get close with 4 Super Bars and press Space',
      done: progress.superLanded,
    },
  ];

  const completedCount = drills.filter((d) => d.done).length;
  const allComplete = completedCount === drills.length;
  const activeDrill = drills.find((d) => !d.done) ?? drills[drills.length - 1];

  return (
    <div className="absolute top-28 left-4 sm:left-6 z-20 w-72 sm:w-80 pointer-events-none">
      <div className="bg-[#090B10]/90 border border-slate-700 p-3.5 shadow-xl pointer-events-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
          <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
            COMBAT DOJO DRILLS
          </span>
          <span className="text-xs font-mono text-slate-300 tabular-nums">
            {completedCount}/{drills.length}
          </span>
        </div>

        {/* Active Highlighted Instruction */}
        {!allComplete ? (
          <div className="bg-[#111520] border border-amber-400/60 p-2.5 mb-2.5">
            <div className="text-xs font-bold text-white">{activeDrill.title}</div>
            <div className="text-[11px] font-mono text-amber-300 mt-0.5 leading-snug">
              {activeDrill.hint}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/60 border border-emerald-500 p-2.5 mb-2.5">
            <div className="text-xs font-bold text-emerald-300">All Drills Complete!</div>
            <p className="text-[11px] text-slate-200 mt-0.5 mb-2">
              You have mastered movement, combos, mix-ups, traits, hazards, and Super Moves.
            </p>
            <button
              type="button"
              onClick={onStartArcade}
              className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-base tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              Enter Arcade Match
            </button>
          </div>
        )}

        {/* Compact Checklist */}
        <ul className="space-y-1.5">
          {drills.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-xs">
              {d.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className={d.done ? 'text-slate-400 line-through' : 'text-slate-200'}>
                {d.title}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
