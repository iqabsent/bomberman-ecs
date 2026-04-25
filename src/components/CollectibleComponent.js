export class CollectibleComponent {
  static type = 'CollectibleComponent';
  constructor({ type }) {
    this.type = type; // e.g. 'FLAME', 'BOMB', 'SPEED', 'DETONATE', etc.
  }
}
