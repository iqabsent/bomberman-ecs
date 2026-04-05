export class CollectibleComponent {
  constructor(type) {
    this.type = type;       // e.g. 'FLAME', 'BOMB', 'SPEED', 'DETONATE', etc.
    this.pickedUpBy = null; // set to the collecting entity's ID by CollisionSystem
  }
}
