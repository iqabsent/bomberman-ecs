export class MovableComponent {
  static type = 'MovableComponent';
  constructor({ canPass = 0 } = {}) {
    this.canPass = canPass; // bitfield of TYPE.* flags this entity can move through
  }
}
