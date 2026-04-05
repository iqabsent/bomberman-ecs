import { BLOCK_WIDTH, BLOCK_HEIGHT } from '../ecs/config.js';

export class TransformComponent {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.gridX = Math.round(x / BLOCK_WIDTH);
    this.gridY = Math.round(y / BLOCK_HEIGHT);
  }
}
