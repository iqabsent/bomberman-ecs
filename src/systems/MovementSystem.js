import { BLOCK_WIDTH, BLOCK_HEIGHT, STATE } from '../ecs/config.js';
import { TRANSFORM, VELOCITY, GRID_PLACEMENT, GAME_STATE } from '../components';

export class MovementSystem {
  constructor() {
    this.name = 'movement';
  }

  apply(engine, dt) {

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState || gameState.currentState !== STATE.PLAYING) return;

    for (const id of engine.entities) {
      const transform     = engine.getComponent(id, TRANSFORM);
      const velocity      = engine.getComponent(id, VELOCITY);
      const gridPlacement = engine.getComponent(id, GRID_PLACEMENT);
      if (!transform || !velocity || !gridPlacement) continue;

      const movingX = velocity.vx !== 0;
      const movingY = velocity.vy !== 0;
      if (!movingX && !movingY) continue;

      const dx = velocity.vx * dt;
      const dy = velocity.vy * dt;

      // Grid-align correction (original Bomberman style)
      const gridX = Math.round(transform.x / BLOCK_WIDTH);
      const gridY = Math.round(transform.y / BLOCK_HEIGHT);
      const gridPosX = gridX * BLOCK_WIDTH;
      const gridPosY = gridY * BLOCK_HEIGHT;

      let correctionX = 0;
      let correctionY = 0;

      if (movingX && !movingY) {
        const errY = gridPosY - transform.y;
        if (errY !== 0) {
          const maxCorrection = Math.min(Math.abs(errY), Math.abs(dx));
          correctionY = Math.sign(errY) * maxCorrection;
        }
      } else if (movingY && !movingX) {
        const errX = gridPosX - transform.x;
        if (errX !== 0) {
          const maxCorrection = Math.min(Math.abs(errX), Math.abs(dy));
          correctionX = Math.sign(errX) * maxCorrection;
        }
      }

      transform.x += dx + correctionX;
      transform.y += dy + correctionY;
      gridPlacement.gridX = Math.round(transform.x / BLOCK_WIDTH);
      gridPlacement.gridY = Math.round(transform.y / BLOCK_HEIGHT);
    }
  }
}
