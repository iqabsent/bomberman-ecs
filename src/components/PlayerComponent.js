import { SPEED } from '../ecs/config.js';

export class PlayerComponent {
  constructor() {
    this.maxBombs = 1;
    this.bombYield = 1;
    this.activeBombs = 0;
    this.pendingBombPlacement  = false; // set by InputSystem when S held and activeBombs < maxBombs
    this.pendingBombDetonation = false; // set by InputSystem when D pressed and canDetonate
    // INTENT FLAGS: set by InputSystem — revisit when proper message passing is in place
    this.inputDx = 0;
    this.inputDy = 0;
    this.movementSpeed = SPEED.NORMAL;
    this.canDetonate = false;
    this.fireproof = false;
    this.invincibilityTimer = 0;
    this.pendingSpawn = null;   // set to a SPAWN value; PlayerSystem handles the reset and clears it
    this.pendingPowerup = null; // set by CollectibleSystem; applied and cleared by PlayerSystem
  }
}
