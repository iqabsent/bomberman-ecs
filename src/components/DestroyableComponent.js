// Tag component — marks entity as destroyable by explosions
export class DestroyableComponent {
  static type = 'DestroyableComponent';
  constructor() {
    this.destroyState = null; // null | DESTROY.PENDING | DESTROY.DESTROYING | DESTROY.DESTROYED
  }
}
