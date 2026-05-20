export type InputState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
};

export class InputController {
  readonly state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  };

  private readonly pressed = new Set<string>();

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.pressed.add(event.code);
    this.sync();
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
    this.sync();
  };

  private sync(): void {
    this.state.forward = this.pressed.has('KeyW') || this.pressed.has('ArrowUp');
    this.state.backward = this.pressed.has('KeyS') || this.pressed.has('ArrowDown');
    this.state.left = this.pressed.has('KeyA') || this.pressed.has('ArrowLeft');
    this.state.right = this.pressed.has('KeyD') || this.pressed.has('ArrowRight');
    this.state.jump = this.pressed.has('Space');
    this.state.sprint = this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight');
  }
}
