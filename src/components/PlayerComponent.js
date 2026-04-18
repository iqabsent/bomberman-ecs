import { SPEED } from '../ecs/config.js';

export class PlayerComponent {
  constructor() {
    this.maxBombs = 1;
    this.bombYield = 1;
    this.activeBombs = 0;
    this.wantsToPlaceBomb = false;
    this.wantsToDetonate = false;
    this.movementSpeed = SPEED.NORMAL;
    this.canDetonate = false;
    this.fireproof = false;
    this.invincibilityTimer = 0;
    this.pendingSpawn = null;   // set to a SPAWN value; PlayerSystem handles the reset and clears it
    this.pendingPowerup = null; // set by CollectibleSystem; applied and cleared by PlayerSystem
  }
}
