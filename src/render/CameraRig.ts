import * as THREE from 'three';

export class CameraRig {
  readonly target = new THREE.Vector3();
  yaw = Math.PI;

  private pitch = -0.48;
  private distance = 13;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly element: HTMLElement,
  ) {
    element.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointermove', this.handlePointerMove);
    element.addEventListener('wheel', this.handleWheel, { passive: true });
  }

  update(delta: number, focus: THREE.Vector3): void {
    this.target.lerp(focus, 1 - Math.exp(-10 * delta));
    const offset = new THREE.Vector3(0, 0, this.distance);
    offset.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

    const desired = this.target.clone().add(new THREE.Vector3(0, 3.2, 0)).add(offset);
    this.camera.position.lerp(desired, 1 - Math.exp(-9 * delta));
    this.camera.lookAt(this.target.x, this.target.y + 2.0, this.target.z);
  }

  dispose(): void {
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
    this.element.removeEventListener('wheel', this.handleWheel);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.element.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerUp = (): void => {
    this.isDragging = false;
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.isDragging) {
      return;
    }

    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    this.yaw -= dx * 0.006;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.004, -1.05, -0.18);
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    this.distance = THREE.MathUtils.clamp(this.distance + event.deltaY * 0.012, 7, 24);
  };
}
