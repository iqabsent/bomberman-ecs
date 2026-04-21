export class HealthComponent {
  constructor() {
    this.isDying = false;
    this.deathAnimStarted = false;
    this.immune = false;
    // TODO(events): replace pendingDamage array with DamageEvent component on this entity, payload: DAMAGE_TYPE (component-on-entity pattern)
    this.pendingDamage = [];
  }
}
