// Tag component — marks entity as destroyable by explosions
export class DestroyableComponent {
  constructor() {
    this.burning = false;
    this.revealQueued = false; // true once pendingMapReveals has been pushed for this cell
  }
}
