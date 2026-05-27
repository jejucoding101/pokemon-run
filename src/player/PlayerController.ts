import * as THREE from 'three';
import type { InputState } from '../input/InputController';
import { CharacterModel } from './CharacterModel';

export class PlayerController {
  readonly object: THREE.Group;

  private readonly character = new CharacterModel();
  private readonly fallbackAvatar = new THREE.Group();
  private readonly velocity = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private isGrounded = false;
  private isMoving = false;

  constructor(
    private readonly getHeight: (x: number, z: number) => number,
    spawn = new THREE.Vector3(0, 4, 10),
  ) {
    this.object = this.createAvatar();
    this.object.position.copy(spawn);
    void this.character
      .loadPikachu()
      .then(() => {
        this.fallbackAvatar.visible = false;
      })
      .catch((error: unknown) => {
        console.warn('Failed to load Pikachu model. Using fallback avatar.', error);
      });
  }

  update(delta: number, input: InputState, cameraYaw: number): void {
    const moveX = Number(input.right) - Number(input.left);
    const moveZ = Number(input.backward) - Number(input.forward);
    const speed = input.sprint ? 15 : 9;

    this.direction.set(moveX, 0, moveZ);
    this.isMoving = this.direction.lengthSq() > 0;
    if (this.isMoving) {
      this.direction.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, this.direction.x * speed, 12, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, this.direction.z * speed, 12, delta);
      this.object.rotation.y = Math.atan2(this.direction.x, this.direction.z);
    } else {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 10, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 10, delta);
    }

    if (input.jump && this.isGrounded) {
      this.velocity.y = 8.2;
      this.isGrounded = false;
    }

    this.velocity.y -= 22 * delta;
    this.object.position.addScaledVector(this.velocity, delta);

    const groundY = this.getHeight(this.object.position.x, this.object.position.z) + 1.15;
    if (this.object.position.y <= groundY) {
      this.object.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    const bounds = 106;
    this.object.position.x = THREE.MathUtils.clamp(this.object.position.x, -bounds, bounds);
    this.object.position.z = THREE.MathUtils.clamp(this.object.position.z, -bounds, bounds);
    this.character.update(delta, {
      moving: this.isMoving,
      grounded: this.isGrounded,
      attacking: input.attack,
    });
  }

  private createAvatar(): THREE.Group {
    const group = new THREE.Group();
    group.add(this.character.root);
    group.add(this.fallbackAvatar);

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#4da3ff', roughness: 0.62 });
    const headMaterial = new THREE.MeshStandardMaterial({ color: '#ffe0bd', roughness: 0.72 });
    const accentMaterial = new THREE.MeshStandardMaterial({ color: '#213a56', roughness: 0.76 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.15, 6, 12), bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.name = 'fallback-body';
    this.fallbackAvatar.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.43, 18, 14), headMaterial);
    head.position.y = 1.65;
    head.castShadow = true;
    head.name = 'fallback-head';
    this.fallbackAvatar.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.08), accentMaterial);
    visor.position.set(0, 1.7, -0.38);
    visor.castShadow = true;
    visor.name = 'fallback-visor';
    this.fallbackAvatar.add(visor);

    return group;
  }
}
