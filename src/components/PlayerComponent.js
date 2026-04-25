import { SPEED } from '../ecs/config.js';

export class PlayerComponent {
  static type = 'PlayerComponent';
  constructor() {
    this.maxBombs = 1;
    this.bombYield = 1;
    this.activeBombs = 0;
    this.inputDx = 0;
    this.inputDy = 0;
    this.movementSpeed = SPEED.NORMAL;
    this.canDetonate = false;
    this.fireproof = false;
    this.invincibilityTimer = 0;
  }
}
