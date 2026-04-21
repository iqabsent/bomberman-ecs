export class CollectibleComponent {
  constructor({ type }) {
    this.type = type;       // e.g. 'FLAME', 'BOMB', 'SPEED', 'DETONATE', etc.
    // TODO(events): replace with PickedUp component on this entity, payload: collector entity ID (component-on-entity pattern)
    this.pickedUpBy = null;
  }
}
