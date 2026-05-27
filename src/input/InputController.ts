export type InputState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  attack: boolean;
};

export class InputController {
  readonly state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    attack: false,
  };

  private readonly pressed = new Set<string>();

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.pressed.add(event.code);
    this.sync();
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
    this.sync();
  };

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.pressed.add('MouseLeft');
      this.sync();
    }
  };

  private readonly handleMouseUp = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.pressed.delete('MouseLeft');
      this.sync();
    }
  };

  private sync(): void {
    this.state.forward = this.pressed.has('KeyW') || this.pressed.has('ArrowUp');
    this.state.backward = this.pressed.has('KeyS') || this.pressed.has('ArrowDown');
    this.state.left = this.pressed.has('KeyA') || this.pressed.has('ArrowLeft');
    this.state.right = this.pressed.has('KeyD') || this.pressed.has('ArrowRight');
    this.state.jump = this.pressed.has('Space');
    this.state.sprint = this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight');
    this.state.attack = this.pressed.has('KeyF') || this.pressed.has('MouseLeft');
  }
}
