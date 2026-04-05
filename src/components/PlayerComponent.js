import { SPEED, MAX_BOMBS, MAX_YIELD, INVINCIBILITY_TIMER } from '../ecs/config.js';

export class PlayerComponent {
  constructor() {
    this.maxBombs = 1;
    this.bombYield = 1;
    this.activeBombs = 0;
    this.wantsToPlaceBomb = false;
    this.wantsToDetonate = false;
    this.movementSpeed = SPEED.NORMAL;
    this.canDetonate = false;
    this.canPassBomb = false;
    this.canPassWall = false;
    this.fireproof = false;
    this.invincibilityTimer = 0;
  }

  reset() {
    this.maxBombs = 1;
    this.bombYield = 1;
    this.activeBombs = 0;
    this.movementSpeed = SPEED.NORMAL;
    this.canDetonate = false;
    this.canPassBomb = false;
    this.canPassWall = false;
    this.fireproof = false;
    this.invincibilityTimer = 0;
  }

  applyPowerup(type) {
    switch (type) {
      case 'FLAME':      this.bombYield = Math.min(this.bombYield + 1, MAX_YIELD); break;
      case 'BOMB':       this.maxBombs  = Math.min(this.maxBombs  + 1, MAX_BOMBS); break;
      case 'SPEED':      this.movementSpeed = SPEED.FAST; break;
      case 'DETONATE':   this.canDetonate = true; break;
      case 'PASS_BOMB':  this.canPassBomb = true; break;
      case 'PASS_WALL':  this.canPassWall = true; break;
      case 'FIREPROOF':  this.fireproof = true; break;
      case 'INVINCIBLE': this.invincibilityTimer = INVINCIBILITY_TIMER; break;
    }
  }
}
