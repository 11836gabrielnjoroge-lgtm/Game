import { STAGES } from './roster';
import {
  ClashState,
  FighterState,
  FloatingCallout,
  Particle,
  Projectile,
  StageId,
  StageProp,
  StageTransitionState,
  SuperCinematicState,
} from './types';

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const WORLD_WIDTH = 1560;
export const FLOOR_Y = 604;

interface RenderContextData {
  stageId: StageId;
  cameraX: number;
  shakeX: number;
  shakeY: number;
  p1: FighterState;
  p2: FighterState;
  props: StageProp[];
  projectiles: Projectile[];
  particles: Particle[];
  callouts: FloatingCallout[];
  superCinematic: SuperCinematicState;
  clash: ClashState | null;
  stageTransition: StageTransitionState;
  p1NearProp: StageProp | null;
  p2NearProp: StageProp | null;
  time: number;
}

export class ArenaRenderer {
  private bgCache: Map<string, HTMLImageElement> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      Object.values(STAGES).forEach((stage) => {
        const img = new Image();
        img.src = stage.imageUrl;
        this.bgCache.set(stage.id, img);
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, data: RenderContextData) {
    const stage = STAGES[data.stageId];
    ctx.save();

    // Base fill
    ctx.fillStyle = '#090B10';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Apply camera shake
    ctx.translate(data.shakeX, data.shakeY);

    // 1. Background stage art with parallax
    const bgImg = this.bgCache.get(data.stageId);
    const parallaxX = -data.cameraX * 0.45;
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      const drawW = VIEW_WIDTH + 160;
      const drawH = VIEW_HEIGHT;
      ctx.drawImage(bgImg, parallaxX, 0, drawW, drawH);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
      grad.addColorStop(0, '#111827');
      grad.addColorStop(1, '#090B10');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }

    // Subtle atmospheric contrast wash so foreground silhouettes always read sharply
    const wash = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    wash.addColorStop(0, 'rgba(9, 11, 16, 0.35)');
    wash.addColorStop(0.65, 'rgba(9, 11, 16, 0.12)');
    wash.addColorStop(1, 'rgba(9, 11, 16, 0.55)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Super Move dark dramatic backdrop flash
    if (data.superCinematic.active) {
      ctx.fillStyle = 'rgba(5, 7, 12, 0.72)';
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      this.drawSpeedLines(ctx, data.time);
    }

    // Clash freeze dim
    if (data.clash?.active) {
      ctx.fillStyle = 'rgba(9, 11, 16, 0.52)';
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }

    // World Space Transform
    ctx.save();
    ctx.translate(-data.cameraX, 0);

    // Subtle ground horizon line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(WORLD_WIDTH, FLOOR_Y);
    ctx.stroke();

    // Arena boundary edge markers (for Stage Transitions)
    this.drawBoundaryMarkers(ctx, data.time);

    // 2. Interactive Stage Props
    for (const prop of data.props) {
      const isP1Near = data.p1NearProp?.id === prop.id;
      const isP2Near = data.p2NearProp?.id === prop.id;
      this.drawStageProp(ctx, prop, isP1Near, isP2Near, data.time);
    }

    // 3. Shadows on ground
    this.drawFighterShadow(ctx, data.p1);
    this.drawFighterShadow(ctx, data.p2);

    // 4. Afterimages (Speedster / Dash trails)
    this.drawAfterimages(ctx, data.p1);
    this.drawAfterimages(ctx, data.p2);

    // 5. Fighters (draw attacking fighter on top)
    const p1OnTop = data.p1.action === 'attack' || data.p1.action === 'super';
    if (p1OnTop) {
      this.drawFighter(ctx, data.p2, data.time);
      this.drawFighter(ctx, data.p1, data.time);
    } else {
      this.drawFighter(ctx, data.p1, data.time);
      this.drawFighter(ctx, data.p2, data.time);
    }

    // 6. Projectiles
    for (const proj of data.projectiles) {
      this.drawProjectile(ctx, proj, data.time);
    }

    // 7. Particles (sparks, shards, rings, weather)
    for (const part of data.particles) {
      this.drawParticle(ctx, part);
    }

    // 8. Floating Combat Callouts
    for (const callout of data.callouts) {
      this.drawCallout(ctx, callout);
    }

    ctx.restore(); // exit world transform

    // Ambient stage tint
    ctx.fillStyle = stage.ambientColor;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Stage Transition wipe flash
    if (data.stageTransition.active) {
      const progress = 1 - data.stageTransition.timer / data.stageTransition.duration;
      const alpha = Math.sin(progress * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.95, alpha * 1.15)})`;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }

    ctx.restore();
  }

  private drawSpeedLines(ctx: CanvasRenderingContext2D, time: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const y = ((i * 37 + time * 900) % VIEW_HEIGHT);
      const len = 180 + ((i * 53) % 260);
      const x = ((i * 193 + time * 1400) % (VIEW_WIDTH + 300)) - 150;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBoundaryMarkers(ctx: CanvasRenderingContext2D, time: number) {
    const pulse = 0.28 + 0.18 * Math.sin(time * 4);
    ctx.save();
    const gradLeft = ctx.createLinearGradient(0, 0, 90, 0);
    gradLeft.addColorStop(0, `rgba(245, 158, 11, ${pulse})`);
    gradLeft.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = gradLeft;
    ctx.fillRect(0, FLOOR_Y - 220, 90, 220);

    const gradRight = ctx.createLinearGradient(WORLD_WIDTH, 0, WORLD_WIDTH - 90, 0);
    gradRight.addColorStop(0, `rgba(245, 158, 11, ${pulse})`);
    gradRight.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = gradRight;
    ctx.fillRect(WORLD_WIDTH - 90, FLOOR_Y - 220, 90, 220);
    ctx.restore();
  }

  private drawStageProp(
    ctx: CanvasRenderingContext2D,
    prop: StageProp,
    p1Near: boolean,
    p2Near: boolean,
    time: number
  ) {
    const ready = prop.cooldown <= 0;
    const x = prop.x - prop.width / 2;
    const y = prop.y - prop.height;

    ctx.save();
    ctx.globalAlpha = ready ? 1 : 0.35;

    if (ready && (p1Near || p2Near)) {
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 18;
    }

    if (prop.kind === 'crate') {
      ctx.fillStyle = '#273043';
      ctx.strokeStyle = ready ? '#F59E0B' : '#475569';
      ctx.lineWidth = 2.5;
      ctx.fillRect(x, y, prop.width, prop.height);
      ctx.strokeRect(x, y, prop.width, prop.height);
      // Hazard diagonal stripe
      ctx.fillStyle = ready ? '#F59E0B' : '#64748B';
      ctx.fillRect(x + 8, y + 10, prop.width - 16, 8);
      ctx.fillRect(x + 12, y + prop.height - 16, prop.width - 24, 6);
    } else if (prop.kind === 'coil') {
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = ready ? '#38BDF8' : '#475569';
      ctx.lineWidth = 2.5;
      ctx.fillRect(x + 8, y + 14, prop.width - 16, prop.height - 14);
      ctx.strokeRect(x + 8, y + 14, prop.width - 16, prop.height - 14);
      // Energy core
      const glowPulse = 0.65 + 0.35 * Math.sin(time * 7);
      ctx.fillStyle = ready ? `rgba(56, 189, 248, ${glowPulse})` : '#334155';
      ctx.fillRect(x + 18, y + 22, prop.width - 36, prop.height - 34);
      // Top cap
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(x + 2, y, prop.width - 4, 16);
      ctx.strokeRect(x + 2, y, prop.width - 4, 16);
    } else {
      // Monolith
      ctx.fillStyle = '#262B36';
      ctx.strokeStyle = ready ? '#E2E8F0' : '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 10, y);
      ctx.lineTo(x + prop.width - 10, y);
      ctx.lineTo(x + prop.width, y + prop.height);
      ctx.lineTo(x, y + prop.height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Interactive prompt above prop when ready and fighter is in range
    if (ready && (p1Near || p2Near)) {
      const bob = Math.sin(time * 8) * 3;
      const badgeY = y - 26 + bob;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#090B10';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.fillRect(prop.x - 16, badgeY - 12, 32, 24);
      ctx.strokeRect(prop.x - 16, badgeY - 12, 32, 24);
      ctx.fillStyle = '#FBBF24';
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p1Near ? 'O' : 'AI', prop.x, badgeY + 1);
    }

    ctx.restore();
  }

  private drawFighterShadow(ctx: CanvasRenderingContext2D, f: FighterState) {
    const heightAboveFloor = Math.max(0, FLOOR_Y - f.y);
    const scale = Math.max(0.4, 1 - heightAboveFloor / 420);
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${0.52 * scale})`;
    ctx.beginPath();
    ctx.ellipse(f.x, FLOOR_Y + 4, 48 * scale, 11 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawAfterimages(ctx: CanvasRenderingContext2D, f: FighterState) {
    for (const img of f.afterimages) {
      ctx.save();
      ctx.translate(img.x, img.y);
      ctx.scale(img.facing, 1);
      ctx.globalAlpha = img.alpha * 0.45;
      ctx.fillStyle = img.color;
      ctx.beginPath();
      ctx.roundRect(-24, -138, 48, 128, 12);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFighter(ctx: CanvasRenderingContext2D, f: FighterState, time: number) {
    ctx.save();
    ctx.translate(f.x, f.y);

    // Trait active ground aura
    if (f.traitActiveTimer > 0) {
      ctx.save();
      const auraPulse = 0.22 + 0.14 * Math.sin(time * 14);
      ctx.strokeStyle = f.profile.colors.glow;
      ctx.lineWidth = 3;
      ctx.globalAlpha = auraPulse + 0.3;
      ctx.beginPath();
      ctx.ellipse(0, -4, 54, 14, 0, 0, Math.PI * 2);
      ctx.stroke();

      const grad = ctx.createRadialGradient(0, -76, 12, 0, -76, 95);
      grad.addColorStop(0, `${f.profile.colors.glow}44`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -76, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.scale(f.facing, 1);

    // Compute pose angles & offsets
    const pose = this.computePose(f, time);

    // Knockdown / KO rotation
    if (f.action === 'knockdown' || f.action === 'ko') {
      ctx.translate(0, -18);
      ctx.rotate(-Math.PI * 0.46);
    }

    // Hit flash tint
    const isFlashing = f.hitFlashTimer > 0;
    const c = f.profile.colors;

    // 1. Cape / Cloak (behind body)
    if (f.profile.id === 'solaris' || f.profile.id === 'nightwarden' || f.profile.id === 'morrigan') {
      const sway = Math.sin(time * 5 + f.x * 0.02) * 8 + (f.vx * f.facing < -20 ? 18 : 0);
      ctx.fillStyle = isFlashing ? '#FFFFFF' : c.cape;
      ctx.strokeStyle = '#090B10';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10 + pose.torsoX, pose.shoulderY);
      ctx.quadraticCurveTo(-36 - sway * 0.6, pose.shoulderY + 46, -48 - sway, pose.hipY + 44);
      ctx.lineTo(-14 - sway * 0.3, pose.hipY + 52);
      ctx.lineTo(4 + pose.torsoX, pose.shoulderY + 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 2. Back Leg
    this.drawLimb(
      ctx,
      pose.torsoX - 8,
      pose.hipY,
      pose.backKneeX,
      pose.backKneeY,
      pose.backFootX,
      pose.backFootY,
      15,
      12,
      isFlashing ? '#FFFFFF' : c.secondary,
      isFlashing ? '#FFFFFF' : c.primary
    );

    // 3. Back Arm
    this.drawLimb(
      ctx,
      pose.torsoX - 10,
      pose.shoulderY + 6,
      pose.backElbowX,
      pose.backElbowY,
      pose.backHandX,
      pose.backHandY,
      12,
      10,
      isFlashing ? '#FFFFFF' : c.secondary,
      isFlashing ? '#FFFFFF' : c.accent
    );

    // 4. Torso & Armor Chestplate
    ctx.save();
    ctx.translate(pose.torsoX, pose.hipY);
    ctx.rotate(pose.torsoLean);

    // Muscular armored torso polygon
    ctx.fillStyle = isFlashing ? '#FFFFFF' : c.primary;
    ctx.strokeStyle = '#090B10';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-24, -52);
    ctx.lineTo(24, -52);
    ctx.lineTo(16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Belt
    ctx.fillStyle = isFlashing ? '#FFFFFF' : c.accent;
    ctx.fillRect(-17, -9, 34, 9);

    // Chest Emblem
    ctx.fillStyle = isFlashing ? '#FFFFFF' : c.accent;
    if (f.profile.id === 'solaris') {
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.lineTo(12, -32);
      ctx.lineTo(0, -18);
      ctx.lineTo(-12, -32);
      ctx.closePath();
      ctx.fill();
    } else if (f.profile.id === 'nightwarden') {
      ctx.beginPath();
      ctx.moveTo(-12, -34);
      ctx.lineTo(0, -27);
      ctx.lineTo(12, -34);
      ctx.lineTo(6, -24);
      ctx.lineTo(-6, -24);
      ctx.closePath();
      ctx.fill();
    } else if (f.profile.id === 'voltaire') {
      ctx.beginPath();
      ctx.moveTo(4, -44);
      ctx.lineTo(-6, -31);
      ctx.lineTo(2, -31);
      ctx.lineTo(-4, -18);
      ctx.lineTo(8, -33);
      ctx.lineTo(0, -33);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, -32, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Head & Mask/Helmet
    ctx.save();
    ctx.translate(2, -66);
    ctx.fillStyle = isFlashing ? '#FFFFFF' : (f.profile.id === 'solaris' ? c.skin : c.primary);
    ctx.strokeStyle = '#090B10';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cowl / Helmet / Hair silhouette
    if (f.profile.id === 'nightwarden') {
      ctx.fillStyle = isFlashing ? '#FFFFFF' : c.secondary;
      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.lineTo(-12, -24);
      ctx.lineTo(-4, -12);
      ctx.lineTo(8, -14);
      ctx.lineTo(14, -4);
      ctx.closePath();
      ctx.fill();
    } else if (f.profile.id === 'voltaire') {
      // Speedster ear fins
      ctx.fillStyle = isFlashing ? '#FFFFFF' : c.accent;
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(-18, -16);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fill();
    } else if (f.profile.id === 'morrigan') {
      // Arcane hood
      ctx.fillStyle = isFlashing ? '#FFFFFF' : c.secondary;
      ctx.beginPath();
      ctx.arc(-2, -1, 16.5, Math.PI * 0.65, Math.PI * 2.15);
      ctx.fill();
    } else {
      // Solaris hair/crest
      ctx.fillStyle = isFlashing ? '#FFFFFF' : '#0F172A';
      ctx.beginPath();
      ctx.arc(-1, -4, 14, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
    }

    // Glowing Eyes
    ctx.fillStyle = f.traitActiveTimer > 0 ? '#FFFFFF' : c.glow;
    ctx.fillRect(5, -4, 7, 3.5);
    ctx.restore();

    ctx.restore(); // exit torso

    // 6. Front Leg
    this.drawLimb(
      ctx,
      pose.torsoX + 8,
      pose.hipY,
      pose.frontKneeX,
      pose.frontKneeY,
      pose.frontFootX,
      pose.frontFootY,
      16,
      13,
      isFlashing ? '#FFFFFF' : c.primary,
      isFlashing ? '#FFFFFF' : c.accent
    );

    // 7. Front Arm
    this.drawLimb(
      ctx,
      pose.torsoX + 12,
      pose.shoulderY + 6,
      pose.frontElbowX,
      pose.frontElbowY,
      pose.frontHandX,
      pose.frontHandY,
      13,
      11,
      isFlashing ? '#FFFFFF' : c.primary,
      isFlashing ? '#FFFFFF' : c.accent
    );

    // Weapon / Attack energy trail
    if (f.action === 'attack' && f.currentMove) {
      const m = f.currentMove;
      const inActive = f.moveElapsedFrames >= m.startup && f.moveElapsedFrames <= m.startup + m.active + 2;
      if (inActive) {
        ctx.save();
        ctx.strokeStyle = c.glow;
        ctx.lineWidth = m.id === 'heavy' || m.id === 'super' ? 8 : 5;
        ctx.globalAlpha = 0.78;
        ctx.beginPath();
        ctx.arc(pose.frontHandX, pose.frontHandY, m.id === 'heavy' ? 24 : 16, -0.8, 0.8);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 8. Nightwarden Orbiting Drones
    if (f.profile.id === 'nightwarden' && f.dronesCount > 0) {
      for (let i = 0; i < f.dronesCount; i++) {
        const angle = time * 3.5 + (i * Math.PI * 2) / 3;
        const dx = Math.cos(angle) * 44;
        const dy = -115 + Math.sin(angle * 1.4) * 14;
        ctx.save();
        ctx.fillStyle = '#0EA5E9';
        ctx.strokeStyle = '#090B10';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dx, dy - 7);
        ctx.lineTo(dx + 10, dy);
        ctx.lineTo(dx, dy + 7);
        ctx.lineTo(dx - 10, dy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // 9. Blocking Energy Barrier
    if ((f.blocking || f.action === 'blockstun') && f.action !== 'knockdown' && f.action !== 'ko') {
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 3;
      const shieldY = f.crouching ? -48 : -78;
      const shieldH = f.crouching ? 44 : 62;
      ctx.beginPath();
      ctx.ellipse(34, shieldY, 14, shieldH, 0, -Math.PI * 0.48, Math.PI * 0.48);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  private drawLimb(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    w1: number,
    w2: number,
    colorUpper: string,
    colorBoot: string
  ) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Dark outline
    ctx.strokeStyle = '#090B10';
    ctx.lineWidth = w1 + 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.lineWidth = w2 + 4;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();

    // Inner fill
    ctx.strokeStyle = colorUpper;
    ctx.lineWidth = w1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = colorBoot;
    ctx.lineWidth = w2;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();

    ctx.restore();
  }

  private computePose(f: FighterState, time: number) {
    const crouchDrop = f.crouching ? 34 : 0;
    const bob = f.action === 'idle' ? Math.sin(time * 5.2 + f.slot) * 3 : 0;
    const hipY = -62 + crouchDrop + bob;
    const shoulderY = hipY - 50;

    let torsoX = 0;
    let torsoLean = 0.08;

    let frontKneeX = 18;
    let frontKneeY = hipY + 30;
    let frontFootX = 24;
    let frontFootY = -6;

    let backKneeX = -16;
    let backKneeY = hipY + 30;
    let backFootX = -24;
    let backFootY = -6;

    let frontElbowX = 26;
    let frontElbowY = shoulderY + 24;
    let frontHandX = 36;
    let frontHandY = shoulderY + 10;

    let backElbowX = -4;
    let backElbowY = shoulderY + 22;
    let backHandX = 16;
    let backHandY = shoulderY + 18;

    if (f.action === 'walk') {
      const stride = Math.sin(f.animTime * 11);
      torsoLean = 0.14;
      frontKneeX = 14 + stride * 18;
      frontFootX = 16 + stride * 28;
      frontFootY = -6 - Math.max(0, stride * 10);
      backKneeX = -14 - stride * 18;
      backFootX = -16 - stride * 28;
      backFootY = -6 - Math.max(0, -stride * 10);
      frontHandX = 30 - stride * 12;
      backHandX = 12 + stride * 12;
    } else if (f.action === 'jump') {
      torsoLean = 0.16;
      frontKneeX = 22;
      frontKneeY = hipY + 20;
      frontFootX = 16;
      frontFootY = hipY + 46;
      backKneeX = -14;
      backKneeY = hipY + 24;
      backFootX = -22;
      backFootY = hipY + 50;
      frontHandY = shoulderY - 12;
    } else if (f.action === 'hitstun') {
      torsoX = -10;
      torsoLean = -0.26;
      frontHandX = 10;
      frontHandY = shoulderY - 8;
      backHandX = -22;
      backHandY = shoulderY + 12;
    } else if (f.action === 'blockstun' || f.blocking) {
      torsoLean = -0.06;
      frontElbowX = 22;
      frontElbowY = shoulderY + 12;
      frontHandX = 28;
      frontHandY = shoulderY - 14;
      backElbowX = 12;
      backHandX = 22;
      backHandY = shoulderY - 6;
    } else if (f.action === 'attack' && f.currentMove) {
      const m = f.currentMove;
      const t = f.moveElapsedFrames;
      const isWindup = t < m.startup;
      const ext = isWindup ? -0.35 : 1.0;

      if (m.id === 'light' || m.id === 'light2') {
        torsoX = 10 * ext;
        torsoLean = 0.25 * ext;
        frontElbowX = 40 * ext;
        frontElbowY = shoulderY + 4;
        frontHandX = 76 * ext;
        frontHandY = shoulderY + 2;
      } else if (m.id === 'medium' || m.id === 'air_kick') {
        torsoX = 8 * ext;
        torsoLean = -0.18 * ext;
        frontKneeX = 48 * ext;
        frontKneeY = hipY + 4;
        frontFootX = 88 * ext;
        frontFootY = hipY - 12;
      } else if (m.id === 'low_sweep') {
        torsoLean = -0.25;
        frontKneeX = 48 * ext;
        frontKneeY = -12;
        frontFootX = 94 * ext;
        frontFootY = -8;
      } else if (m.id === 'overhead' || m.id === 'heavy') {
        torsoX = 14 * ext;
        torsoLean = isWindup ? -0.32 : 0.42;
        frontElbowX = isWindup ? -14 : 44;
        frontElbowY = isWindup ? shoulderY - 24 : shoulderY + 12;
        frontHandX = isWindup ? -22 : 84;
        frontHandY = isWindup ? shoulderY - 40 : shoulderY + 22;
      } else if (m.id === 'uppercut') {
        torsoX = 10;
        torsoLean = -0.15;
        frontElbowX = 26;
        frontElbowY = shoulderY - 20;
        frontHandX = 44;
        frontHandY = shoulderY - 64;
      } else if (m.id === 'special1') {
        torsoLean = 0.22;
        frontElbowX = 38;
        frontElbowY = shoulderY + 4;
        frontHandX = 64;
        frontHandY = shoulderY + 4;
        backHandX = 56;
        backHandY = shoulderY + 8;
      } else if (m.id === 'special2' || m.id === 'super' || m.id === 'interactable') {
        torsoX = 18;
        torsoLean = 0.38;
        frontElbowX = 42;
        frontHandX = 86;
        frontHandY = shoulderY - 6;
      }
    }

    return {
      torsoX,
      torsoLean,
      hipY,
      shoulderY,
      frontKneeX,
      frontKneeY,
      frontFootX,
      frontFootY,
      backKneeX,
      backKneeY,
      backFootX,
      backFootY,
      frontElbowX,
      frontElbowY,
      frontHandX,
      frontHandY,
      backElbowX,
      backElbowY,
      backHandX,
      backHandY,
    };
  }

  private drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile, time: number) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 16;

    if (p.kind === 'beam') {
      const dir = p.vx >= 0 ? 1 : -1;
      ctx.fillStyle = p.color;
      ctx.fillRect(dir > 0 ? -48 : 0, -9, 48, 18);
      ctx.fillStyle = p.coreColor;
      ctx.fillRect(dir > 0 ? -42 : 4, -4, 38, 8);
    } else if (p.kind === 'batarang') {
      ctx.rotate(time * 24);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.coreColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, -6);
      ctx.lineTo(0, -2);
      ctx.lineTo(16, -6);
      ctx.lineTo(6, 6);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.coreColor;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 0.52, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'rain') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 4, p.y + 18);
      ctx.stroke();
    } else if (p.kind === 'shard') {
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 10);
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(0, -p.size * 0.7);
      ctx.lineTo(p.size, p.size * 0.4);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawCallout(ctx: CanvasRenderingContext2D, c: FloatingCallout) {
    const progress = 1 - c.life / c.maxLife;
    const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = '800 28px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#090B10';
    ctx.lineWidth = 5;
    ctx.strokeText(c.text, c.x, c.y);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, c.x, c.y);

    if (c.subtext) {
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.strokeText(c.subtext, c.x, c.y + 20);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(c.subtext, c.x, c.y + 20);
    }
    ctx.restore();
  }
}
