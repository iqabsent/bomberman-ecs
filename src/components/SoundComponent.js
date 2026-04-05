export class SoundComponent {
  constructor() {
    this.queue = [];           // sound keys requested this frame
    this._lastAnimFrame = -1; // used by SoundSystem to detect animation frame changes for footsteps
  }
}
