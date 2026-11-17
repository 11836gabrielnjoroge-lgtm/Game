import { BookOpen, GraduationCap, Volume2, VolumeX } from 'lucide-react';
import { TITLE_KEY_ART_URL } from '../game/roster';
import { GameMode } from '../game/types';

interface Props {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onStart: () => void;
  onStartTutorial: () => void;
  onOpenControls: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export function TitleScreen({
  mode,
  onModeChange,
  onStart,
  onStartTutorial,
  onOpenControls,
  muted,
  onToggleMute,
}: Props) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#090B10]">
      {/* Illustrated Key-Art Backdrop with gentle parallax drift */}
      <img
        src={TITLE_KEY_ART_URL}
        alt="Apex: Gods Fall key art"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-right animate-title-drift pointer-events-none"
      />

      {/* Directional contrast scrim leaving 35-45% calm negative space on the left */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(9,11,16,0.96) 0%, rgba(9,11,16,0.88) 38%, rgba(9,11,16,0.38) 68%, rgba(9,11,16,0.18) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(9,11,16,0.45) 0%, transparent 25%, transparent 78%, rgba(9,11,16,0.92) 100%)',
        }}
      />

      {/* Top-right audio & controls guide */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenControls}
          className="h-11 px-4 flex items-center gap-2 border border-slate-700/80 bg-[#111520]/85 text-slate-200 hover:text-amber-400 hover:border-amber-400/60 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          Controls &amp; Guide
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="w-11 h-11 flex items-center justify-center border border-slate-700/80 bg-[#111520]/85 text-slate-200 hover:text-amber-400 hover:border-amber-400/60 transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Left-aligned Title Lockup & Primary Action */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 sm:px-14 lg:px-20 max-w-2xl">
        {/* Bespoke inline SVG Title Lockup */}
        <svg
          viewBox="0 0 540 165"
          className="w-full max-w-[490px] mb-5 drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
          role="img"
          aria-label="APEX: GODS FALL"
        >
          <defs>
            <linearGradient id="apex-steel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="55%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <linearGradient id="apex-gold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          {/* Angular emblem slash */}
          <polygon points="0,12 18,12 10,104 0,104" fill="#DC2626" />
          <polygon points="24,12 31,12 23,104 16,104" fill="#F59E0B" />
          <text
            x="48"
            y="92"
            fill="url(#apex-steel)"
            fontFamily="Barlow Condensed, sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="94"
            letterSpacing="4"
          >
            APEX
          </text>
          <rect x="48" y="108" width="380" height="3" fill="url(#apex-gold)" />
          <text
            x="48"
            y="148"
            fill="#FBBF24"
            fontFamily="Barlow Condensed, sans-serif"
            fontWeight="700"
            fontSize="38"
            letterSpacing="11"
          >
            GODS FALL
          </text>
        </svg>

        <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-md mb-7">
          Dual-bar superhero combat with signature Character Traits, interactive arena hazards, stage transitions, and high-stakes Clash wagers.
        </p>

        {/* Mode Segmented Control */}
        <div className="inline-flex self-start p-1 bg-[#111520] border border-slate-800 mb-6 flex-wrap" role="group" aria-label="Game mode">
          {(
            [
              { id: 'ARCADE', label: '1P Arcade' },
              { id: 'VERSUS_P2', label: '2P Local Versus' },
              { id: 'TRAINING', label: 'Training Lab' },
              { id: 'TUTORIAL', label: 'Combat Tutorial' },
            ] as const
          ).map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onModeChange(item.id)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Primary Start CTA + Tutorial Quick Launch */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={onStart}
            className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-display font-bold text-2xl tracking-wider uppercase transition-transform active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer shadow-[0_0_28px_rgba(220,38,38,0.45)]"
          >
            Enter Arena
          </button>
          <button
            type="button"
            onClick={onStartTutorial}
            className="px-5 py-3.5 border border-slate-700 bg-[#111520]/90 hover:border-amber-400 text-slate-100 font-display font-bold text-xl tracking-wider uppercase flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <GraduationCap className="w-5 h-5 text-amber-400" />
            Tutorial Dojo
          </button>
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="absolute bottom-5 inset-x-0 z-10 px-8 sm:px-14 lg:px-20 flex items-center justify-between text-xs font-mono text-slate-400 pointer-events-none">
        <span>
          WASD Move &amp; Block · J/K/L Light/Med/Heavy · U Trait · I/O Specials · H/O Hazard · Space Super / Clash · Esc Pause
        </span>
      </div>
    </div>
  );
}
