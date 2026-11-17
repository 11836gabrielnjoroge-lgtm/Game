import { soundEngine } from './audio';
import { ArenaRenderer, FLOOR_Y, VIEW_WIDTH, WORLD_WIDTH } from './renderer';
import { FIGHTERS, STAGES } from './roster';
import {
  ClashState,
  DifficultyLevel,
  FighterId,
  FighterState,
  FloatingCallout,
  GameMode,
  HudSnapshot,
  MoveDefinition,
  MoveId,
  Particle,
  Projectile,
  StageId,
  StageProp,
  StageTransitionState,
  SuperCinematicState,
  TutorialProgress,
} from './types';

export interface PlayerInputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  justUp: boolean;
  justLight: boolean;
  justMedium: boolean;
  justHeavy: boolean;
  justSpecial1: boolean;
  justSpecial2: boolean;
  justTrait: boolean;
  justInteract: boolean;
  justSuper: boolean;
}

const GRAVITY = 2150;
const ARENA_MIN_X = 72;
const ARENA_MAX_X = WORLD_WIDTH - 72;
const FIGHTER_RADIUS = 38;

export class CombatEngine {
  private renderer = new ArenaRenderer();

  public mode: GameMode = 'ARCADE';
  public difficulty: DifficultyLevel = 'HERO';
  public stageId: StageId = 'metropolis';

  public p1!: FighterState;
  public p2!: FighterState;
  public props: StageProp[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public callouts: FloatingCallout[] = [];

  public timerSeconds = 99;
  public matchElapsed = 0;
  public paused = false;
  public matchOver = false;
  public winnerSlot: 1 | 2 | 0 | null = null;

  public hitstopTimer = 0;
  public shakeTimer = 0;
  public shakeIntensity = 0;
  public cameraX = (WORLD_WIDTH - VIEW_WIDTH) / 2;

  public bannerText: string | null = 'FIGHT!';
  public bannerSubtext: string | null = 'ARMOR BAR ENGAGED';
  private bannerTimer = 1.6;

  public superCinematic: SuperCinematicState = {
    active: false,
    attackerSlot: 1,
    timer: 0,
    duration: 0.95,
    impactTriggered: false,
    moveName: '',
  };

  public stageTransition: StageTransitionState = {
    active: false,
    timer: 0,
    duration: 0.95,
    fromStageName: '',
    toStageId: 'watchtower',
    attackerSlot: 1,
  };

  public clash: ClashState | null = null;

  private nextId = 1;
  private totalTime = 0;
  private weatherTimer = 0;

  // AI state
  private aiDecisionTimer = 0;
  private aiMoveDir: -1 | 0 | 1 = 0;
  private aiCrouch = false;
  private aiBlockTimer = 0;

  // P1 & P2 input trackers
  private heldKeys = new Set<string>();
  private bufferedActions: { slot: 1 | 2; action: keyof PlayerInputState; expires: number }[] = [];

  public tutorial: TutorialProgress = {
    moved: false,
    jumped: false,
    crouched: false,
    combo3: false,
    mixup: false,
    traitUsed: false,
    specialUsed: false,
    interactableUsed: false,
    superLanded: false,
  };

  constructor(
    p1Id: FighterId,
    p2Id: FighterId,
    stageId: StageId,
    mode: GameMode,
    difficulty: DifficultyLevel
  ) {
    this.initMatch(p1Id, p2Id, stageId, mode, difficulty);
  }

  public initMatch(
    p1Id: FighterId,
    p2Id: FighterId,
    stageId: StageId,
    mode: GameMode,
    difficulty: DifficultyLevel
  ) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.stageId = stageId;
    this.p1 = this.createFighter(1, p1Id, WORLD_WIDTH / 2 - 220, 1);
    this.p2 = this.createFighter(2, p2Id, WORLD_WIDTH / 2 + 220, -1);

    if (mode === 'TRAINING' || mode === 'TUTORIAL') {
      this.p1.superMeter = 400;
      this.p2.superMeter = 400;
    }

    this.tutorial = {
      moved: false,
      jumped: false,
      crouched: false,
      combo3: false,
      mixup: false,
      traitUsed: false,
      specialUsed: false,
      interactableUsed: false,
      superLanded: false,
    };

    this.loadStageProps(stageId);
    this.projectiles = [];
    this.particles = [];
    this.callouts = [];
    this.timerSeconds = 99;
    this.matchElapsed = 0;
    this.paused = false;
    this.matchOver = false;
    this.winnerSlot = null;
    this.hitstopTimer = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.cameraX = (WORLD_WIDTH - VIEW_WIDTH) / 2;
    this.clash = null;
    this.superCinematic.active = false;
    this.stageTransition.active = false;
    this.bannerText = mode === 'TUTORIAL' ? 'COMBAT DOJO' : 'FIGHT!';
    this.bannerSubtext = mode === 'TUTORIAL' ? 'COMPLETE DRILLS ABOVE' : `${STAGES[stageId].name.toUpperCase()}`;
    this.bannerTimer = 1.75;
    this.heldKeys.clear();
    this.bufferedActions = [];
  }

  private createFighter(slot: 1 | 2, id: FighterId, x: number, facing: 1 | -1): FighterState {
    const profile = FIGHTERS[id];
    return {
      slot,
      profile,
      x,
      y: FLOOR_Y,
      vx: 0,
      vy: 0,
      facing,
      grounded: true,
      crouching: false,
      blocking: false,
      armorHp: profile.maxArmorHp,
      crimsonHp: profile.maxCrimsonHp,
      activeBar: 'armor',
      superMeter: 0,
      traitCharge: 100,
      traitActiveTimer: 0,
      action: 'idle',
      currentMove: null,
      moveElapsedFrames: 0,
      hitConfirmed: false,
      queuedMove: null,
      stunTimer: 0,
      invulnTimer: 0,
      hitFlashTimer: 0,
      barBreakFlash: 0,
      comboCount: 0,
      comboTakenCount: 0,
      comboTakenDamage: 0,
      comboResetTimer: 0,
      clashUsed: false,
      dronesCount: 0,
      afterimages: [],
      afterimageTimer: 0,
      animTime: 0,
      maxComboDealt: 0,
      totalDamageDealt: 0,
      clashesWon: 0,
      superMovesLanded: 0,
    };
  }

  private loadStageProps(stageId: StageId) {
    const stage = STAGES[stageId];
    this.props = stage.props.map((p) => ({
      ...p,
      cooldown: 0,
      flashTimer: 0,
    }));
  }

  public clearHeldKeys() {
    this.heldKeys.clear();
  }

  public handleKeyDown(code: string) {
    if (this.heldKeys.has(code)) return;
    this.heldKeys.add(code);

    const now = this.totalTime;
    const exp = now + 0.16;

    // P1 edge-triggered actions (WASD + J/K/L + U/I/O + Space)
    if (code === 'KeyW') this.bufferedActions.push({ slot: 1, action: 'justUp', expires: exp });
    if (code === 'KeyJ') this.bufferedActions.push({ slot: 1, action: 'justLight', expires: exp });
    if (code === 'KeyK') this.bufferedActions.push({ slot: 1, action: 'justMedium', expires: exp });
    if (code === 'KeyL') this.bufferedActions.push({ slot: 1, action: 'justHeavy', expires: exp });
    if (code === 'KeyU') this.bufferedActions.push({ slot: 1, action: 'justTrait', expires: exp });
    if (code === 'KeyI') this.bufferedActions.push({ slot: 1, action: 'justSpecial1', expires: exp });
    if (code === 'KeyO') this.bufferedActions.push({ slot: 1, action: 'justSpecial2', expires: exp });
    if (code === 'KeyH') this.bufferedActions.push({ slot: 1, action: 'justInteract', expires: exp });
    if (code === 'Space') this.bufferedActions.push({ slot: 1, action: 'justSuper', expires: exp });

    // Also allow O as Interact when near prop OR Special 2 when not near prop (super intuitive!)
    if (code === 'KeyO') {
      const nearProp = this.getNearProp(this.p1);
      if (nearProp) {
        this.bufferedActions.push({ slot: 1, action: 'justInteract', expires: exp });
      }
    }

    // P2 edge-triggered actions in 2P Local Versus (Arrow keys + Numpad / UIOP / , . /)
    if (this.mode === 'VERSUS_P2') {
      if (code === 'ArrowUp') this.bufferedActions.push({ slot: 2, action: 'justUp', expires: exp });
      if (code === 'Numpad1' || code === 'Comma') this.bufferedActions.push({ slot: 2, action: 'justLight', expires: exp });
      if (code === 'Numpad2' || code === 'Period') this.bufferedActions.push({ slot: 2, action: 'justMedium', expires: exp });
      if (code === 'Numpad3' || code === 'Slash') this.bufferedActions.push({ slot: 2, action: 'justHeavy', expires: exp });
      if (code === 'Numpad4' || code === 'Semicolon') this.bufferedActions.push({ slot: 2, action: 'justTrait', expires: exp });
      if (code === 'Numpad5' || code === 'Quote') this.bufferedActions.push({ slot: 2, action: 'justSpecial1', expires: exp });
      if (code === 'Numpad6' || code === 'BracketLeft') this.bufferedActions.push({ slot: 2, action: 'justSpecial2', expires: exp });
      if (code === 'Numpad0' || code === 'Enter') this.bufferedActions.push({ slot: 2, action: 'justSuper', expires: exp });
    }
  }

  public handleKeyUp(code: string) {
    this.heldKeys.delete(code);
  }

  public submitClashWager(slot: 1 | 2, bars: number) {
    if (!this.clash || !this.clash.active || this.clash.phase !== 'WAGERING') return;
    const f = slot === 1 ? this.p1 : this.p2;
    const maxBars = Math.floor(f.superMeter / 100);
    const clamped = Math.max(0, Math.min(maxBars, bars));
    if (slot === 1) {
      this.clash.p1Wager = clamped;
    } else {
      this.clash.p2Wager = clamped;
    }
    soundEngine.playUiClick();

    // Auto-submit AI wager immediately if 1P mode
    if (this.mode !== 'VERSUS_P2' && this.clash.p2Wager === null) {
      const aiMax = Math.floor(this.p2.superMeter / 100);
      if (aiMax === 0) {
        this.clash.p2Wager = 0;
      } else {
        const want = this.difficulty === 'GODLIKE' ? aiMax : Math.min(aiMax, Math.floor(Math.random() * (aiMax + 1)));
        this.clash.p2Wager = want;
      }
    }

    if (this.clash.p1Wager !== null && this.clash.p2Wager !== null) {
      this.resolveClash();
    }
  }

  private resolveClash() {
    if (!this.clash) return;
    const w1 = this.clash.p1Wager ?? 0;
    const w2 = this.clash.p2Wager ?? 0;
    this.p1.superMeter = Math.max(0, this.p1.superMeter - w1 * 100);
    this.p2.superMeter = Math.max(0, this.p2.superMeter - w2 * 100);

    this.clash.phase = 'REVEAL';
    this.clash.timer = 1.35;

    if (w1 > w2) {
      this.clash.winnerSlot = 1;
      this.p1.clashesWon += 1;
    } else if (w2 > w1) {
      this.clash.winnerSlot = 2;
      this.p2.clashesWon += 1;
    } else {
      this.clash.winnerSlot = 0;
    }

    soundEngine.playHit('heavy');
  }

  private applyClashOutcome() {
    if (!this.clash) return;
    const winnerSlot = this.clash.winnerSlot;
    const initiator = this.clash.initiatorSlot;

    if (winnerSlot !== 0) {
      const winner = winnerSlot === 1 ? this.p1 : this.p2;
      const loser = winnerSlot === 1 ? this.p2 : this.p1;
      const diff = Math.abs((this.clash.p1Wager ?? 0) - (this.clash.p2Wager ?? 0));
      const pct = 0.1 + diff * 0.06;

      if (winnerSlot === initiator) {
        // Defender won clash -> heals Crimson health!
        const healAmt = Math.round(winner.profile.maxCrimsonHp * pct);
        winner.crimsonHp = Math.min(winner.profile.maxCrimsonHp, winner.crimsonHp + healAmt);
        this.spawnCallout(winner.x, winner.y - 165, `CLASH HEAL +${healAmt}`, undefined, '#10B981');
      } else {
        // Attacker won clash -> heavy bonus damage!
        const dmgAmt = Math.round(loser.profile.maxCrimsonHp * pct);
        this.applyDamage(winner, loser, dmgAmt, false);
        this.spawnCallout(loser.x, loser.y - 165, `CLASH CRUSH -${dmgAmt}`, undefined, '#EF4444');
      }

      // Knock both apart explosively
      winner.vx = -winner.facing * 260;
      loser.vx = -loser.facing * 520;
      loser.vy = -260;
      loser.grounded = false;
      loser.action = 'knockdown';
      loser.stunTimer = 0.7;
    } else {
      this.p1.vx = -this.p1.facing * 320;
      this.p2.vx = -this.p2.facing * 320;
      this.spawnCallout(WORLD_WIDTH / 2, FLOOR_Y - 180, 'CLASH DRAW', undefined, '#FBBF24');
    }

    this.spawnRing(WORLD_WIDTH / 2, FLOOR_Y - 90, '#FBBF24');
    this.shakeTimer = 0.35;
    this.shakeIntensity = 18;
    this.clash = null;
  }

  public update(rawDt: number) {
    if (this.paused) return;
    const dt = Math.min(rawDt, 0.05);
    this.totalTime += dt;

    // Update banner
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.bannerText = null;
        this.bannerSubtext = null;
      }
    }

    // Screen shake decay
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    }

    // Update particles even during cinematics/hitstop for visual continuity
    this.updateParticles(dt);
    this.updateCallouts(dt);
    this.spawnAmbientWeather(dt);

    // Clash Wager state pauses main combat
    if (this.clash && this.clash.active) {
      this.clash.timer -= dt;
      if (this.clash.phase === 'WAGERING' && this.clash.timer <= 0) {
        if (this.clash.p1Wager === null) this.clash.p1Wager = 0;
        if (this.clash.p2Wager === null) this.clash.p2Wager = 0;
        this.resolveClash();
      } else if (this.clash.phase === 'REVEAL' && this.clash.timer <= 0) {
        this.applyClashOutcome();
      }
      return;
    }

    // Stage Transition cinematic
    if (this.stageTransition.active) {
      this.stageTransition.timer -= dt;
      if (this.stageTransition.timer <= this.stageTransition.duration * 0.45 && this.stageId !== this.stageTransition.toStageId) {
        this.stageId = this.stageTransition.toStageId;
        this.loadStageProps(this.stageId);
        this.p1.x = WORLD_WIDTH / 2 - 220;
        this.p2.x = WORLD_WIDTH / 2 + 220;
        this.p1.y = FLOOR_Y;
        this.p2.y = FLOOR_Y;
        this.bannerText = STAGES[this.stageId].name.toUpperCase();
        this.bannerSubtext = 'STAGE TRANSITION';
        this.bannerTimer = 1.6;
      }
      if (this.stageTransition.timer <= 0) {
        this.stageTransition.active = false;
      }
      this.updateCamera(dt);
      return;
    }

    // Super Cinematic freeze
    if (this.superCinematic.active) {
      this.superCinematic.timer -= dt;
      if (!this.superCinematic.impactTriggered && this.superCinematic.timer <= this.superCinematic.duration * 0.42) {
        this.superCinematic.impactTriggered = true;
        const attacker = this.superCinematic.attackerSlot === 1 ? this.p1 : this.p2;
        const defender = this.superCinematic.attackerSlot === 1 ? this.p2 : this.p1;
        this.executeSuperImpact(attacker, defender);
      }
      if (this.superCinematic.timer <= 0) {
        this.superCinematic.active = false;
      }
      this.updateCamera(dt);
      return;
    }

    // Hitstop freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Match timer
    if (!this.matchOver && this.mode !== 'TRAINING' && this.mode !== 'TUTORIAL') {
      this.matchElapsed += dt;
      this.timerSeconds = Math.max(0, this.timerSeconds - dt);
      if (this.timerSeconds <= 0) {
        this.resolveTimeOver();
      }
    }

    // Training / Tutorial auto-regen
    if ((this.mode === 'TRAINING' || this.mode === 'TUTORIAL') && !this.matchOver) {
      if (this.p2.comboTakenCount === 0 && this.p2.comboResetTimer <= 0) {
        this.p2.armorHp = Math.min(this.p2.profile.maxArmorHp, this.p2.armorHp + 260 * dt);
        this.p2.crimsonHp = this.p2.profile.maxCrimsonHp;
        this.p2.activeBar = 'armor';
      }
      this.p1.superMeter = Math.min(400, this.p1.superMeter + 70 * dt);
      if (this.mode === 'TUTORIAL') {
        this.p1.traitCharge = Math.min(100, this.p1.traitCharge + 35 * dt);
      }
    }

    // Stage prop cooldowns
    for (const prop of this.props) {
      if (prop.cooldown > 0) prop.cooldown = Math.max(0, prop.cooldown - dt);
      if (prop.flashTimer > 0) prop.flashTimer = Math.max(0, prop.flashTimer - dt);
    }

    // Prune expired input buffer
    this.bufferedActions = this.bufferedActions.filter((b) => b.expires >= this.totalTime);

    if (!this.matchOver) {
      const p1Input = this.readPlayerInput(1);
      const p2Input = this.mode === 'VERSUS_P2' ? this.readPlayerInput(2) : this.computeAiInput(dt);

      // Update facing when idle/walking
      this.updateFacing(this.p1, this.p2);
      this.updateFacing(this.p2, this.p1);

      // Time dilation from Voltaire's Chrono-Surge Trait
      const p1TimeScale = this.p2.profile.id === 'voltaire' && this.p2.traitActiveTimer > 0 ? 0.52 : 1;
      const p2TimeScale = this.p1.profile.id === 'voltaire' && this.p1.traitActiveTimer > 0 ? 0.52 : 1;

      this.updateFighter(this.p1, this.p2, p1Input, dt * p1TimeScale);
      this.updateFighter(this.p2, this.p1, p2Input, dt * p2TimeScale);
    } else {
      // Let KO physics settle
      this.updateFighterPhysicsOnly(this.p1, dt);
      this.updateFighterPhysicsOnly(this.p2, dt);
    }

    // Fighter pushbox separation
    this.resolvePushboxes();

    // Update projectiles & check collisions
    this.updateProjectiles(dt);

    // Update camera
    this.updateCamera(dt);
  }

  private consumeBufferedAction(slot: 1 | 2, action: keyof PlayerInputState): boolean {
    const idx = this.bufferedActions.findIndex((b) => b.slot === slot && b.action === action);
    if (idx !== -1) {
      this.bufferedActions.splice(idx, 1);
      return true;
    }
    return false;
  }

  private readPlayerInput(slot: 1 | 2): PlayerInputState {
    if (slot === 1) {
      return {
        left: this.heldKeys.has('KeyA'),
        right: this.heldKeys.has('KeyD'),
        up: this.heldKeys.has('KeyW'),
        down: this.heldKeys.has('KeyS'),
        justUp: this.consumeBufferedAction(1, 'justUp'),
        justLight: this.consumeBufferedAction(1, 'justLight'),
        justMedium: this.consumeBufferedAction(1, 'justMedium'),
        justHeavy: this.consumeBufferedAction(1, 'justHeavy'),
        justSpecial1: this.consumeBufferedAction(1, 'justSpecial1'),
        justSpecial2: this.consumeBufferedAction(1, 'justSpecial2'),
        justTrait: this.consumeBufferedAction(1, 'justTrait'),
        justInteract: this.consumeBufferedAction(1, 'justInteract'),
        justSuper: this.consumeBufferedAction(1, 'justSuper'),
      };
    }

    return {
      left: this.heldKeys.has('ArrowLeft'),
      right: this.heldKeys.has('ArrowRight'),
      up: this.heldKeys.has('ArrowUp'),
      down: this.heldKeys.has('ArrowDown'),
      justUp: this.consumeBufferedAction(2, 'justUp'),
      justLight: this.consumeBufferedAction(2, 'justLight'),
      justMedium: this.consumeBufferedAction(2, 'justMedium'),
      justHeavy: this.consumeBufferedAction(2, 'justHeavy'),
      justSpecial1: this.consumeBufferedAction(2, 'justSpecial1'),
      justSpecial2: this.consumeBufferedAction(2, 'justSpecial2'),
      justTrait: this.consumeBufferedAction(2, 'justTrait'),
      justInteract: this.consumeBufferedAction(2, 'justInteract'),
      justSuper: this.consumeBufferedAction(2, 'justSuper'),
    };
  }

  private computeAiInput(dt: number): PlayerInputState {
    const empty: PlayerInputState = {
      left: false,
      right: false,
      up: false,
      down: false,
      justUp: false,
      justLight: false,
      justMedium: false,
      justHeavy: false,
      justSpecial1: false,
      justSpecial2: false,
      justTrait: false,
      justInteract: false,
      justSuper: false,
    };

    if (this.mode === 'TRAINING' || this.mode === 'TUTORIAL') return empty;

    const ai = this.p2;
    const player = this.p1;
    const dist = Math.abs(ai.x - player.x);
    const dirToPlayer: -1 | 1 = player.x > ai.x ? 1 : -1;

    const aggr = this.difficulty === 'ROOKIE' ? 0.35 : this.difficulty === 'HERO' ? 0.65 : 0.9;
    const reactChance = this.difficulty === 'ROOKIE' ? 0.25 : this.difficulty === 'HERO' ? 0.55 : 0.82;

    // Trigger Clash defensively on Crimson bar
    if (
      ai.action === 'hitstun' &&
      ai.activeBar === 'crimson' &&
      !ai.clashUsed &&
      ai.superMeter >= 100 &&
      ai.crimsonHp < ai.profile.maxCrimsonHp * 0.55 &&
      Math.random() < (this.difficulty === 'ROOKIE' ? 0.02 : 0.06)
    ) {
      this.triggerClash(2);
      return empty;
    }

    if (this.aiBlockTimer > 0) {
      this.aiBlockTimer -= dt;
      empty.left = dirToPlayer === 1;
      empty.right = dirToPlayer === -1;
      empty.down = this.aiCrouch;
      return empty;
    }

    // Reactive blocking when player attacks nearby
    if (player.action === 'attack' && dist < 175 && Math.random() < reactChance * dt * 18) {
      this.aiBlockTimer = 0.28 + Math.random() * 0.2;
      this.aiCrouch = player.currentMove?.hitHeight === 'low';
      empty.left = dirToPlayer === 1;
      empty.right = dirToPlayer === -1;
      empty.down = this.aiCrouch;
      return empty;
    }

    this.aiDecisionTimer -= dt;
    if (this.aiDecisionTimer <= 0) {
      this.aiDecisionTimer = (this.difficulty === 'ROOKIE' ? 0.32 : this.difficulty === 'HERO' ? 0.18 : 0.1) + Math.random() * 0.12;

      // Super Move if full meter and in range
      if (ai.superMeter >= 400 && dist < 240 && Math.random() < aggr * 0.6) {
        empty.justSuper = true;
        return empty;
      }

      // Trait activation
      if (ai.traitCharge >= 100 && Math.random() < aggr * 0.38) {
        empty.justTrait = true;
        return empty;
      }

      // Stage interactable
      const nearProp = this.getNearProp(ai);
      if (nearProp && dist < 220 && Math.random() < aggr * 0.5) {
        empty.justInteract = true;
        return empty;
      }

      if (dist > 280) {
        this.aiMoveDir = Math.random() < 0.8 ? dirToPlayer : 0;
        if (Math.random() < aggr * 0.38) {
          empty.justSpecial1 = true;
        } else if (Math.random() < aggr * 0.25) {
          empty.justSpecial2 = true;
        }
      } else if (dist > 125) {
        this.aiMoveDir = Math.random() < 0.72 ? dirToPlayer : (Math.random() < 0.5 ? -dirToPlayer as -1 | 1 : 0);
        const r = Math.random();
        if (r < aggr * 0.32) empty.justSpecial2 = true;
        else if (r < aggr * 0.56) empty.justMedium = true;
        else if (r < aggr * 0.72) empty.justHeavy = true;
        else if (r < aggr * 0.8 && ai.grounded) empty.justUp = true;
      } else {
        // Close combat range
        this.aiMoveDir = 0;
        const r = Math.random();
        if (r < aggr * 0.35) empty.justLight = true;
        else if (r < aggr * 0.62) empty.justMedium = true;
        else if (r < aggr * 0.78) empty.justHeavy = true;
        else if (r < aggr * 0.88) {
          empty.down = true;
          empty.justMedium = true;
        } else {
          this.aiMoveDir = (-dirToPlayer) as -1 | 1;
        }
      }
    }

    // Combo continuation
    if (ai.action === 'attack' && ai.hitConfirmed && ai.currentMove?.id === 'light' && Math.random() < aggr * 0.7) {
      empty.justLight = true;
    } else if (ai.action === 'attack' && ai.hitConfirmed && ai.currentMove?.id === 'light2' && Math.random() < aggr * 0.65) {
      empty.justMedium = true;
    }

    if (this.aiMoveDir === -1) empty.left = true;
    if (this.aiMoveDir === 1) empty.right = true;
    return empty;
  }

  private updateFacing(f: FighterState, opp: FighterState) {
    if (f.grounded && (f.action === 'idle' || f.action === 'walk' || f.action === 'crouch')) {
      if (Math.abs(opp.x - f.x) > 8) {
        f.facing = opp.x > f.x ? 1 : -1;
      }
    }
  }

  private getNearProp(f: FighterState): StageProp | null {
    for (const p of this.props) {
      if (p.cooldown <= 0 && Math.abs(f.x - p.x) < 92 && f.grounded) {
        return p;
      }
    }
    return null;
  }

  private updateFighter(f: FighterState, opp: FighterState, input: PlayerInputState, dt: number) {
    f.animTime += dt;
    if (f.invulnTimer > 0) f.invulnTimer = Math.max(0, f.invulnTimer - dt);
    if (f.hitFlashTimer > 0) f.hitFlashTimer = Math.max(0, f.hitFlashTimer - dt);
    if (f.barBreakFlash > 0) f.barBreakFlash = Math.max(0, f.barBreakFlash - dt);

    // Trait active & recharge
    if (f.traitActiveTimer > 0) {
      f.traitActiveTimer = Math.max(0, f.traitActiveTimer - dt);
    } else if (f.traitCharge < 100) {
      f.traitCharge = Math.min(100, f.traitCharge + (100 / f.profile.traitCooldown) * dt);
    }

    // Combo reset decay
    if (f.comboTakenCount > 0 && f.action !== 'hitstun' && f.action !== 'knockdown') {
      f.comboResetTimer -= dt;
      if (f.comboResetTimer <= 0) {
        f.comboTakenCount = 0;
        f.comboTakenDamage = 0;
      }
    }

    // Afterimages decay
    for (let i = f.afterimages.length - 1; i >= 0; i--) {
      f.afterimages[i].alpha -= dt * 3.5;
      if (f.afterimages[i].alpha <= 0) f.afterimages.splice(i, 1);
    }
    if (f.profile.id === 'voltaire' && (Math.abs(f.vx) > 220 || f.traitActiveTimer > 0)) {
      f.afterimageTimer -= dt;
      if (f.afterimageTimer <= 0) {
        f.afterimageTimer = 0.045;
        f.afterimages.push({
          x: f.x,
          y: f.y,
          facing: f.facing,
          alpha: 0.9,
          color: f.profile.colors.accent,
          action: f.action,
        });
      }
    }

    // Clash trigger check when Defender is in hitstun on Crimson Bar
    if (input.justSuper && f.action === 'hitstun' && f.activeBar === 'crimson' && !f.clashUsed && f.superMeter >= 100) {
      this.triggerClash(f.slot);
      return;
    }

    // Stun / Knockdown recovery
    if (f.action === 'hitstun' || f.action === 'blockstun' || f.action === 'knockdown') {
      f.stunTimer -= dt;
      if (f.stunTimer <= 0 && f.grounded) {
        const wasKnockdown = f.action === 'knockdown';
        f.action = 'idle';
        f.currentMove = null;
        if (wasKnockdown) f.invulnTimer = 0.22;
      }
      this.updateFighterPhysicsOnly(f, dt);
      return;
    }

    // Active attack frame progression
    if (f.action === 'attack' && f.currentMove) {
      const prevFrame = Math.floor(f.moveElapsedFrames);
      f.moveElapsedFrames += dt * 60;
      const curFrame = Math.floor(f.moveElapsedFrames);
      const m = f.currentMove;

      // Queue chain combo during attack
      if (f.hitConfirmed && !f.queuedMove) {
        if (m.id === 'light' && input.justLight) f.queuedMove = 'light2';
        else if ((m.id === 'light' || m.id === 'light2') && input.justMedium) f.queuedMove = 'medium';
        else if ((m.id === 'light2' || m.id === 'medium') && input.justHeavy) f.queuedMove = 'heavy';
        else if ((m.id === 'light' || m.id === 'light2' || m.id === 'medium') && input.justSpecial1) f.queuedMove = 'special1';
        else if ((m.id === 'light' || m.id === 'light2' || m.id === 'medium') && input.justSpecial2) f.queuedMove = 'special2';
      }

      // Trigger special / projectile / teleport on startup completion
      if (prevFrame < m.startup && curFrame >= m.startup) {
        if (m.isProjectile) {
          this.spawnProjectile(f);
          soundEngine.playSpecial(f.profile.id === 'solaris' ? 320 : 520);
        } else if (m.isTeleport) {
          // Morrigan Shadow Blink behind opponent
          this.spawnSparks(f.x, f.y - 75, f.profile.colors.glow, 12);
          f.x = Math.max(ARENA_MIN_X, Math.min(ARENA_MAX_X, opp.x + opp.facing * -88));
          f.facing = opp.x > f.x ? 1 : -1;
          this.spawnSparks(f.x, f.y - 75, f.profile.colors.glow, 12);
          soundEngine.playSpecial(260);
        } else if (m.lungeX) {
          f.vx = f.facing * m.lungeX;
        }
      }

      // Active hitbox check
      if (curFrame >= m.startup && curFrame < m.startup + m.active && !f.hitConfirmed && !m.isProjectile && m.hitbox.width > 0) {
        this.checkMeleeHit(f, opp, m);
      }

      // Cancel into queued combo move
      if (f.queuedMove && curFrame >= m.startup + 2) {
        const nextId = f.queuedMove;
        f.queuedMove = null;
        this.startMove(f, nextId);
        this.updateFighterPhysicsOnly(f, dt);
        return;
      }

      // Move end
      if (curFrame >= m.startup + m.active + m.recovery) {
        f.action = f.grounded ? 'idle' : 'jump';
        f.currentMove = null;
        f.hitConfirmed = false;
        f.queuedMove = null;
      }

      this.updateFighterPhysicsOnly(f, dt);
      return;
    }

    // Neutral Movement & Blocking
    const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const holdingBack = moveDir !== 0 && moveDir !== f.facing;
    f.crouching = f.grounded && input.down;
    f.blocking = f.grounded && holdingBack;

    // 1. Super Move (Space when 400 meter)
    if (input.justSuper && f.superMeter >= 400 && f.grounded) {
      if (f.slot === 1) this.tutorial.superLanded = true;
      this.triggerSuperMove(f, opp);
      return;
    }

    // 2. Stage Interactable
    if (input.justInteract) {
      const prop = this.getNearProp(f);
      if (prop) {
        if (f.slot === 1) this.tutorial.interactableUsed = true;
        prop.cooldown = prop.maxCooldown;
        prop.flashTimer = 0.3;
        this.spawnSparks(prop.x, prop.y - 40, '#FBBF24', 16);
        this.spawnCallout(prop.x, prop.y - 105, prop.label.toUpperCase(), 'STAGE INTERACTABLE', '#FBBF24');
        soundEngine.playSpecial(210);
        this.startMove(f, 'interactable');
        return;
      }
    }

    // 3. Character Trait (U)
    if (input.justTrait) {
      if (f.profile.id === 'nightwarden' && f.dronesCount > 0) {
        // Fire one drone!
        if (f.slot === 1) this.tutorial.traitUsed = true;
        f.dronesCount -= 1;
        this.spawnDroneBolt(f, opp);
        soundEngine.playSpecial(680);
      } else if (f.traitCharge >= 100 && f.traitActiveTimer <= 0) {
        if (f.slot === 1) this.tutorial.traitUsed = true;
        f.traitCharge = 0;
        if (f.profile.id === 'nightwarden') {
          f.dronesCount = 3;
          this.spawnCallout(f.x, f.y - 145, 'SWARM DRONES', '3 DEPLOYED', f.profile.colors.accent);
        } else {
          f.traitActiveTimer = f.profile.id === 'voltaire' ? 4.5 : 6.0;
          this.spawnCallout(f.x, f.y - 145, f.profile.traitName.toUpperCase(), 'TRAIT ACTIVE', f.profile.colors.glow);
        }
        this.spawnRing(f.x, f.y - 75, f.profile.colors.glow);
        soundEngine.playSpecial(520);
      }
    }

    // 4. Special Moves
    if (input.justSpecial1 && f.grounded) {
      if (f.slot === 1) this.tutorial.specialUsed = true;
      this.startMove(f, 'special1');
      return;
    }
    if (input.justSpecial2 && f.grounded) {
      if (f.slot === 1) this.tutorial.specialUsed = true;
      this.startMove(f, 'special2');
      return;
    }

    // 5. Normal Attacks
    if (!f.grounded && (input.justLight || input.justMedium || input.justHeavy)) {
      this.startMove(f, 'air_kick');
      return;
    }
    if (f.grounded) {
      const holdingForward = moveDir === f.facing;
      if (input.justLight) {
        this.startMove(f, 'light');
        return;
      }
      if (input.justMedium) {
        if (input.down) this.startMove(f, 'low_sweep');
        else if (holdingForward) this.startMove(f, 'overhead');
        else this.startMove(f, 'medium');
        return;
      }
      if (input.justHeavy) {
        if (input.down) this.startMove(f, 'uppercut');
        else this.startMove(f, 'heavy');
        return;
      }
    }

    // 6. Jump
    if (input.justUp && f.grounded) {
      if (f.slot === 1) this.tutorial.jumped = true;
      f.vy = -f.profile.jumpForce;
      f.vx = moveDir * f.profile.walkSpeed * 0.92;
      f.grounded = false;
      f.crouching = false;
      f.blocking = false;
      f.action = 'jump';
      this.spawnSparks(f.x, FLOOR_Y, '#94A3B8', 6);
    }

    // 7. Ground Walk / Crouch / Idle
    if (f.grounded) {
      if (f.crouching) {
        if (f.slot === 1) this.tutorial.crouched = true;
        f.vx = 0;
        f.action = 'crouch';
      } else if (moveDir !== 0) {
        if (f.slot === 1) this.tutorial.moved = true;
        const speedMult = holdingBack ? 0.78 : 1.0;
        f.vx = moveDir * f.profile.walkSpeed * speedMult;
        f.action = 'walk';
      } else {
        f.vx = 0;
        f.action = 'idle';
      }
    }

    this.updateFighterPhysicsOnly(f, dt);
  }

  private startMove(f: FighterState, moveId: MoveId) {
    const move = f.profile.moves[moveId];
    f.action = 'attack';
    f.currentMove = move;
    f.moveElapsedFrames = 0;
    f.hitConfirmed = false;
    f.queuedMove = null;
    f.blocking = false;
    if (f.grounded) f.vx *= 0.25;

    f.superMeter = Math.min(400, f.superMeter + move.meterGainWhiff);
    soundEngine.playWhiff(moveId === 'heavy' || moveId === 'uppercut');
  }

  private triggerSuperMove(attacker: FighterState, _defender: FighterState) {
    attacker.superMeter = 0;
    attacker.superMovesLanded += 1;
    this.superCinematic = {
      active: true,
      attackerSlot: attacker.slot,
      timer: 0.95,
      duration: 0.95,
      impactTriggered: false,
      moveName: attacker.profile.superName,
    };
    this.bannerText = attacker.profile.superName.toUpperCase();
    this.bannerSubtext = `${attacker.profile.name} SUPER MOVE`;
    this.bannerTimer = 1.3;
    soundEngine.playSuperFlash();
  }

  private executeSuperImpact(attacker: FighterState, defender: FighterState) {
    const dist = Math.abs(attacker.x - defender.x);
    if (dist < 480) {
      const dmg = attacker.profile.moves.super.damage;
      attacker.x = Math.max(ARENA_MIN_X, Math.min(ARENA_MAX_X, defender.x - attacker.facing * 75));
      this.applyDamage(attacker, defender, dmg, false);
      defender.vx = attacker.facing * 520;
      defender.vy = -420;
      defender.grounded = false;
      defender.action = 'knockdown';
      defender.stunTimer = 0.8;
      this.spawnSparks(defender.x, defender.y - 80, attacker.profile.colors.glow, 32);
      this.spawnRing(defender.x, defender.y - 80, attacker.profile.colors.accent);
      this.shakeTimer = 0.45;
      this.shakeIntensity = 24;
      soundEngine.playHit('super');
    } else {
      this.spawnCallout(attacker.x, attacker.y - 140, 'WHIFF!', undefined, '#94A3B8');
    }
  }

  private triggerClash(initiatorSlot: 1 | 2) {
    const f = initiatorSlot === 1 ? this.p1 : this.p2;
    f.clashUsed = true;
    this.clash = {
      active: true,
      initiatorSlot,
      phase: 'WAGERING',
      timer: 4.0,
      p1Wager: null,
      p2Wager: null,
      winnerSlot: 0,
      quote1: this.p1.profile.clashLine,
      quote2: this.p2.profile.clashLine,
    };
    this.p1.x = WORLD_WIDTH / 2 - 90;
    this.p2.x = WORLD_WIDTH / 2 + 90;
    this.p1.y = FLOOR_Y;
    this.p2.y = FLOOR_Y;
    this.p1.facing = 1;
    this.p2.facing = -1;
    soundEngine.playClashTrigger();
  }

  private checkMeleeHit(attacker: FighterState, defender: FighterState, move: MoveDefinition) {
    if (defender.invulnTimer > 0 || defender.action === 'ko') return;

    const hbX = attacker.x + attacker.facing * move.hitbox.offsetX - move.hitbox.width / 2;
    const hbY = attacker.y + move.hitbox.offsetY;
    const hbW = move.hitbox.width;
    const hbH = move.hitbox.height;

    const defH = defender.crouching ? 88 : 138;
    const defX = defender.x - FIGHTER_RADIUS;
    const defY = defender.y - defH;
    const defW = FIGHTER_RADIUS * 2;

    const overlaps =
      hbX < defX + defW &&
      hbX + hbW > defX &&
      hbY < defY + defH &&
      hbY + hbH > defY;

    if (!overlaps) return;

    attacker.hitConfirmed = true;
    attacker.superMeter = Math.min(400, attacker.superMeter + move.meterGainHit);

    const isBlocked = this.checkBlockSuccess(defender, move.hitHeight);

    if (isBlocked) {
      defender.action = 'blockstun';
      defender.stunTimer = move.blockstun / 60;
      defender.vx = attacker.facing * (move.knockbackX * 0.45);
      defender.superMeter = Math.min(400, defender.superMeter + 12);
      this.applyDamage(attacker, defender, move.chipDamage, true);
      this.spawnSparks((attacker.x + defender.x) / 2, defender.y - 80, '#38BDF8', 8);
      this.hitstopTimer = move.hitstop * 0.65;
      soundEngine.playBlock();
      return;
    }

    // Stage Transition Check! (Heavy attack near arena wall while defender < 65% of current bar)
    const atLeftCorner = defender.x <= ARENA_MIN_X + 65 && attacker.facing === -1;
    const atRightCorner = defender.x >= ARENA_MAX_X - 65 && attacker.facing === 1;
    const curBarPct =
      defender.activeBar === 'armor'
        ? defender.armorHp / defender.profile.maxArmorHp
        : defender.crimsonHp / defender.profile.maxCrimsonHp;

    if (move.id === 'heavy' && (atLeftCorner || atRightCorner) && curBarPct < 0.68 && !this.stageTransition.active) {
      const bonusDmg = 135;
      this.applyDamage(attacker, defender, bonusDmg, false);
      const nextStageId = STAGES[this.stageId].nextStageId;
      this.stageTransition = {
        active: true,
        timer: 0.95,
        duration: 0.95,
        fromStageName: STAGES[this.stageId].name,
        toStageId: nextStageId,
        attackerSlot: attacker.slot,
      };
      this.spawnSparks(defender.x, defender.y - 85, '#FBBF24', 28);
      this.shakeTimer = 0.4;
      this.shakeIntensity = 22;
      soundEngine.playArmorShatter();
      return;
    }

    // Clean Hit!
    const traitBonus = attacker.profile.id === 'solaris' && attacker.traitActiveTimer > 0 ? 1.28 : 1;
    // Combo damage scaling (like Injustice: prevents infinite 100% touches)
    const scale = Math.max(0.45, 1 - defender.comboTakenCount * 0.09);
    const dmg = Math.round(move.damage * traitBonus * scale);

    this.applyDamage(attacker, defender, dmg, false);

    // Morrigan Blood Sigil lifesteal
    if (attacker.profile.id === 'morrigan' && attacker.traitActiveTimer > 0) {
      const heal = Math.round(dmg * 0.35);
      if (attacker.activeBar === 'armor') {
        attacker.armorHp = Math.min(attacker.profile.maxArmorHp, attacker.armorHp + heal);
      } else {
        attacker.crimsonHp = Math.min(attacker.profile.maxCrimsonHp, attacker.crimsonHp + heal);
      }
    }

    defender.hitFlashTimer = 0.11;
    defender.vx = attacker.facing * move.knockbackX;
    if (move.knockbackY !== 0) {
      defender.vy = move.knockbackY;
      defender.grounded = false;
    }

    if (move.knockdown) {
      defender.action = 'knockdown';
      defender.stunTimer = 0.65;
    } else {
      defender.action = 'hitstun';
      defender.stunTimer = move.hitstun / 60;
    }

    defender.comboTakenCount += 1;
    defender.comboTakenDamage += dmg;
    defender.comboResetTimer = 0.85;
    attacker.maxComboDealt = Math.max(attacker.maxComboDealt, defender.comboTakenCount);

    if (attacker.slot === 1) {
      if (defender.comboTakenCount >= 3) this.tutorial.combo3 = true;
      if (move.id === 'low_sweep' || move.id === 'overhead') this.tutorial.mixup = true;
    }

    this.hitstopTimer = move.hitstop;
    this.shakeTimer = 0.14;
    this.shakeIntensity = move.screenShake;

    this.spawnSparks(
      (attacker.x + defender.x) / 2,
      defender.y - (move.hitHeight === 'low' ? 30 : 88),
      attacker.profile.colors.glow,
      move.id === 'heavy' ? 18 : 11
    );

    if (move.id === 'heavy' || move.id === 'uppercut') {
      soundEngine.playHit('heavy');
    } else if (move.id === 'medium' || move.id === 'overhead' || move.id === 'special2') {
      soundEngine.playHit('medium');
    } else {
      soundEngine.playHit('light');
    }
  }

  private checkBlockSuccess(defender: FighterState, hitHeight: MoveDefinition['hitHeight']): boolean {
    if (hitHeight === 'unblockable') return false;
    const canBlockState = defender.action === 'idle' || defender.action === 'walk' || defender.action === 'crouch' || defender.action === 'blockstun';
    if (!canBlockState || !defender.blocking) return false;
    if (hitHeight === 'low' && !defender.crouching) return false;
    if (hitHeight === 'overhead' && defender.crouching) return false;
    return true;
  }

  private applyDamage(attacker: FighterState, defender: FighterState, amount: number, isChip: boolean) {
    if (amount <= 0) return;
    attacker.totalDamageDealt += amount;
    defender.superMeter = Math.min(400, defender.superMeter + Math.round(amount * 0.2));

    if (defender.activeBar === 'armor') {
      defender.armorHp = Math.max(0, defender.armorHp - amount);
      if (defender.armorHp <= 0) {
        // Signature Injustice Armor Bar Shatter Transition!
        defender.activeBar = 'crimson';
        defender.barBreakFlash = 0.55;
        defender.action = 'knockdown';
        defender.stunTimer = 0.85;
        defender.vy = -340;
        defender.vx = -defender.facing * 380;
        defender.grounded = false;
        defender.invulnTimer = 0.9;
        this.spawnShards(defender.x, defender.y - 85, '#E2E8F0', 22);
        this.spawnCallout(defender.x, defender.y - 165, 'ARMOR SHATTERED!', 'FINAL BAR', '#EF4444');
        this.bannerText = 'ARMOR BROKEN!';
        this.bannerSubtext = `${defender.profile.name} ON FINAL BAR`;
        this.bannerTimer = 1.4;
        this.hitstopTimer = 0.14;
        this.shakeTimer = 0.35;
        this.shakeIntensity = 18;
        soundEngine.playArmorShatter();
      }
    } else {
      // Chip damage cannot KO unless unblockable/non-chip
      const minHp = isChip ? 1 : 0;
      defender.crimsonHp = Math.max(minHp, defender.crimsonHp - amount);
      if (defender.crimsonHp <= 0 && !this.matchOver) {
        this.triggerKO(attacker, defender);
      }
    }
  }

  private triggerKO(winner: FighterState, loser: FighterState) {
    this.matchOver = true;
    this.winnerSlot = winner.slot;
    loser.action = 'ko';
    loser.vy = -380;
    loser.vx = -loser.facing * 420;
    loser.grounded = false;
    this.bannerText = 'KNOCKOUT!';
    this.bannerSubtext = `${winner.profile.name} WINS`;
    this.bannerTimer = 5.0;
    this.hitstopTimer = 0.18;
    this.shakeTimer = 0.5;
    this.shakeIntensity = 24;
    soundEngine.playKO();
  }

  private resolveTimeOver() {
    this.matchOver = true;
    const p1Total = this.p1.armorHp + this.p1.crimsonHp;
    const p2Total = this.p2.armorHp + this.p2.crimsonHp;
    if (p1Total > p2Total) {
      this.winnerSlot = 1;
      this.bannerText = 'TIME OVER';
      this.bannerSubtext = `${this.p1.profile.name} WINS`;
    } else if (p2Total > p1Total) {
      this.winnerSlot = 2;
      this.bannerText = 'TIME OVER';
      this.bannerSubtext = `${this.p2.profile.name} WINS`;
    } else {
      this.winnerSlot = 0;
      this.bannerText = 'DRAW GAME';
      this.bannerSubtext = 'DOUBLE STALEMATE';
    }
    this.bannerTimer = 5.0;
    soundEngine.playKO();
  }

  private spawnProjectile(f: FighterState) {
    const kind: Projectile['kind'] =
      f.profile.id === 'solaris' ? 'beam' : f.profile.id === 'nightwarden' ? 'batarang' : 'bolt';
    const speed = f.profile.id === 'solaris' ? 880 : f.profile.id === 'voltaire' ? 940 : 720;

    this.projectiles.push({
      id: this.nextId++,
      ownerSlot: f.slot,
      x: f.x + f.facing * 56,
      y: f.y - 96,
      vx: f.facing * speed,
      vy: 0,
      radius: 15,
      damage: f.profile.moves.special1.damage,
      chipDamage: f.profile.moves.special1.chipDamage,
      color: f.profile.colors.accent,
      coreColor: f.profile.colors.glow,
      kind,
      life: 1.6,
      hitHeight: 'mid',
    });
  }

  private spawnDroneBolt(f: FighterState, opp: FighterState) {
    const dx = opp.x - f.x;
    const dy = opp.y - 80 - (f.y - 115);
    const len = Math.max(1, Math.hypot(dx, dy));
    const speed = 820;
    this.projectiles.push({
      id: this.nextId++,
      ownerSlot: f.slot,
      x: f.x + f.facing * 24,
      y: f.y - 115,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      radius: 11,
      damage: 48,
      chipDamage: 10,
      color: '#0EA5E9',
      coreColor: '#E0F2FE',
      kind: 'drone',
      life: 1.4,
      hitHeight: 'mid',
    });
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const opp = p.ownerSlot === 1 ? this.p2 : this.p1;
      const attacker = p.ownerSlot === 1 ? this.p1 : this.p2;
      const slowMult = attacker.slot === 1 && this.p2.profile.id === 'voltaire' && this.p2.traitActiveTimer > 0
        ? 0.52
        : attacker.slot === 2 && this.p1.profile.id === 'voltaire' && this.p1.traitActiveTimer > 0
        ? 0.52
        : 1;

      p.x += p.vx * dt * slowMult;
      p.y += p.vy * dt * slowMult;
      p.life -= dt;

      if (p.life <= 0 || p.x < -60 || p.x > WORLD_WIDTH + 60) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (opp.invulnTimer > 0 || opp.action === 'ko') continue;

      const defH = opp.crouching ? 88 : 138;
      const hitX = Math.abs(p.x - opp.x) < FIGHTER_RADIUS + p.radius;
      const hitY = p.y > opp.y - defH && p.y < opp.y;

      if (hitX && hitY) {
        const blocked = this.checkBlockSuccess(opp, p.hitHeight);
        if (blocked) {
          this.applyDamage(attacker, opp, p.chipDamage, true);
          opp.action = 'blockstun';
          opp.stunTimer = 0.2;
          opp.vx = Math.sign(p.vx) * 140;
          this.spawnSparks(p.x, p.y, '#38BDF8', 8);
          soundEngine.playBlock();
        } else {
          this.applyDamage(attacker, opp, p.damage, false);
          opp.hitFlashTimer = 0.1;
          opp.action = 'hitstun';
          opp.stunTimer = 0.28;
          opp.vx = Math.sign(p.vx) * 210;
          opp.comboTakenCount += 1;
          opp.comboTakenDamage += p.damage;
          opp.comboResetTimer = 0.85;
          attacker.maxComboDealt = Math.max(attacker.maxComboDealt, opp.comboTakenCount);
          attacker.superMeter = Math.min(400, attacker.superMeter + 24);
          this.spawnSparks(p.x, p.y, p.coreColor, 14);
          this.shakeTimer = 0.1;
          this.shakeIntensity = 7;
          soundEngine.playHit('medium');
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateFighterPhysicsOnly(f: FighterState, dt: number) {
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    if (!f.grounded) {
      f.vy += GRAVITY * dt;
      if (f.y >= FLOOR_Y) {
        f.y = FLOOR_Y;
        f.vy = 0;
        f.grounded = true;
        if (f.action === 'jump') {
          f.action = 'idle';
        }
      }
    } else {
      // Ground friction during stun/attacks
      if (f.action !== 'walk') {
        f.vx *= Math.pow(0.001, dt);
        if (Math.abs(f.vx) < 8) f.vx = 0;
      }
    }

    f.x = Math.max(ARENA_MIN_X, Math.min(ARENA_MAX_X, f.x));
  }

  private resolvePushboxes() {
    const minDist = FIGHTER_RADIUS * 1.75;
    const dx = this.p2.x - this.p1.x;
    const dy = Math.abs(this.p2.y - this.p1.y);
    if (Math.abs(dx) < minDist && dy < 110) {
      const overlap = (minDist - Math.abs(dx)) / 2;
      const sign = dx >= 0 ? 1 : -1;
      this.p1.x = Math.max(ARENA_MIN_X, Math.min(ARENA_MAX_X, this.p1.x - sign * overlap));
      this.p2.x = Math.max(ARENA_MIN_X, Math.min(ARENA_MAX_X, this.p2.x + sign * overlap));
    }
  }

  private updateCamera(dt: number) {
    const midX = (this.p1.x + this.p2.x) / 2;
    const targetX = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, midX - VIEW_WIDTH / 2));
    this.cameraX += (targetX - this.cameraX) * Math.min(1, dt * 8);
  }

  private spawnSparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 440;
      const life = 0.22 + Math.random() * 0.26;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 2.5 + Math.random() * 4,
        color,
        alpha: 1,
        life,
        maxLife: life,
        gravity: 420,
        kind: 'spark',
      });
    }
  }

  private spawnShards(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 180 + Math.random() * 500;
      const life = 0.45 + Math.random() * 0.35;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 140,
        size: 5 + Math.random() * 6,
        color,
        alpha: 1,
        life,
        maxLife: life,
        gravity: 1100,
        kind: 'shard',
      });
    }
  }

  private spawnRing(x: number, y: number, color: string) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 16,
      color,
      alpha: 0.9,
      life: 0.32,
      maxLife: 0.32,
      gravity: 0,
      kind: 'ring',
    });
  }

  private spawnCallout(x: number, y: number, text: string, subtext: string | undefined, color: string) {
    this.callouts.push({
      id: this.nextId++,
      x,
      y,
      text,
      subtext,
      color,
      life: 1.15,
      maxLife: 1.15,
    });
  }

  private spawnAmbientWeather(dt: number) {
    this.weatherTimer += dt;
    const stage = STAGES[this.stageId];
    if (stage.weatherType === 'rain' && this.weatherTimer > 0.025) {
      this.weatherTimer = 0;
      this.particles.push({
        x: this.cameraX + Math.random() * VIEW_WIDTH,
        y: -10,
        vx: -140,
        vy: 980,
        size: 2,
        color: 'rgba(186, 230, 253, 0.35)',
        alpha: 0.45,
        life: 0.75,
        maxLife: 0.75,
        gravity: 0,
        kind: 'rain',
      });
    } else if (stage.weatherType === 'embers' && this.weatherTimer > 0.09) {
      this.weatherTimer = 0;
      this.particles.push({
        x: this.cameraX + Math.random() * VIEW_WIDTH,
        y: FLOOR_Y + 20,
        vx: -30 + Math.random() * 60,
        vy: -70 - Math.random() * 80,
        size: 2 + Math.random() * 2.5,
        color: '#F59E0B',
        alpha: 0.7,
        life: 2.2,
        maxLife: 2.2,
        gravity: -10,
        kind: 'ember',
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.kind === 'ring') {
        p.size += 380 * dt;
        p.alpha = p.life / p.maxLife;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.alpha = Math.min(1, (p.life / p.maxLife) * 1.4);
      }
    }
  }

  private updateCallouts(dt: number) {
    for (let i = this.callouts.length - 1; i >= 0; i--) {
      const c = this.callouts[i];
      c.life -= dt;
      c.y -= 26 * dt;
      if (c.life <= 0) {
        this.callouts.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    const shakeX = this.shakeTimer > 0 ? (Math.random() * 2 - 1) * this.shakeIntensity : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() * 2 - 1) * this.shakeIntensity : 0;

    this.renderer.render(ctx, {
      stageId: this.stageId,
      cameraX: this.cameraX,
      shakeX,
      shakeY,
      p1: this.p1,
      p2: this.p2,
      props: this.props,
      projectiles: this.projectiles,
      particles: this.particles,
      callouts: this.callouts,
      superCinematic: this.superCinematic,
      clash: this.clash,
      stageTransition: this.stageTransition,
      p1NearProp: this.getNearProp(this.p1),
      p2NearProp: this.getNearProp(this.p2),
      time: this.totalTime,
    });
  }

  public getHudSnapshot(): HudSnapshot {
    const stage = STAGES[this.stageId];
    return {
      timerSeconds: Math.ceil(this.timerSeconds),
      stageName: stage.name,
      stageSubtitle: stage.subtitle,
      bannerText: this.bannerText,
      bannerSubtext: this.bannerSubtext,
      p1: {
        name: this.p1.profile.name,
        epithet: this.p1.profile.epithet,
        id: this.p1.profile.id,
        armorHp: this.p1.armorHp,
        maxArmorHp: this.p1.profile.maxArmorHp,
        crimsonHp: this.p1.crimsonHp,
        maxCrimsonHp: this.p1.profile.maxCrimsonHp,
        activeBar: this.p1.activeBar,
        superMeter: this.p1.superMeter,
        traitCharge: this.p1.traitCharge,
        traitActive: this.p1.traitActiveTimer > 0,
        traitName: this.p1.profile.traitName,
        comboCount: this.p2.comboTakenCount,
        comboDamage: this.p2.comboTakenDamage,
        clashAvailable: this.p1.activeBar === 'crimson' && !this.p1.clashUsed && this.p1.superMeter >= 100,
        dronesCount: this.p1.dronesCount,
        colors: this.p1.profile.colors,
      },
      p2: {
        name: this.p2.profile.name,
        epithet: this.p2.profile.epithet,
        id: this.p2.profile.id,
        armorHp: this.p2.armorHp,
        maxArmorHp: this.p2.profile.maxArmorHp,
        crimsonHp: this.p2.crimsonHp,
        maxCrimsonHp: this.p2.profile.maxCrimsonHp,
        activeBar: this.p2.activeBar,
        superMeter: this.p2.superMeter,
        traitCharge: this.p2.traitCharge,
        traitActive: this.p2.traitActiveTimer > 0,
        traitName: this.p2.profile.traitName,
        comboCount: this.p1.comboTakenCount,
        comboDamage: this.p1.comboTakenDamage,
        clashAvailable: this.p2.activeBar === 'crimson' && !this.p2.clashUsed && this.p2.superMeter >= 100,
        dronesCount: this.p2.dronesCount,
        colors: this.p2.profile.colors,
      },
      clash: this.clash ? { ...this.clash } : null,
      winnerSlot: this.winnerSlot,
      matchStats: {
        durationSeconds: Math.round(this.matchElapsed),
        p1MaxCombo: this.p1.maxComboDealt,
        p1Damage: this.p1.totalDamageDealt,
        p1ClashesWon: this.p1.clashesWon,
        p2MaxCombo: this.p2.maxComboDealt,
        p2Damage: this.p2.totalDamageDealt,
        p2ClashesWon: this.p2.clashesWon,
      },
      tutorial: { ...this.tutorial },
    };
  }
}
