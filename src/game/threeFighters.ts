import * as THREE from 'three';
import { FighterProfile, FighterState } from './types';

export interface FighterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  cape: THREE.Mesh | null;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  shieldMesh: THREE.Mesh;
  auraRing: THREE.Mesh;
  drones: THREE.Group[];
  armorMaterials: THREE.MeshStandardMaterial[];
  emissiveMaterials: THREE.MeshStandardMaterial[];
  shadowPlane: THREE.Mesh;
}

export function buildFighterRig(
  profile: FighterProfile,
  shadowTexture: THREE.Texture
): FighterRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const armorMaterials: THREE.MeshStandardMaterial[] = [];
  const emissiveMaterials: THREE.MeshStandardMaterial[] = [];

  const primaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(profile.colors.primary),
    metalness: 0.72,
    roughness: 0.28,
  });
  const secondaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(profile.colors.secondary),
    metalness: 0.25,
    roughness: 0.68,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(profile.colors.accent),
    metalness: 0.88,
    roughness: 0.2,
  });
  const capeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(profile.colors.cape),
    metalness: 0.1,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(profile.colors.skin),
    metalness: 0.05,
    roughness: 0.75,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(profile.colors.glow),
    emissive: new THREE.Color(profile.colors.glow),
    emissiveIntensity: 1.8,
    metalness: 0.2,
    roughness: 0.2,
  });

  armorMaterials.push(primaryMat, secondaryMat, accentMat, capeMat, skinMat);
  emissiveMaterials.push(glowMat);

  // Contact Ground Shadow (anchored at ground Y=0.02)
  const shadowGeo = new THREE.PlaneGeometry(1.9, 1.45);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.6,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.025;
  root.add(shadowPlane);

  // Torso (pivoted at hips y = 1.05)
  const torso = new THREE.Group();
  torso.position.set(0, 1.05, 0);
  bodyPivot.add(torso);

  // Pelvis / Belt
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.22, 10), secondaryMat);
  pelvis.castShadow = true;
  torso.add(pelvis);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.34), accentMat);
  belt.position.y = 0.08;
  belt.castShadow = true;
  torso.add(belt);

  // Sculpted Chestplate (wider at shoulders)
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.24, 0.62, 10), primaryMat);
  chest.scale.set(1.15, 1, 0.74);
  chest.position.y = 0.44;
  chest.castShadow = true;
  torso.add(chest);

  // Shoulder Pauldrons
  const pauldronGeo = new THREE.SphereGeometry(0.18, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65);
  const leftPauldron = new THREE.Mesh(pauldronGeo, accentMat);
  leftPauldron.position.set(0, 0.68, 0.4);
  leftPauldron.rotation.x = Math.PI * 0.15;
  leftPauldron.castShadow = true;
  torso.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(pauldronGeo, accentMat);
  rightPauldron.position.set(0, 0.68, -0.4);
  rightPauldron.rotation.x = -Math.PI * 0.15;
  rightPauldron.castShadow = true;
  torso.add(rightPauldron);

  // Chest Emblem (faces +X forward in local fighter rig space!)
  const emblem = new THREE.Mesh(
    profile.id === 'solaris'
      ? new THREE.OctahedronGeometry(0.12, 0)
      : profile.id === 'voltaire'
      ? new THREE.ConeGeometry(0.11, 0.24, 4)
      : profile.id === 'nightwarden'
      ? new THREE.BoxGeometry(0.06, 0.12, 0.28)
      : new THREE.TorusGeometry(0.09, 0.03, 8, 16),
    glowMat
  );
  emblem.position.set(0.27, 0.5, 0);
  emblem.rotation.y = Math.PI / 2;
  torso.add(emblem);

  // Head Group
  const head = new THREE.Group();
  head.position.set(0.02, 0.92, 0);
  torso.add(head);

  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 14, 12),
    profile.id === 'solaris' ? skinMat : primaryMat
  );
  skull.scale.set(1.02, 1.12, 0.95);
  skull.castShadow = true;
  head.add(skull);

  // Glowing Visor / Eyes (facing +X)
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.22), glowMat);
  visor.position.set(0.16, 0.03, 0);
  head.add(visor);

  // Character Head Silhouette Accessories
  if (profile.id === 'nightwarden') {
    const earGeo = new THREE.ConeGeometry(0.05, 0.2, 5);
    const earL = new THREE.Mesh(earGeo, secondaryMat);
    earL.position.set(-0.02, 0.22, 0.12);
    const earR = new THREE.Mesh(earGeo, secondaryMat);
    earR.position.set(-0.02, 0.22, -0.12);
    head.add(earL, earR);
  } else if (profile.id === 'voltaire') {
    const finGeo = new THREE.BoxGeometry(0.16, 0.05, 0.03);
    const finL = new THREE.Mesh(finGeo, accentMat);
    finL.position.set(-0.08, 0.06, 0.19);
    finL.rotation.z = 0.4;
    const finR = new THREE.Mesh(finGeo, accentMat);
    finR.position.set(-0.08, 0.06, -0.19);
    finR.rotation.z = 0.4;
    head.add(finL, finR);
  } else if (profile.id === 'morrigan') {
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 10, Math.PI * 0.25, Math.PI * 1.5, 0, Math.PI * 0.85),
      secondaryMat
    );
    hood.rotation.y = Math.PI / 2;
    head.add(hood);
  } else {
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.18), secondaryMat);
    crest.position.set(-0.02, 0.14, 0);
    head.add(crest);
  }

  // Flowing Cape (behind -X)
  let cape: THREE.Mesh | null = null;
  if (profile.id === 'solaris' || profile.id === 'nightwarden' || profile.id === 'morrigan') {
    const capeGeo = new THREE.PlaneGeometry(0.78, 1.35, 4, 6);
    capeGeo.translate(0, -0.675, 0); // pivot at shoulders!
    cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(-0.24, 0.68, 0);
    cape.rotation.y = Math.PI / 2;
    cape.rotation.x = 0.22;
    cape.castShadow = true;
    torso.add(cape);
  }

  // Arms (left = +Z, right = -Z)
  const buildArm = (zOffset: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.64, zOffset);
    torso.add(shoulder);

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.36, 8), secondaryMat);
    upperArm.position.y = -0.18;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.36;
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.34, 8), primaryMat);
    forearm.position.y = -0.17;
    forearm.castShadow = true;
    elbow.add(forearm);

    const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 0.13), accentMat);
    gauntlet.position.y = -0.35;
    gauntlet.castShadow = true;
    elbow.add(gauntlet);

    return { shoulder, elbow };
  };

  const leftArm = buildArm(0.4);
  const rightArm = buildArm(-0.4);

  // Legs
  const buildLeg = (zOffset: number) => {
    const hip = new THREE.Group();
    hip.position.set(0, 1.0, zOffset);
    bodyPivot.add(hip);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.1, 0.48, 8), secondaryMat);
    thigh.position.y = -0.24;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.48;
    hip.add(knee);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.08, 0.46, 8), primaryMat);
    shin.position.y = -0.23;
    shin.castShadow = true;
    knee.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.15), accentMat);
    boot.position.set(0.05, -0.46, 0);
    boot.castShadow = true;
    knee.add(boot);

    return { hip, knee };
  };

  const leftLeg = buildLeg(0.17);
  const rightLeg = buildLeg(-0.17);

  // Block Energy Barrier
  const shieldGeo = new THREE.CylinderGeometry(0.75, 0.75, 1.55, 6, 1, true, -Math.PI * 0.42, Math.PI * 0.84);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.set(0.32, 1.08, 0);
  shieldMesh.rotation.y = Math.PI / 2;
  shieldMesh.visible = false;
  root.add(shieldMesh);

  // Trait Aura Ground Ring
  const auraGeo = new THREE.RingGeometry(0.72, 0.96, 32);
  const auraMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(profile.colors.glow),
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const auraRing = new THREE.Mesh(auraGeo, auraMat);
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.04;
  auraRing.visible = false;
  root.add(auraRing);

  // Nightwarden Orbiting 3D Drones
  const drones: THREE.Group[] = [];
  if (profile.id === 'nightwarden') {
    const droneMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      metalness: 0.8,
      roughness: 0.2,
    });
    for (let i = 0; i < 3; i++) {
      const d = new THREE.Group();
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), droneMat);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.1), accentMat);
      d.add(core, wing);
      d.visible = false;
      root.add(d);
      drones.push(d);
    }
  }

  return {
    root,
    bodyPivot,
    torso,
    head,
    cape,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    leftHip: leftLeg.hip,
    leftKnee: leftLeg.knee,
    rightHip: rightLeg.hip,
    rightKnee: rightLeg.knee,
    shieldMesh,
    auraRing,
    drones,
    armorMaterials,
    emissiveMaterials,
    shadowPlane,
  };
}

export function updateFighterRig(
  rig: FighterRig,
  f: FighterState,
  worldFloorY: number,
  worldScale: number,
  time: number,
  dt: number
) {
  const x3d = (f.x - 780) * worldScale;
  const y3d = Math.max(0, (worldFloorY - f.y) * worldScale);

  rig.root.position.set(x3d, y3d, 0);
  // Facing +1 -> face +X (rotation.y = 0); Facing -1 -> face -X (rotation.y = Math.PI)
  const targetRotY = f.facing === 1 ? 0 : Math.PI;
  rig.root.rotation.y = THREE.MathUtils.damp(rig.root.rotation.y, targetRotY, 22, dt);

  // Ground contact shadow stays anchored on the floor (y = 0.025 in world)
  rig.shadowPlane.position.y = -y3d + 0.025;
  const shadowScale = Math.max(0.45, 1 - y3d * 0.14);
  rig.shadowPlane.scale.set(shadowScale, shadowScale, 1);

  // Shield visibility
  rig.shieldMesh.visible = (f.blocking || f.action === 'blockstun') && f.action !== 'knockdown' && f.action !== 'ko';
  rig.shieldMesh.position.y = f.crouching ? 0.72 : 1.08;

  // Trait Aura visibility
  rig.auraRing.visible = f.traitActiveTimer > 0;
  if (f.traitActiveTimer > 0) {
    rig.auraRing.position.y = -y3d + 0.04;
    const pulse = 1 + 0.12 * Math.sin(time * 12);
    rig.auraRing.scale.set(pulse, pulse, 1);
  }

  // Nightwarden Drones
  rig.drones.forEach((d, idx) => {
    d.visible = idx < f.dronesCount;
    if (d.visible) {
      const ang = time * 3.4 + (idx * Math.PI * 2) / 3;
      d.position.set(Math.cos(ang) * 0.75, 1.85 + Math.sin(ang * 1.6) * 0.16, Math.sin(ang) * 0.55);
      d.rotation.y = ang;
    }
  });

  // Hit Flash Emissive
  const flash = f.hitFlashTimer > 0;
  for (const mat of rig.armorMaterials) {
    mat.emissive.setHex(flash ? 0xffffff : 0x000000);
    mat.emissiveIntensity = flash ? 0.85 : 0;
  }

  // Cape sway
  if (rig.cape) {
    rig.cape.rotation.x = 0.22 + Math.sin(time * 5 + f.slot) * 0.08 + (Math.abs(f.vx) > 40 ? 0.25 : 0);
  }

  // Target Joint Angles (smoothly damped!)
  let pivotY = 0;
  let pivotRotZ = 0;
  let torsoRotZ = -0.1;
  let headRotZ = 0.08;

  let lShX = 0.15;
  let lShZ = 0.65;
  let lElbZ = 0.95;

  let rShX = -0.15;
  let rShZ = 0.45;
  let rElbZ = 1.05;

  let lHipZ = 0.28;
  let lKneeZ = -0.45;
  let rHipZ = -0.24;
  let rKneeZ = -0.25;

  if (f.action === 'knockdown' || f.action === 'ko') {
    pivotY = 0.22;
    pivotRotZ = Math.PI * 0.48;
    torsoRotZ = 0;
    lShZ = 0.2;
    rShZ = -0.2;
  } else if (f.action === 'crouch') {
    pivotY = -0.35;
    torsoRotZ = -0.25;
    lHipZ = 0.95;
    lKneeZ = -1.65;
    rHipZ = 0.75;
    rKneeZ = -1.45;
  } else if (f.action === 'walk') {
    const stride = Math.sin(f.animTime * 11);
    pivotY = Math.abs(stride) * 0.05;
    torsoRotZ = -0.16;
    lHipZ = stride * 0.6;
    lKneeZ = -Math.max(0.15, -stride * 0.65);
    rHipZ = -stride * 0.6;
    rKneeZ = -Math.max(0.15, stride * 0.65);
    lShZ = 0.45 - stride * 0.35;
    rShZ = 0.45 + stride * 0.35;
  } else if (f.action === 'jump') {
    torsoRotZ = -0.18;
    lHipZ = 0.7;
    lKneeZ = -1.2;
    rHipZ = 0.35;
    rKneeZ = -0.8;
    lShZ = 1.4;
    rShZ = 1.1;
  } else if (f.action === 'hitstun') {
    torsoRotZ = 0.34;
    headRotZ = 0.25;
    lShZ = -0.3;
    rShZ = -0.2;
  } else if (f.action === 'blockstun' || f.blocking) {
    torsoRotZ = 0.06;
    lShZ = 1.35;
    lElbZ = 1.45;
    rShZ = 1.2;
    rElbZ = 1.4;
  } else if (f.action === 'attack' && f.currentMove) {
    const m = f.currentMove;
    const isWindup = f.moveElapsedFrames < m.startup;
    const ext = isWindup ? -0.3 : 1;

    if (m.id === 'light' || m.id === 'light2') {
      torsoRotZ = -0.22 * ext;
      lShZ = 1.55 * ext;
      lElbZ = 0.12;
      rShZ = 0.3;
    } else if (m.id === 'medium' || m.id === 'air_kick') {
      torsoRotZ = 0.24 * ext;
      lHipZ = 1.45 * ext;
      lKneeZ = -0.1;
    } else if (m.id === 'low_sweep') {
      pivotY = -0.45;
      torsoRotZ = 0.25;
      lHipZ = 1.35 * ext;
      lKneeZ = -0.05;
      rHipZ = 0.85;
      rKneeZ = -1.55;
    } else if (m.id === 'overhead' || m.id === 'heavy') {
      torsoRotZ = isWindup ? 0.38 : -0.48;
      lShZ = isWindup ? 2.6 : 1.15;
      rShZ = isWindup ? 2.5 : 1.05;
      lElbZ = 0.18;
      rElbZ = 0.18;
    } else if (m.id === 'uppercut') {
      torsoRotZ = 0.18;
      lShZ = 2.65;
      lElbZ = 0.25;
    } else if (m.id === 'special1') {
      torsoRotZ = -0.24;
      lShZ = 1.55;
      rShZ = 1.55;
      lElbZ = 0.1;
      rElbZ = 0.1;
    } else {
      torsoRotZ = -0.42;
      lShZ = 1.85;
      rShZ = 1.65;
      lElbZ = 0.15;
    }
  } else {
    // Idle breathing
    const breath = Math.sin(time * 4.5 + f.slot);
    pivotY = breath * 0.025;
    lShZ = 0.7 + breath * 0.06;
    rShZ = 0.55 - breath * 0.05;
  }

  const dampRate = 24;
  rig.bodyPivot.position.y = THREE.MathUtils.damp(rig.bodyPivot.position.y, pivotY, dampRate, dt);
  rig.bodyPivot.rotation.z = THREE.MathUtils.damp(rig.bodyPivot.rotation.z, pivotRotZ, dampRate, dt);
  rig.torso.rotation.z = THREE.MathUtils.damp(rig.torso.rotation.z, torsoRotZ, dampRate, dt);
  rig.head.rotation.z = THREE.MathUtils.damp(rig.head.rotation.z, headRotZ, dampRate, dt);

  rig.leftShoulder.rotation.x = THREE.MathUtils.damp(rig.leftShoulder.rotation.x, lShX, dampRate, dt);
  rig.leftShoulder.rotation.z = THREE.MathUtils.damp(rig.leftShoulder.rotation.z, lShZ, dampRate, dt);
  rig.leftElbow.rotation.z = THREE.MathUtils.damp(rig.leftElbow.rotation.z, lElbZ, dampRate, dt);

  rig.rightShoulder.rotation.x = THREE.MathUtils.damp(rig.rightShoulder.rotation.x, rShX, dampRate, dt);
  rig.rightShoulder.rotation.z = THREE.MathUtils.damp(rig.rightShoulder.rotation.z, rShZ, dampRate, dt);
  rig.rightElbow.rotation.z = THREE.MathUtils.damp(rig.rightElbow.rotation.z, rElbZ, dampRate, dt);

  rig.leftHip.rotation.z = THREE.MathUtils.damp(rig.leftHip.rotation.z, lHipZ, dampRate, dt);
  rig.leftKnee.rotation.z = THREE.MathUtils.damp(rig.leftKnee.rotation.z, lKneeZ, dampRate, dt);
  rig.rightHip.rotation.z = THREE.MathUtils.damp(rig.rightHip.rotation.z, rHipZ, dampRate, dt);
  rig.rightKnee.rotation.z = THREE.MathUtils.damp(rig.rightKnee.rotation.z, rKneeZ, dampRate, dt);
}
