import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const PIKACHU_MODEL_URL =
  'https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/25.glb';

type AnimationKey = 'idle' | 'run' | 'jump' | 'attack';

const CLIP_ALIASES: Record<AnimationKey, string[]> = {
  idle: ['idle', 'wait', 'stand', 'loop'],
  run: ['run', 'walk', 'move'],
  jump: ['jump', 'fall'],
  attack: ['attack', 'tackle', 'physical', 'special'],
};

export class CharacterModel {
  readonly root = new THREE.Group();

  private mixer: THREE.AnimationMixer | null = null;
  private readonly actions = new Map<AnimationKey, THREE.AnimationAction>();
  private activeAction: THREE.AnimationAction | null = null;
  private proceduralTime = 0;
  private attackTime = 0;

  async loadPikachu(): Promise<void> {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    const gltf = await loader.loadAsync(PIKACHU_MODEL_URL);
    const model = gltf.scene;
    this.prepareModel(model);

    this.root.clear();
    this.root.add(model);

    if (gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(model);
      this.mapActions(gltf.animations);
      this.play('idle');
      console.info(
        `Loaded Pikachu animation clips: ${gltf.animations.map((clip) => clip.name || '(unnamed)').join(', ')}`,
      );
    } else {
      console.info('Loaded Pikachu without embedded animation clips. Using procedural poses.');
    }
  }

  update(delta: number, state: { moving: boolean; grounded: boolean; attacking: boolean }): void {
    this.mixer?.update(delta);

    if (state.attacking) {
      this.attackTime = 0.22;
      this.play('attack');
    } else if (!state.grounded) {
      this.play('jump');
    } else if (state.moving) {
      this.play('run');
    } else {
      this.play('idle');
    }

    this.updateProceduralMotion(delta, state);
  }

  private prepareModel(model: THREE.Object3D): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = size.y > 0 ? 1.35 / size.y : 1;
    model.scale.setScalar(scale);

    model.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(model);
    const center = scaledBox.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -scaledBox.min.y, -center.z);
  }

  private mapActions(clips: THREE.AnimationClip[]): void {
    for (const key of Object.keys(CLIP_ALIASES) as AnimationKey[]) {
      const clip = this.findClip(clips, CLIP_ALIASES[key]);
      if (clip && this.mixer) {
        this.actions.set(key, this.mixer.clipAction(clip));
      }
    }

    if (!this.actions.has('idle') && clips[0] && this.mixer) {
      this.actions.set('idle', this.mixer.clipAction(clips[0]));
    }
  }

  private findClip(clips: THREE.AnimationClip[], aliases: string[]): THREE.AnimationClip | undefined {
    return clips.find((clip) => {
      const name = clip.name.toLowerCase();
      return aliases.some((alias) => name.includes(alias));
    });
  }

  private play(key: AnimationKey): void {
    const next = this.actions.get(key) ?? this.actions.get('idle');
    if (!next || next === this.activeAction) {
      return;
    }

    next.reset().fadeIn(0.12).play();
    this.activeAction?.fadeOut(0.12);
    this.activeAction = next;
  }

  private updateProceduralMotion(
    delta: number,
    state: { moving: boolean; grounded: boolean; attacking: boolean },
  ): void {
    this.proceduralTime += delta;
    this.attackTime = Math.max(0, this.attackTime - delta);

    const bob = state.moving && state.grounded ? Math.sin(this.proceduralTime * 14) * 0.08 : 0;
    const idle = !state.moving && state.grounded ? Math.sin(this.proceduralTime * 4) * 0.025 : 0;
    const attackLean = this.attackTime > 0 ? Math.sin((this.attackTime / 0.22) * Math.PI) : 0;

    this.root.position.y = bob + idle;
    this.root.rotation.x = -attackLean * 0.34;
    this.root.rotation.z = state.moving ? Math.sin(this.proceduralTime * 10) * 0.06 : 0;
  }
}
