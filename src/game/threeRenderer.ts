import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CombatEngine } from './engine';
import { FLOOR_Y } from './renderer';
import { buildFighterRig, FighterRig, updateFighterRig } from './threeFighters';
import { buildStageScene, BuiltStage } from './threeStages';
import { createContactShadowTexture } from './threeTextures';
import { FighterId, StageId } from './types';

const WORLD_SCALE = 0.018; // 1560px -> ~28m arena width

// Pre-allocated math helpers (Zero GC in render loop)
const _color = new THREE.Color();

export class ThreeArenaRenderer {
  public readonly isSoftwareGl: boolean;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;

  private envMap: THREE.Texture;
  private shadowTexture: THREE.Texture;

  private p1Rig: FighterRig | null = null;
  private p2Rig: FighterRig | null = null;
  private p1IdLoaded: FighterId | null = null;
  private p2IdLoaded: FighterId | null = null;

  private activeStageId: StageId | null = null;
  private builtStage: BuiltStage | null = null;

  private projectilePool: THREE.Mesh[] = [];
  private particlePool: THREE.Mesh[] = [];
  private projGeo: THREE.BufferGeometry;
  private partGeo: THREE.BufferGeometry;

  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;

  private camX = 0;
  private camY = 2.65;
  private camZ = 9.6;
  private camLookY = 1.55;

  private contextLost = false;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // Detect software WebGL strictly via GPU renderer string
    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, width / Math.max(1, height), 0.2, 160);
    this.camera.position.set(0, this.camY, this.camZ);

    // Mandatory studio environment reflection map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envMap;
    pmrem.dispose();

    // 3-Point Warm/Cool Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.75);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    this.keyLight.position.set(6, 14, 9);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 42;
    this.keyLight.shadow.camera.left = -16;
    this.keyLight.shadow.camera.right = 16;
    this.keyLight.shadow.camera.top = 10;
    this.keyLight.shadow.camera.bottom = -6;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 1.35);
    this.rimLight.position.set(-6, 7, -10);
    this.scene.add(this.rimLight);

    this.shadowTexture = createContactShadowTexture();

    // Pre-allocated Projectile & Particle Mesh Pools
    this.projGeo = new THREE.SphereGeometry(0.24, 10, 10);
    for (let i = 0; i < 16; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const mesh = new THREE.Mesh(this.projGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.projectilePool.push(mesh);
    }

    this.partGeo = new THREE.OctahedronGeometry(0.09, 0);
    for (let i = 0; i < 64; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(this.partGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particlePool.push(mesh);
    }

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
  };

  private onContextRestored = () => {
    this.contextLost = false;
  };

  public resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private ensureStageAndFighters(engine: CombatEngine) {
    if (this.activeStageId !== engine.stageId) {
      if (this.builtStage) {
        this.scene.remove(this.builtStage.group);
        this.builtStage.disposables.geometries.forEach((g) => g.dispose());
        this.builtStage.disposables.materials.forEach((m) => m.dispose());
        this.builtStage.disposables.textures.forEach((t) => t.dispose());
      }
      this.activeStageId = engine.stageId;
      this.builtStage = buildStageScene(
        engine.stageId,
        engine.props,
        WORLD_SCALE,
        this.renderer.capabilities.getMaxAnisotropy()
      );
      this.scene.add(this.builtStage.group);
      this.scene.background = new THREE.Color(this.builtStage.fogColor);
      this.scene.fog = new THREE.FogExp2(this.builtStage.fogColor, this.builtStage.fogDensity);
    }

    if (this.p1IdLoaded !== engine.p1.profile.id) {
      if (this.p1Rig) this.scene.remove(this.p1Rig.root);
      this.p1IdLoaded = engine.p1.profile.id;
      this.p1Rig = buildFighterRig(engine.p1.profile, this.shadowTexture);
      this.scene.add(this.p1Rig.root);
    }

    if (this.p2IdLoaded !== engine.p2.profile.id) {
      if (this.p2Rig) this.scene.remove(this.p2Rig.root);
      this.p2IdLoaded = engine.p2.profile.id;
      this.p2Rig = buildFighterRig(engine.p2.profile, this.shadowTexture);
      this.scene.add(this.p2Rig.root);
    }
  }

  public syncAndRender(engine: CombatEngine, time: number, dt: number) {
    if (this.contextLost) return;
    this.ensureStageAndFighters(engine);

    // 1. Update Fighters
    if (this.p1Rig) {
      updateFighterRig(this.p1Rig, engine.p1, FLOOR_Y, WORLD_SCALE, time, dt);
    }
    if (this.p2Rig) {
      updateFighterRig(this.p2Rig, engine.p2, FLOOR_Y, WORLD_SCALE, time, dt);
    }

    // 2. Update Stage Props & Earth rotation
    if (this.builtStage) {
      if (this.builtStage.earthMesh) {
        this.builtStage.earthMesh.rotation.y += dt * 0.04;
      }
      for (const prop of engine.props) {
        const vis = this.builtStage.propVisuals.get(prop.id);
        if (!vis) continue;
        const ready = prop.cooldown <= 0;
        vis.group.scale.setScalar(ready ? 1 : 0.72);
        const near =
          (ready && Math.abs(engine.p1.x - prop.x) < 92 && engine.p1.grounded) ||
          (ready && Math.abs(engine.p2.x - prop.x) < 92 && engine.p2.grounded);
        vis.ring.visible = near;
        if (near) {
          const pulse = 1 + 0.14 * Math.sin(time * 9);
          vis.ring.scale.set(pulse, pulse, 1);
        }
        const mat = vis.emissiveMesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = ready ? 1.15 : 0.15;
      }
    }

    // 3. Projectiles (Pooled)
    for (let i = 0; i < this.projectilePool.length; i++) {
      const mesh = this.projectilePool[i];
      const proj = engine.projectiles[i];
      if (!proj) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      mesh.position.set((proj.x - 780) * WORLD_SCALE, (FLOOR_Y - proj.y) * WORLD_SCALE, 0);
      mesh.scale.set(proj.kind === 'beam' ? 2.2 : 1, proj.kind === 'beam' ? 0.55 : 1, 1);
      (mesh.material as THREE.MeshBasicMaterial).color.set(proj.coreColor);
    }

    // 4. Particles (Pooled)
    for (let i = 0; i < this.particlePool.length; i++) {
      const mesh = this.particlePool[i];
      const part = engine.particles[i];
      if (!part) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      mesh.position.set(
        (part.x - 780) * WORLD_SCALE,
        Math.max(0.05, (FLOOR_Y - part.y) * WORLD_SCALE),
        part.kind === 'spark' ? Math.sin(i) * 0.45 : 0
      );
      const s = Math.max(0.4, part.size * 0.14);
      mesh.scale.setScalar(s);
      mesh.rotation.x += dt * 8;
      mesh.rotation.y += dt * 6;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      _color.set(part.color.startsWith('rgba') ? '#bae6fd' : part.color);
      mat.color.copy(_color);
      mat.opacity = Math.max(0, Math.min(1, part.alpha));
    }

    // 5. Dynamic 3D Fighting Camera
    const p1x = (engine.p1.x - 780) * WORLD_SCALE;
    const p2x = (engine.p2.x - 780) * WORLD_SCALE;
    const midX = (p1x + p2x) / 2;
    const sep = Math.abs(p1x - p2x);

    let targetCamX = midX;
    let targetCamY = 2.45;
    let targetCamZ = THREE.MathUtils.clamp(6.8 + sep * 0.62, 6.8, 12.2);
    let targetLookY = 1.45;

    if (engine.superCinematic.active) {
      const attacker = engine.superCinematic.attackerSlot === 1 ? engine.p1 : engine.p2;
      targetCamX = (attacker.x - 780) * WORLD_SCALE + attacker.facing * 0.6;
      targetCamY = 1.95;
      targetCamZ = 5.4;
      targetLookY = 1.35;
    } else if (engine.clash?.active) {
      targetCamX = midX;
      targetCamY = 2.0;
      targetCamZ = 5.8;
      targetLookY = 1.4;
    }

    this.camX = THREE.MathUtils.damp(this.camX, targetCamX, 8, dt);
    this.camY = THREE.MathUtils.damp(this.camY, targetCamY, 8, dt);
    this.camZ = THREE.MathUtils.damp(this.camZ, targetCamZ, 8, dt);
    this.camLookY = THREE.MathUtils.damp(this.camLookY, targetLookY, 8, dt);

    const shake = engine.shakeTimer > 0 ? engine.shakeIntensity * 0.015 : 0;
    const sx = shake > 0 ? (Math.random() * 2 - 1) * shake : 0;
    const sy = shake > 0 ? (Math.random() * 2 - 1) * shake : 0;

    this.camera.position.set(this.camX + sx, this.camY + sy, this.camZ);
    this.camera.lookAt(this.camX, this.camLookY, 0);

    // Subtle Super/Stage-transition lighting mood
    this.keyLight.intensity = engine.superCinematic.active ? 0.65 : 2.2;
    this.hemiLight.intensity = engine.superCinematic.active ? 0.25 : 0.75;

    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored);

    if (this.builtStage) {
      this.builtStage.disposables.geometries.forEach((g) => g.dispose());
      this.builtStage.disposables.materials.forEach((m) => m.dispose());
      this.builtStage.disposables.textures.forEach((t) => t.dispose());
    }

    this.projGeo.dispose();
    this.partGeo.dispose();
    this.projectilePool.forEach((m) => (m.material as THREE.Material).dispose());
    this.particlePool.forEach((m) => (m.material as THREE.Material).dispose());

    this.envMap.dispose();
    this.shadowTexture.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
