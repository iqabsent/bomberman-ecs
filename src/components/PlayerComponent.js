import { SPEED } from '../ecs/config.js';

export class PlayerComponent {
  constructor() {
    this.maxBombs = 1;
    this.bombYield = 1;
    this.activeBombs = 0;
    // TODO(events): replace with BombPlacementIntent component on this entity (component-on-entity pattern)
    this.pendingBombPlacement  = false;
    // TODO(events): replace with BombDetonationIntent component on this entity (component-on-entity pattern)
    this.pendingBombDetonation = false;
    this.inputDx = 0;
    this.inputDy = 0;
    this.movementSpeed = SPEED.NORMAL;
    this.canDetonate = false;
    this.fireproof = false;
    this.invincibilityTimer = 0;
    // TODO(events): replace with SpawnIntent component on this entity, payload: SPAWN type (component-on-entity pattern)
    this.pendingSpawn = null;
    // TODO(events): replace with PowerUpIntent component on this entity, payload: power-up type (component-on-entity pattern)
    this.pendingPowerup = null;
  }
}
