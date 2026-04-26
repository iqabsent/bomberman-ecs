export class DestroyableComponent {
  static type = 'DestroyableComponent';
  constructor({ mapType = null, shouldPersist = false, onDestroyedEvent = null, onTriggerEvent = null } = {}) {
    this.destroyState  = null; // null | DESTROY.DESTROYING | DESTROY.DESTROYED
    this.mapType       = mapType;
    this.shouldPersist = shouldPersist;
    this.onDestroyedEvent = onDestroyedEvent;
    this.onTriggerEvent   = onTriggerEvent;
  }
}
