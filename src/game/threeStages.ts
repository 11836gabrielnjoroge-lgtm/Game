import * as THREE from 'three';
import { createArenaFloorTexture, createEarthTexture } from './threeTextures';
import { StageId, StageProp } from './types';

export interface BuiltStage {
  group: THREE.Group;
  fogColor: number;
  fogDensity: number;
  earthMesh: THREE.Mesh | null;
  propVisuals: Map<
    string,
    {
      group: THREE.Group;
      ring: THREE.Mesh;
      emissiveMesh: THREE.Mesh;
    }
  >;
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  };
}

export function buildStageScene(
  stageId: StageId,
  props: StageProp[],
  worldScale: number,
  maxAnisotropy: number
): BuiltStage {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const propVisuals = new Map<string, { group: THREE.Group; ring: THREE.Mesh; emissiveMesh: THREE.Mesh }>();

  const floorTex = createArenaFloorTexture(stageId, maxAnisotropy);
  textures.push(floorTex);

  const floorGeo = new THREE.PlaneGeometry(140, 70);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: stageId === 'watchtower' ? 0.35 : 0.78,
    metalness: stageId === 'watchtower' ? 0.65 : 0.12,
  });
  geometries.push(floorGeo);
  materials.push(floorMat);

  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Subtle combat lane trim strips along z = -2.4 and z = +2.4
  const trimGeo = new THREE.BoxGeometry(28, 0.04, 0.14);
  const trimColor = stageId === 'metropolis' ? 0xf59e0b : stageId === 'watchtower' ? 0x38bdf8 : 0x94a3b8;
  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    emissive: trimColor,
    emissiveIntensity: 0.45,
    roughness: 0.4,
    metalness: 0.5,
  });
  geometries.push(trimGeo);
  materials.push(trimMat);

  const backTrim = new THREE.Mesh(trimGeo, trimMat);
  backTrim.position.set(0, 0.02, -2.5);
  const frontTrim = new THREE.Mesh(trimGeo, trimMat);
  frontTrim.position.set(0, 0.02, 2.5);
  group.add(backTrim, frontTrim);

  // Arena corner boundary beacons (Stage Transition zones at +/- 12.8m)
  const beaconGeo = new THREE.CylinderGeometry(0.12, 0.18, 3.6, 8);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.7,
    roughness: 0.3,
    metalness: 0.7,
  });
  geometries.push(beaconGeo);
  materials.push(beaconMat);

  [-13.4, 13.4].forEach((bx) => {
    const b = new THREE.Mesh(beaconGeo, beaconMat);
    b.position.set(bx, 1.8, -2.5);
    b.castShadow = true;
    group.add(b);
  });

  let fogColor = 0x111520;
  let fogDensity = 0.018;
  let earthMesh: THREE.Mesh | null = null;

  if (stageId === 'metropolis') {
    fogColor = 0x1a1412;
    fogDensity = 0.017;

    // Ruined concrete overpass in mid-background
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x3a3d46, roughness: 0.88, metalness: 0.08 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e222a, roughness: 0.5, metalness: 0.7 });
    const windowGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    });
    materials.push(concreteMat, darkMetalMat, windowGlowMat);

    // Broken concrete highway pillars
    const pillarGeo = new THREE.BoxGeometry(1.4, 6.5, 1.4);
    const deckGeo = new THREE.BoxGeometry(12, 0.8, 2.6);
    geometries.push(pillarGeo, deckGeo);

    [-11, -4.5, 6.5, 12.5].forEach((px, idx) => {
      const p = new THREE.Mesh(pillarGeo, concreteMat);
      p.position.set(px, 3.25, -7.5);
      p.rotation.z = idx % 2 === 0 ? 0.04 : -0.05;
      p.castShadow = true;
      p.receiveShadow = true;
      group.add(p);
    });

    const leftDeck = new THREE.Mesh(deckGeo, concreteMat);
    leftDeck.position.set(-9.5, 5.8, -7.5);
    leftDeck.rotation.z = -0.14;
    group.add(leftDeck);

    const rightDeck = new THREE.Mesh(deckGeo, concreteMat);
    rightDeck.position.set(10.5, 6.1, -7.5);
    rightDeck.rotation.z = 0.12;
    group.add(rightDeck);

    // Distant city skyscrapers fading into twilight fog
    const towerGeo = new THREE.BoxGeometry(2.8, 18, 2.8);
    geometries.push(towerGeo);
    const buildingCount = 14;
    const buildings = new THREE.InstancedMesh(towerGeo, darkMetalMat, buildingCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < buildingCount; i++) {
      const bx = -28 + i * 4.4;
      const bz = -18 - (i % 3) * 5;
      const sy = 0.65 + ((i * 7) % 5) * 0.25;
      dummy.position.set(bx, 9 * sy, bz);
      dummy.scale.set(0.8 + (i % 3) * 0.25, sy, 0.8 + (i % 2) * 0.3);
      dummy.updateMatrix();
      buildings.setMatrixAt(i, dummy.matrix);
    }
    buildings.computeBoundingSphere();
    group.add(buildings);

    // Glowing fire horizon strips
    const emberGeo = new THREE.PlaneGeometry(56, 4.5);
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.18 });
    geometries.push(emberGeo);
    materials.push(emberMat);
    const horizon = new THREE.Mesh(emberGeo, emberMat);
    horizon.position.set(0, 2.25, -24);
    group.add(horizon);
  } else if (stageId === 'watchtower') {
    fogColor = 0x070d19;
    fogDensity = 0.012;

    const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.82, roughness: 0.3 });
    const conduitMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.3,
      roughness: 0.2,
    });
    materials.push(hullMat, conduitMat);

    // Reactor frame ribs along back edge
    const ribGeo = new THREE.BoxGeometry(0.9, 9, 1.1);
    const pipeGeo = new THREE.CylinderGeometry(0.24, 0.24, 9, 10);
    geometries.push(ribGeo, pipeGeo);
    [-12, -5.5, 5.5, 12].forEach((rx) => {
      const rib = new THREE.Mesh(ribGeo, hullMat);
      rib.position.set(rx, 4.5, -6.5);
      rib.castShadow = true;
      group.add(rib);

      const pipe = new THREE.Mesh(pipeGeo, conduitMat);
      pipe.position.set(rx + 0.6, 4.5, -6.2);
      group.add(pipe);
    });

    // Rotating 3D Earth in Orbital Window
    const earthTex = createEarthTexture(maxAnisotropy);
    textures.push(earthTex);
    const earthGeo = new THREE.SphereGeometry(12, 32, 24);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.65,
      metalness: 0.05,
      emissive: 0x0a2540,
      emissiveIntensity: 0.35,
    });
    geometries.push(earthGeo);
    materials.push(earthMat);
    earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(-2, -1.5, -24);
    group.add(earthMesh);

    // Starfield
    const starPositions = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 90;
      starPositions[i * 3 + 1] = Math.random() * 32 + 1;
      starPositions[i * 3 + 2] = -28 - Math.random() * 14;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.14 });
    geometries.push(starGeo);
    materials.push(starMat);
    group.add(new THREE.Points(starGeo, starMat));
  } else {
    // Citadel Courtyard
    fogColor = 0x0b101b;
    fogDensity = 0.02;

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x2b313e, roughness: 0.9, metalness: 0.06 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.45, metalness: 0.8 });
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    materials.push(stoneMat, ironMat, moonMat);

    const colGeo = new THREE.CylinderGeometry(0.52, 0.62, 8.2, 8);
    const archBeamGeo = new THREE.BoxGeometry(5.6, 0.85, 1.1);
    const spireGeo = new THREE.ConeGeometry(1.1, 4.5, 6);
    geometries.push(colGeo, archBeamGeo, spireGeo);

    [-11, -5.5, 0, 5.5, 11].forEach((cx) => {
      const col = new THREE.Mesh(colGeo, stoneMat);
      col.position.set(cx, 4.1, -6.8);
      col.castShadow = true;
      group.add(col);
    });

    [-8.25, -2.75, 2.75, 8.25].forEach((bx) => {
      const beam = new THREE.Mesh(archBeamGeo, stoneMat);
      beam.position.set(bx, 8.0, -6.8);
      group.add(beam);
    });

    [-11, 11].forEach((sx) => {
      const spire = new THREE.Mesh(spireGeo, ironMat);
      spire.position.set(sx, 10.4, -6.8);
      group.add(spire);
    });

    // Storm Moon
    const moonGeo = new THREE.CircleGeometry(3.2, 24);
    geometries.push(moonGeo);
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(9, 12.5, -28);
    group.add(moon);
  }

  // Interactive Stage Props
  for (const prop of props) {
    const pGroup = new THREE.Group();
    const px = (prop.x - 780) * worldScale;
    pGroup.position.set(px, 0, -0.4);

    let emissiveMesh: THREE.Mesh;

    if (prop.kind === 'crate') {
      const bodyGeo = new THREE.BoxGeometry(1.4, 1.05, 1.05);
      const stripeGeo = new THREE.BoxGeometry(1.44, 0.16, 1.09);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a3345, metalness: 0.72, roughness: 0.35 });
      const stripeMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.85,
        roughness: 0.3,
      });
      geometries.push(bodyGeo, stripeGeo);
      materials.push(bodyMat, stripeMat);

      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.525;
      body.castShadow = true;
      body.receiveShadow = true;

      emissiveMesh = new THREE.Mesh(stripeGeo, stripeMat);
      emissiveMesh.position.y = 0.72;
      pGroup.add(body, emissiveMesh);
    } else if (prop.kind === 'coil') {
      const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.4, 12);
      const coreGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.35, 12);
      const capGeo = new THREE.CylinderGeometry(0.58, 0.52, 0.25, 12);
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 1.6,
        roughness: 0.2,
      });
      geometries.push(baseGeo, coreGeo, capGeo);
      materials.push(metalMat, coreMat);

      const base = new THREE.Mesh(baseGeo, metalMat);
      base.position.y = 0.2;
      base.castShadow = true;

      emissiveMesh = new THREE.Mesh(coreGeo, coreMat);
      emissiveMesh.position.y = 1.05;

      const cap = new THREE.Mesh(capGeo, metalMat);
      cap.position.y = 1.8;
      cap.castShadow = true;
      pGroup.add(base, emissiveMesh, cap);
    } else {
      const monoGeo = new THREE.CylinderGeometry(0.38, 0.56, 1.85, 6);
      const runeGeo = new THREE.TorusGeometry(0.45, 0.05, 8, 18);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.88, metalness: 0.1 });
      const runeMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        emissive: 0x94a3b8,
        emissiveIntensity: 1.0,
      });
      geometries.push(monoGeo, runeGeo);
      materials.push(stoneMat, runeMat);

      const mono = new THREE.Mesh(monoGeo, stoneMat);
      mono.position.y = 0.925;
      mono.castShadow = true;

      emissiveMesh = new THREE.Mesh(runeGeo, runeMat);
      emissiveMesh.position.y = 1.2;
      emissiveMesh.rotation.x = Math.PI / 2;
      pGroup.add(mono, emissiveMesh);
    }

    // Proximity prompt ring on floor
    const ringGeo = new THREE.RingGeometry(0.85, 1.05, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    geometries.push(ringGeo);
    materials.push(ringMat);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    ring.visible = false;
    pGroup.add(ring);

    group.add(pGroup);
    propVisuals.set(prop.id, { group: pGroup, ring, emissiveMesh });
  }

  return {
    group,
    fogColor,
    fogDensity,
    earthMesh,
    propVisuals,
    disposables: { geometries, materials, textures },
  };
}
