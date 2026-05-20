import * as THREE from 'three';
import { InputController } from '../input/InputController';
import { PlayerController } from '../player/PlayerController';
import { BIOMES, getBiomeAt } from '../world/biomes';
import { createLandmarks, buildLandmarkObjects, type Landmark } from '../world/landmarks';
import { buildBiomeProps } from '../world/props';
import { createTerrain, getTerrainHeight } from '../world/terrain';
import { CameraRig } from './CameraRig';

const WORLD_SEED = 1017;

export class WorldApp {
  private readonly shell: HTMLDivElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(62, 1, 0.1, 700);
  private readonly clock = new THREE.Clock();
  private readonly input = new InputController();
  private readonly landmarks: Landmark[];
  private readonly player: PlayerController;
  private readonly cameraRig: CameraRig;
  private readonly statusSubtitle: HTMLDivElement;
  private frameId = 0;

  constructor(private readonly root: HTMLElement) {
    this.shell = document.createElement('div');
    this.shell.className = 'game-shell';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'world-canvas';
    this.shell.append(this.canvas);
    this.root.append(this.shell);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.landmarks = createLandmarks(WORLD_SEED);
    this.player = new PlayerController((x, z) => getTerrainHeight(x, z, WORLD_SEED));
    this.cameraRig = new CameraRig(this.camera, this.canvas);
    this.statusSubtitle = this.createHud();

    this.setupScene();
    this.resize();

    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
  }

  start(): void {
    this.clock.start();
    this.frameId = window.requestAnimationFrame(this.tick);
  }

  dispose(): void {
    window.cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.input.dispose();
    this.cameraRig.dispose();
    this.renderer.dispose();
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color('#9fd4f4');
    this.scene.fog = new THREE.Fog('#9fd4f4', 95, 245);

    const hemi = new THREE.HemisphereLight('#bfe8ff', '#536c4a', 1.65);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight('#fff0cf', 3.2);
    sun.position.set(-32, 72, 38);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 170;
    sun.shadow.camera.left = -95;
    sun.shadow.camera.right = 95;
    sun.shadow.camera.top = 95;
    sun.shadow.camera.bottom = -95;
    this.scene.add(sun);

    const terrain = createTerrain({ size: 230, segments: 180, seed: WORLD_SEED });
    this.scene.add(terrain);
    this.scene.add(this.createWater());
    this.scene.add(buildBiomeProps(WORLD_SEED));
    this.scene.add(buildLandmarkObjects(this.landmarks));
    this.scene.add(this.createSkyIslands());
    this.scene.add(this.player.object);
  }

  private readonly tick = (): void => {
    const delta = Math.min(this.clock.getDelta(), 1 / 30);
    this.player.update(delta, this.input.state, this.cameraRig.yaw);
    this.cameraRig.update(delta, this.player.object.position);
    this.updateHud();
    this.renderer.render(this.scene, this.camera);
    this.frameId = window.requestAnimationFrame(this.tick);
  };

  private updateHud(): void {
    const { x, z } = this.player.object.position;
    const biome = getBiomeAt(x, z);
    const nearest = this.getNearestLandmark();
    this.statusSubtitle.textContent = `${biome.label} · 가까운 장소: ${nearest.label} ${nearest.distance.toFixed(0)}m`;
  }

  private getNearestLandmark(): { label: string; distance: number } {
    let result = { label: this.landmarks[0].label, distance: Number.POSITIVE_INFINITY };

    for (const landmark of this.landmarks) {
      const distance = landmark.position.distanceTo(this.player.object.position);
      if (distance < result.distance) {
        result = { label: landmark.label, distance };
      }
    }

    return result;
  }

  private createHud(): HTMLDivElement {
    const hud = document.createElement('div');
    hud.className = 'hud';

    const chip = document.createElement('div');
    chip.className = 'status-chip';
    chip.innerHTML = `
      <span class="status-dot"></span>
      <span class="status-text">
        <span class="status-title">월드 프로토타입</span>
        <span class="status-subtitle">시작 초원 · 가까운 장소 확인 중</span>
      </span>
    `;
    hud.append(chip);

    const biomePanel = document.createElement('div');
    biomePanel.className = 'biome-panel';
    for (const biome of Object.values(BIOMES)) {
      if (biome.id === 'sky') {
        continue;
      }

      const row = document.createElement('div');
      row.className = 'biome-row';
      row.innerHTML = `
        <span class="biome-swatch" style="background:${biome.color}"></span>
        <span>${biome.label}</span>
        <span>${biome.id}</span>
      `;
      biomePanel.append(row);
    }
    hud.append(biomePanel);

    const hint = document.createElement('div');
    hint.className = 'hint-strip';
    hint.textContent = 'WASD 이동 · Space 점프 · Shift 달리기 · 드래그 카메라 회전 · 휠 줌';
    hud.append(hint);

    this.shell.append(hud);
    const subtitle = chip.querySelector<HTMLDivElement>('.status-subtitle');
    if (!subtitle) {
      throw new Error('Missing HUD subtitle');
    }

    return subtitle;
  }

  private createWater(): THREE.Mesh {
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(34, 64),
      new THREE.MeshStandardMaterial({
        color: '#4bb5d8',
        transparent: true,
        opacity: 0.68,
        roughness: 0.18,
        metalness: 0.02,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(33, -0.6, -18);
    water.receiveShadow = true;
    return water;
  }

  private createSkyIslands(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: '#78bfe0', roughness: 0.82 });
    const topMaterial = new THREE.MeshStandardMaterial({ color: '#7ad77d', roughness: 0.86 });

    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 + 0.2;
      const island = new THREE.Mesh(new THREE.CylinderGeometry(8, 3, 5, 9), material);
      island.position.set(Math.cos(angle) * 46 + 18, 24 + i * 2.2, Math.sin(angle) * 24 - 58);
      island.castShadow = true;
      island.receiveShadow = true;
      group.add(island);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.2, 0.4, 9), topMaterial);
      cap.position.copy(island.position).add(new THREE.Vector3(0, 2.7, 0));
      cap.receiveShadow = true;
      group.add(cap);
    }

    return group;
  }

  private readonly resize = (): void => {
    const width = this.shell.clientWidth || window.innerWidth;
    const height = this.shell.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
  };
}
