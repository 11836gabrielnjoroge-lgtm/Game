import { useCallback, useEffect, useRef, useState } from 'react';
import { ClashOverlay } from './components/ClashOverlay';
import { ControlsModal } from './components/ControlsModal';
import { MatchHud } from './components/MatchHud';
import { GameOverModal, PauseModal } from './components/MatchModals';
import { SelectScreen } from './components/SelectScreen';
import { TitleScreen } from './components/TitleScreen';
import { TutorialOverlay } from './components/TutorialOverlay';
import { soundEngine } from './game/audio';
import { CombatEngine } from './game/engine';
import { ThreeArenaRenderer } from './game/threeRenderer';
import { DifficultyLevel, FighterId, GameMode, GameScreen, HudSnapshot, StageId } from './game/types';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [mode, setMode] = useState<GameMode>('ARCADE');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('HERO');
  const [p1Id, setP1Id] = useState<FighterId>('solaris');
  const [p2Id, setP2Id] = useState<FighterId>('nightwarden');
  const [stageId, setStageId] = useState<StageId>('metropolis');
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const threeMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CombatEngine | null>(null);
  const screenRef = useRef<GameScreen>(screen);
  screenRef.current = screen;
  const [hud, setHud] = useState<HudSnapshot | null>(null);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const launchMatch = useCallback(() => {
    soundEngine.playUiClick();
    if (!engineRef.current) {
      engineRef.current = new CombatEngine(p1Id, p2Id, stageId, mode, difficulty);
    } else {
      engineRef.current.initMatch(p1Id, p2Id, stageId, mode, difficulty);
    }
    setHud(engineRef.current.getHudSnapshot());
    setScreen('PLAYING');
  }, [p1Id, p2Id, stageId, mode, difficulty]);

  const startTutorial = useCallback(() => {
    soundEngine.playUiClick();
    setShowControls(false);
    setMode('TUTORIAL');
    if (!engineRef.current) {
      engineRef.current = new CombatEngine(p1Id, p2Id, stageId, 'TUTORIAL', difficulty);
    } else {
      engineRef.current.initMatch(p1Id, p2Id, stageId, 'TUTORIAL', difficulty);
    }
    setHud(engineRef.current.getHudSnapshot());
    setScreen('PLAYING');
  }, [p1Id, p2Id, stageId, difficulty]);

  const restartMatch = useCallback(() => {
    if (!engineRef.current) return;
    soundEngine.playUiClick();
    engineRef.current.initMatch(p1Id, p2Id, stageId, mode, difficulty);
    setHud(engineRef.current.getHudSnapshot());
    setScreen('PLAYING');
  }, [p1Id, p2Id, stageId, mode, difficulty]);

  const pauseMatch = useCallback(() => {
    if (!engineRef.current || engineRef.current.matchOver) return;
    engineRef.current.paused = true;
    engineRef.current.clearHeldKeys();
    setScreen('PAUSED');
  }, []);

  const resumeMatch = useCallback(() => {
    if (!engineRef.current) return;
    soundEngine.playUiClick();
    engineRef.current.paused = false;
    setScreen('PLAYING');
  }, []);

  // Global Keyboard Shortcuts for Title, Select, Pause, and Active Combat
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showControls) {
        if (e.code === 'Escape') {
          e.preventDefault();
          setShowControls(false);
        }
        return;
      }

      if (screen === 'TITLE') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          soundEngine.playUiClick();
          setScreen('SELECT');
        }
        return;
      }

      if (screen === 'SELECT') {
        if (e.code === 'Enter') {
          e.preventDefault();
          launchMatch();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          setScreen('TITLE');
        }
        return;
      }

      if (screen === 'PLAYING' || screen === 'PAUSED' || screen === 'CLASH') {
        if (e.code === 'Escape') {
          e.preventDefault();
          if (screen === 'PLAYING') pauseMatch();
          else if (screen === 'PAUSED') resumeMatch();
          return;
        }
      }

      const engine = engineRef.current;
      if (!engine) return;

      // Clash quick wager keys (0-4 for P1; Numpad0-4 for P2 in Versus)
      if (engine.clash && engine.clash.active && engine.clash.phase === 'WAGERING') {
        if (e.code === 'Digit0') engine.submitClashWager(1, 0);
        if (e.code === 'Digit1') engine.submitClashWager(1, 1);
        if (e.code === 'Digit2') engine.submitClashWager(1, 2);
        if (e.code === 'Digit3') engine.submitClashWager(1, 3);
        if (e.code === 'Digit4') engine.submitClashWager(1, 4);

        const p2Slot: 1 | 2 = mode === 'VERSUS_P2' ? 2 : 1;
        if (e.code === 'Numpad0') engine.submitClashWager(p2Slot, 0);
        if (e.code === 'Numpad1') engine.submitClashWager(p2Slot, 1);
        if (e.code === 'Numpad2') engine.submitClashWager(p2Slot, 2);
        if (e.code === 'Numpad3') engine.submitClashWager(p2Slot, 3);
        if (e.code === 'Numpad4') engine.submitClashWager(p2Slot, 4);
        return;
      }

      if (screen === 'PLAYING') {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
        engine.handleKeyDown(e.code);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      engineRef.current?.handleKeyUp(e.code);
    };

    const onBlur = () => {
      engineRef.current?.clearHeldKeys();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [screen, mode, showControls, launchMatch, pauseMatch, resumeMatch]);

  const inArena = screen === 'PLAYING' || screen === 'PAUSED' || screen === 'CLASH' || screen === 'GAME_OVER';

  // Isolated 60fps Three.js 3D WebGL Simulation & Render Loop (mounts once per arena session)
  useEffect(() => {
    if (!inArena || !threeMountRef.current) return;

    const container = threeMountRef.current;
    const threeRenderer = new ThreeArenaRenderer(container);
    const isSoftwareGl = threeRenderer.isSoftwareGl;

    const onResize = () => threeRenderer.resize();
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    let gameOverTimerId: number | null = null;
    let lastTime = performance.now();
    let elapsed = 0;
    let hudSyncAccum = 0;
    let gameOverTriggered = false;

    const afterDraw = (cb: () => void) => {
      const gl = threeRenderer.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      elapsed += dt;

      const engine = engineRef.current;
      if (engine) {
        engine.update(dt);
        threeRenderer.syncAndRender(engine, elapsed, dt);

        // Reset gameOverTriggered if user restarted match
        if (!engine.matchOver && gameOverTriggered) {
          gameOverTriggered = false;
        }

        hudSyncAccum += rawDt;
        const clashActive = Boolean(engine.clash?.active);
        const curScreen = screenRef.current;
        if (hudSyncAccum >= 0.04 || clashActive || engine.matchOver) {
          hudSyncAccum = 0;
          setHud(engine.getHudSnapshot());
        }

        if (clashActive && curScreen === 'PLAYING') {
          setScreen('CLASH');
        } else if (!clashActive && curScreen === 'CLASH') {
          setScreen('PLAYING');
        }

        if (engine.matchOver && !gameOverTriggered) {
          gameOverTriggered = true;
          gameOverTimerId = window.setTimeout(() => {
            setScreen((curr) => (curr === 'PLAYING' || curr === 'CLASH' ? 'GAME_OVER' : curr));
          }, 1650);
        }
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      if (gameOverTimerId !== null) window.clearTimeout(gameOverTimerId);
      window.removeEventListener('resize', onResize);
      threeRenderer.dispose();
    };
  }, [inArena]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#090B10]">
      {screen === 'TITLE' && (
        <TitleScreen
          mode={mode}
          onModeChange={(m) => {
            soundEngine.playUiClick();
            setMode(m);
          }}
          onStart={() => {
            soundEngine.playUiClick();
            setScreen('SELECT');
          }}
          onStartTutorial={startTutorial}
          onOpenControls={() => {
            soundEngine.playUiClick();
            setShowControls(true);
          }}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}

      {screen === 'SELECT' && (
        <SelectScreen
          mode={mode}
          p1Id={p1Id}
          p2Id={p2Id}
          stageId={stageId}
          difficulty={difficulty}
          onSelectP1={(id) => {
            soundEngine.playUiClick();
            setP1Id(id);
          }}
          onSelectP2={(id) => {
            soundEngine.playUiClick();
            setP2Id(id);
          }}
          onSelectStage={(id) => {
            soundEngine.playUiClick();
            setStageId(id);
          }}
          onSelectDifficulty={(d) => {
            soundEngine.playUiClick();
            setDifficulty(d);
          }}
          onBack={() => {
            soundEngine.playUiClick();
            setScreen('TITLE');
          }}
          onOpenControls={() => {
            soundEngine.playUiClick();
            setShowControls(true);
          }}
          onLaunch={launchMatch}
        />
      )}

      {inArena && (
        <div className="relative w-full h-full flex items-center justify-center bg-[#090B10]">
          {/* Dedicated Empty Mount Container for Three.js WebGL Canvas */}
          <div ref={threeMountRef} className="w-full h-full" />

          {/* Zero-Occlusion Perimeter HUD */}
          {hud && (
            <MatchHud
              hud={hud}
              mode={mode}
              muted={muted}
              onToggleMute={toggleMute}
              onPause={pauseMatch}
            />
          )}

          {/* Live Combat Dojo Drills in Tutorial Mode */}
          {mode === 'TUTORIAL' && screen === 'PLAYING' && hud && (
            <TutorialOverlay
              progress={hud.tutorial}
              onStartArcade={() => {
                soundEngine.playUiClick();
                setMode('ARCADE');
                setScreen('SELECT');
              }}
            />
          )}

          {/* Clash Wager Overlay */}
          {screen === 'CLASH' && hud && hud.clash && (
            <ClashOverlay
              clash={hud.clash}
              hud={hud}
              onWager={(slot, bars) => engineRef.current?.submitClashWager(slot, bars)}
            />
          )}

          {/* Pause & Move List Modal */}
          {screen === 'PAUSED' && hud && (
            <PauseModal
              hud={hud}
              mode={mode}
              onResume={resumeMatch}
              onRestart={restartMatch}
              onSelectRoster={() => {
                soundEngine.playUiClick();
                setScreen('SELECT');
              }}
              onOpenControls={() => {
                soundEngine.playUiClick();
                setShowControls(true);
              }}
            />
          )}

          {/* Game Over Victory / Stats Modal */}
          {screen === 'GAME_OVER' && hud && (
            <GameOverModal
              hud={hud}
              onRematch={restartMatch}
              onSelectRoster={() => {
                soundEngine.playUiClick();
                setScreen('SELECT');
              }}
            />
          )}
        </div>
      )}

      {/* Full Controls & Combat Guide Modal */}
      {showControls && (
        <ControlsModal
          onClose={() => {
            soundEngine.playUiClick();
            setShowControls(false);
          }}
          onStartTutorial={screen === 'TITLE' || screen === 'SELECT' ? startTutorial : undefined}
        />
      )}
    </main>
  );
}
