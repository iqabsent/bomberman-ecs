export class CollisionComponent {
  static type = 'CollisionComponent';
  constructor({ canPass = 0 } = {}) {
    this.canPass  = canPass; // bitfield of TYPE.* flags this entity can move through
    this.blocked  = false;   // set by MovementSystem when velocity is clamped by a wall
  }
}
