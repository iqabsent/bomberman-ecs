export class HealthComponent {
  constructor() {
    this.isDying = false;
    this.deathAnimStarted = false;
    this.immune = false;
    // QUEUE: populated by CollisionSystem — revisit when proper message passing is in place
    this.pendingDamage = [];
  }
}
