export type GameScreen = 'TITLE' | 'SELECT' | 'PLAYING' | 'PAUSED' | 'CLASH' | 'GAME_OVER';

export type GameMode = 'ARCADE' | 'VERSUS_P2' | 'TRAINING' | 'TUTORIAL';

export type DifficultyLevel = 'ROOKIE' | 'HERO' | 'GODLIKE';

export type FighterId = 'solaris' | 'nightwarden' | 'voltaire' | 'morrigan';

export type StageId = 'metropolis' | 'watchtower' | 'sanctum';

export type HitHeight = 'high' | 'mid' | 'low' | 'overhead' | 'unblockable';

export type MoveId =
  | 'light'
  | 'light2'
  | 'medium'
  | 'low_sweep'
  | 'overhead'
  | 'uppercut'
  | 'heavy'
  | 'air_kick'
  | 'special1'
  | 'special2'
  | 'trait'
  | 'interactable'
  | 'super';

export interface MoveDefinition {
  id: MoveId;
  name: string;
  startup: number; // frames at 60fps
  active: number;
  recovery: number;
  damage: number;
  chipDamage: number;
  hitstun: number;
  blockstun: number;
  knockbackX: number;
  knockbackY: number;
  hitHeight: HitHeight;
  hitbox: {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };
  lungeX?: number;
  launches?: boolean;
  knockdown?: boolean;
  armorBreak?: boolean;
  isProjectile?: boolean;
  isTeleport?: boolean;
  meterGainHit: number;
  meterGainWhiff: number;
  hitstop: number; // seconds
  screenShake: number;
}

export interface FighterProfile {
  id: FighterId;
  name: string;
  epithet: string;
  archetype: string;
  summary: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    cape: string;
    skin: string;
    glow: string;
  };
  stats: {
    power: number; // 1-100
    speed: number;
    defense: number;
    range: number;
  };
  walkSpeed: number;
  jumpForce: number;
  weight: number;
  maxArmorHp: number;
  maxCrimsonHp: number;
  traitName: string;
  traitDescription: string;
  traitCooldown: number; // seconds
  special1Name: string;
  special1Desc: string;
  special2Name: string;
  special2Desc: string;
  superName: string;
  superDesc: string;
  clashLine: string;
  victoryQuote: string;
  moves: Record<MoveId, MoveDefinition>;
}

export interface StageProp {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'crate' | 'coil' | 'monolith';
  cooldown: number;
  maxCooldown: number;
  damage: number;
  flashTimer: number;
}

export interface StageDefinition {
  id: StageId;
  name: string;
  subtitle: string;
  imageUrl: string;
  nextStageId: StageId;
  floorY: number;
  ambientColor: string;
  weatherType: 'embers' | 'sparks' | 'rain';
  props: Omit<StageProp, 'cooldown' | 'flashTimer'>[];
}

export type ActionState =
  | 'idle'
  | 'walk'
  | 'crouch'
  | 'jump'
  | 'attack'
  | 'hitstun'
  | 'blockstun'
  | 'knockdown'
  | 'wakeup'
  | 'super'
  | 'ko';

export interface Afterimage {
  x: number;
  y: number;
  facing: 1 | -1;
  alpha: number;
  color: string;
  action: ActionState;
}

export interface FighterState {
  slot: 1 | 2;
  profile: FighterProfile;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  crouching: boolean;
  blocking: boolean;

  armorHp: number;
  crimsonHp: number;
  activeBar: 'armor' | 'crimson';
  superMeter: number; // 0 to 400 (4 bars)
  traitCharge: number; // 0 to 100
  traitActiveTimer: number; // seconds remaining

  action: ActionState;
  currentMove: MoveDefinition | null;
  moveElapsedFrames: number;
  hitConfirmed: boolean;
  queuedMove: MoveId | null;

  stunTimer: number; // seconds
  invulnTimer: number;
  hitFlashTimer: number;
  barBreakFlash: number;

  comboCount: number; // hits currently being received or dealt
  comboTakenCount: number;
  comboTakenDamage: number;
  comboResetTimer: number;

  clashUsed: boolean;
  dronesCount: number;
  afterimages: Afterimage[];
  afterimageTimer: number;
  animTime: number;

  // Match telemetry for Game Over summary
  maxComboDealt: number;
  totalDamageDealt: number;
  clashesWon: number;
  superMovesLanded: number;
}

export interface Projectile {
  id: number;
  ownerSlot: 1 | 2;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  chipDamage: number;
  color: string;
  coreColor: string;
  kind: 'beam' | 'batarang' | 'bolt' | 'drone';
  life: number;
  hitHeight: HitHeight;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  kind: 'spark' | 'shard' | 'smoke' | 'ring' | 'rain' | 'ember';
}

export interface FloatingCallout {
  id: number;
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface ClashState {
  active: boolean;
  initiatorSlot: 1 | 2;
  phase: 'WAGERING' | 'REVEAL' | 'RESOLVED';
  timer: number;
  p1Wager: number | null;
  p2Wager: number | null;
  winnerSlot: 1 | 2 | 0; // 0 = tie
  quote1: string;
  quote2: string;
}

export interface SuperCinematicState {
  active: boolean;
  attackerSlot: 1 | 2;
  timer: number;
  duration: number;
  impactTriggered: boolean;
  moveName: string;
}

export interface StageTransitionState {
  active: boolean;
  timer: number;
  duration: number;
  fromStageName: string;
  toStageId: StageId;
  attackerSlot: 1 | 2;
}

export interface HudSnapshot {
  timerSeconds: number;
  stageName: string;
  stageSubtitle: string;
  bannerText: string | null;
  bannerSubtext: string | null;
  p1: {
    name: string;
    epithet: string;
    id: FighterId;
    armorHp: number;
    maxArmorHp: number;
    crimsonHp: number;
    maxCrimsonHp: number;
    activeBar: 'armor' | 'crimson';
    superMeter: number;
    traitCharge: number;
    traitActive: boolean;
    traitName: string;
    comboCount: number;
    comboDamage: number;
    clashAvailable: boolean;
    dronesCount: number;
    colors: FighterProfile['colors'];
  };
  p2: {
    name: string;
    epithet: string;
    id: FighterId;
    armorHp: number;
    maxArmorHp: number;
    crimsonHp: number;
    maxCrimsonHp: number;
    activeBar: 'armor' | 'crimson';
    superMeter: number;
    traitCharge: number;
    traitActive: boolean;
    traitName: string;
    comboCount: number;
    comboDamage: number;
    clashAvailable: boolean;
    dronesCount: number;
    colors: FighterProfile['colors'];
  };
  clash: ClashState | null;
  winnerSlot: 1 | 2 | 0 | null;
  matchStats: {
    durationSeconds: number;
    p1MaxCombo: number;
    p1Damage: number;
    p1ClashesWon: number;
    p2MaxCombo: number;
    p2Damage: number;
    p2ClashesWon: number;
  };
  tutorial: TutorialProgress;
}

export interface TutorialProgress {
  moved: boolean;
  jumped: boolean;
  crouched: boolean;
  combo3: boolean;
  mixup: boolean;
  traitUsed: boolean;
  specialUsed: boolean;
  interactableUsed: boolean;
  superLanded: boolean;
}
