import { BOMB_FUSE_TICKS } from '../ecs/config.js';

export class BombComponent {
  constructor({ gridX, gridY, bombYield, ownerId }) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.fuseTicks = BOMB_FUSE_TICKS;
    this.yield = bombYield;
    this.ownerId = ownerId;
    this.chained = false; // true when triggered by another explosion — bypasses canDetonate
  }
}
