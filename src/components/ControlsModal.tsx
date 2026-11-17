import { useState } from 'react';
import { BookOpen, GraduationCap, Keyboard, Shield, X } from 'lucide-react';
import { FIGHTER_LIST } from '../game/roster';
import { FighterEmblem } from './FighterEmblem';

interface Props {
  onClose: () => void;
  onStartTutorial?: () => void;
}

type GuideTab = 'CONTROLS' | 'MECHANICS' | 'FIGHTERS';

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 bg-[#090B10] border border-slate-600 text-amber-300 font-mono text-xs font-bold">
      {children}
    </kbd>
  );
}

export function ControlsModal({ onClose, onStartTutorial }: Props) {
  const [tab, setTab] = useState<GuideTab>('CONTROLS');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Controls and Combat Tutorial Guide"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#090B10] border-2 border-slate-700 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-wider text-white uppercase leading-none">
              Controls &amp; Combat Guide
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Keyboard layout, guard rules, combos, traits, stage hazards, and clash wagers
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="w-10 h-10 bg-[#111520] border border-slate-700 hover:border-amber-400 text-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between gap-4 px-6 py-3 bg-[#111520] border-b border-slate-800 shrink-0 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[#090B10] border border-slate-800">
            <button
              type="button"
              onClick={() => setTab('CONTROLS')}
              className={`px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'CONTROLS' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Controls
            </button>
            <button
              type="button"
              onClick={() => setTab('MECHANICS')}
              className={`px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'MECHANICS' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Core Mechanics
            </button>
            <button
              type="button"
              onClick={() => setTab('FIGHTERS')}
              className={`px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'FIGHTERS' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Fighter Kits
            </button>
          </div>

          {onStartTutorial && (
            <button
              type="button"
              onClick={onStartTutorial}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold tracking-wide flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              Play Interactive Tutorial
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {tab === 'CONTROLS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player 1 Controls */}
              <div className="bg-[#111520] border border-slate-800 p-5 space-y-3">
                <div className="text-xs font-mono font-bold text-amber-400 tracking-wider border-b border-slate-800 pb-2">
                  PLAYER 1 CONTROLS
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Move Left / Right</span>
                    <div className="flex gap-1"><KeyCap>A</KeyCap><KeyCap>D</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Jump / Crouch</span>
                    <div className="flex gap-1"><KeyCap>W</KeyCap><KeyCap>S</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Block High / Block Low</span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      Hold <KeyCap>Back</KeyCap> / <KeyCap>S</KeyCap>+<KeyCap>Back</KeyCap>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between">
                    <span className="text-slate-300">Light / Medium / Heavy</span>
                    <div className="flex gap-1"><KeyCap>J</KeyCap><KeyCap>K</KeyCap><KeyCap>L</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Chain Target Combo</span>
                    <div className="flex items-center gap-1"><KeyCap>J</KeyCap><KeyCap>J</KeyCap><KeyCap>K</KeyCap><KeyCap>L</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Low Sweep (Hits standing guard)</span>
                    <div className="flex gap-1"><KeyCap>S</KeyCap><KeyCap>K</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Overhead (Breaks crouch guard)</span>
                    <div className="flex gap-1"><KeyCap>Fwd</KeyCap><KeyCap>K</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Rising Launcher</span>
                    <div className="flex gap-1"><KeyCap>S</KeyCap><KeyCap>L</KeyCap></div>
                  </div>
                  <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between">
                    <span className="text-slate-300">Character Trait</span>
                    <KeyCap>U</KeyCap>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Special 1 / Special 2</span>
                    <div className="flex gap-1"><KeyCap>I</KeyCap><KeyCap>O</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Stage Hazard (near glowing prop)</span>
                    <div className="flex items-center gap-1"><KeyCap>H</KeyCap> <span className="text-xs text-slate-500">or</span> <KeyCap>O</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Super Move (4 bars) / Clash</span>
                    <KeyCap>Space</KeyCap>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Clash Wager (during Clash)</span>
                    <div className="flex gap-1"><KeyCap>0</KeyCap><KeyCap>1</KeyCap><KeyCap>2</KeyCap><KeyCap>3</KeyCap><KeyCap>4</KeyCap></div>
                  </div>
                </div>
              </div>

              {/* Player 2 Controls */}
              <div className="bg-[#111520] border border-slate-800 p-5 space-y-3">
                <div className="text-xs font-mono font-bold text-red-400 tracking-wider border-b border-slate-800 pb-2">
                  PLAYER 2 CONTROLS (LOCAL VERSUS)
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Move / Jump / Crouch</span>
                    <div className="flex gap-1"><KeyCap>←</KeyCap><KeyCap>↑</KeyCap><KeyCap>↓</KeyCap><KeyCap>→</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Block High / Block Low</span>
                    <span className="text-xs text-slate-400">Hold away from P1 (+ ↓ for Low)</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between">
                    <span className="text-slate-300">Light / Medium / Heavy</span>
                    <div className="flex gap-1"><KeyCap>,</KeyCap><KeyCap>.</KeyCap><KeyCap>/</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Numpad Attacks (alt)</span>
                    <div className="flex gap-1"><KeyCap>Num1</KeyCap><KeyCap>Num2</KeyCap><KeyCap>Num3</KeyCap></div>
                  </div>
                  <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between">
                    <span className="text-slate-300">Character Trait</span>
                    <div className="flex gap-1"><KeyCap>;</KeyCap><KeyCap>Num4</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Special 1 / Special 2</span>
                    <div className="flex gap-1"><KeyCap>&apos;</KeyCap><KeyCap>[</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Super Move / Clash</span>
                    <div className="flex gap-1"><KeyCap>Enter</KeyCap><KeyCap>Num0</KeyCap></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Clash Wager</span>
                    <div className="flex gap-1"><KeyCap>Num0</KeyCap>–<KeyCap>Num4</KeyCap></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                  Tip: Press <KeyCap>Esc</KeyCap> anytime during a match to pause, inspect your fighter&apos;s move list, or restart.
                </div>
              </div>
            </div>
          )}

          {tab === 'MECHANICS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-[#111520] border border-slate-800 p-4">
                <h3 className="font-display text-xl font-bold text-white tracking-wide mb-1">
                  1. Dual Health Bars (Armor &amp; Crimson)
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Matches take place in one continuous battle. Every fighter starts on a Silver Armor Bar; when depleted, an Armor Shatter knockdown triggers and exposes their final Crimson Bar.
                </p>
              </div>
              <div className="bg-[#111520] border border-slate-800 p-4">
                <h3 className="font-display text-xl font-bold text-white tracking-wide mb-1">
                  2. High / Low / Overhead Defense
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Hold Back (away from your opponent) to block High, Mid, and Overhead strikes. Hold Down + Back to block Low Sweeps (S+K). Specials deal light chip damage through block.
                </p>
              </div>
              <div className="bg-[#111520] border border-slate-800 p-4">
                <h3 className="font-display text-xl font-bold text-white tracking-wide mb-1">
                  3. Target Combos &amp; Special Cancels
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Tap <KeyCap>J</KeyCap> → <KeyCap>J</KeyCap> → <KeyCap>K</KeyCap> → <KeyCap>L</KeyCap> on hit to chain fast target combos, or cancel any Light/Medium hit directly into Special 1 (<KeyCap>I</KeyCap>) or Special 2 (<KeyCap>O</KeyCap>).
                </p>
              </div>
              <div className="bg-[#111520] border border-slate-800 p-4">
                <h3 className="font-display text-xl font-bold text-white tracking-wide mb-1">
                  4. Interactive Stage Hazards
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Each arena contains two destructible props (crates, power coils, or stone monoliths). Stand near one when the <KeyCap>O</KeyCap> prompt lights up and press <KeyCap>H</KeyCap> or <KeyCap>O</KeyCap> for unblockable damage.
                </p>
              </div>
              <div className="bg-[#111520] border border-slate-800 p-4">
                <h3 className="font-display text-xl font-bold text-white tracking-wide mb-1">
                  5. Corner Stage Transitions
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Corner your opponent near the glowing amber left or right edge of the arena while their current bar is under 68%, then land a Heavy Strike (<KeyCap>L</KeyCap>) to smash them into the next stage!
                </p>
              </div>
              <div className="bg-[#111520] border border-slate-800 p-4">
                <h3 className="font-display text-xl font-bold text-white tracking-wide mb-1">
                  6. Clash Wagers &amp; Super Moves
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  At 4 bars of Super Meter, press <KeyCap>Space</KeyCap> for a cinematic Super Move. On your Crimson bar, press <KeyCap>Space</KeyCap> while getting hit to trigger a Clash wager (0–4 bars) to heal or deal massive damage!
                </p>
              </div>
            </div>
          )}

          {tab === 'FIGHTERS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIGHTER_LIST.map((f) => (
                <div key={f.id} className="bg-[#111520] border border-slate-800 p-4 space-y-2.5">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-2.5">
                    <FighterEmblem id={f.id} className="w-8 h-8" />
                    <div>
                      <div className="font-display text-xl font-extrabold text-white leading-none">{f.name}</div>
                      <div className="text-xs text-slate-400">{f.epithet} · {f.archetype}</div>
                    </div>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div>
                      <span className="text-amber-400 font-semibold">[U] {f.traitName}:</span>{' '}
                      <span className="text-slate-300">{f.traitDescription}</span>
                    </div>
                    <div>
                      <span className="text-sky-400 font-semibold">[I] {f.special1Name}:</span>{' '}
                      <span className="text-slate-300">{f.special1Desc}</span>
                    </div>
                    <div>
                      <span className="text-sky-400 font-semibold">[O] {f.special2Name}:</span>{' '}
                      <span className="text-slate-300">{f.special2Desc}</span>
                    </div>
                    <div>
                      <span className="text-red-400 font-semibold">[Space] {f.superName}:</span>{' '}
                      <span className="text-slate-300">{f.superDesc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
