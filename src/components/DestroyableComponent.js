export class DestroyableComponent {
  static type = 'DestroyableComponent';
  constructor({ mapType = null, shouldPersist = false, managed = false } = {}) {
    this.destroyState  = null; // null | DESTROY.DESTROYING | DESTROY.DESTROYED
    this.mapType       = mapType;
    this.shouldPersist = shouldPersist;
    this.managed       = managed;
  }
}
