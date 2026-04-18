import { BLOCK_WIDTH, BLOCK_HEIGHT, MAP_WIDTH, MAP_HEIGHT, TYPE, STATE } from '../ecs/config.js';
import { TRANSFORM, VELOCITY, HEALTH, COLLISION, GRID_PLACEMENT, GAME_STATE } from '../components';

export class MovementSystem {
  constructor() {
    this.name = 'movement';
  }

  apply(engine, dt) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState || gameState.currentState !== STATE.PLAYING) return;

    const { gameMap } = gameState;

    for (const id of engine.entities) {
      const transform     = engine.getComponent(id, TRANSFORM);
      const velocity      = engine.getComponent(id, VELOCITY);
      const gridPlacement = engine.getComponent(id, GRID_PLACEMENT);
      if (!transform || !velocity || !gridPlacement) continue;

      const health = engine.getComponent(id, HEALTH);
      if (health && health.isDying) continue;

      const collision = engine.getComponent(id, COLLISION);
      const canPass   = collision ? collision.canPass : 0;
      if (collision) collision.blocked = false;

      // Clamp movement against blocked cells
      if (gameMap && (velocity.vx !== 0 || velocity.vy !== 0)) {
        const gridX = Math.round(transform.x / BLOCK_WIDTH);
        const gridY = Math.round(transform.y / BLOCK_HEIGHT);

        if (velocity.vx !== 0) {
          const tgx = gridX + Math.sign(velocity.vx);
          if (this.isCellBlocked(gameMap, tgx, gridY, canPass)) {
            const targetCellX = tgx * BLOCK_WIDTH;
            if (Math.abs(transform.x + velocity.vx - targetCellX) < BLOCK_WIDTH) {
              velocity.vx = 0;
              transform.x = gridX * BLOCK_WIDTH;
              gridPlacement.gridX = gridX;
              if (collision) collision.blocked = true;
            }
          }
        }

        if (velocity.vy !== 0) {
          const tgy = gridY + Math.sign(velocity.vy);
          if (this.isCellBlocked(gameMap, gridX, tgy, canPass)) {
            const targetCellY = tgy * BLOCK_HEIGHT;
            if (Math.abs(transform.y + velocity.vy - targetCellY) < BLOCK_HEIGHT) {
              velocity.vy = 0;
              transform.y = gridY * BLOCK_HEIGHT;
              gridPlacement.gridY = gridY;
              if (collision) collision.blocked = true;
            }
          }
        }
      }

      // Apply velocity + grid-align correction
      const movingX = velocity.vx !== 0;
      const movingY = velocity.vy !== 0;
      if (movingX || movingY) {
        const dx = velocity.vx * dt;
        const dy = velocity.vy * dt;

        const gridX    = Math.round(transform.x / BLOCK_WIDTH);
        const gridY    = Math.round(transform.y / BLOCK_HEIGHT);
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

  isCellBlocked(gameMap, gx, gy, canPass = 0) {
    if (gx < 0 || gx >= MAP_WIDTH || gy < 0 || gy >= MAP_HEIGHT) return true;
    const cell = gameMap[gy]?.[gx];
    if (cell & TYPE.HARD_BLOCK)                              return true;
    if (cell & TYPE.SOFT_BLOCK && !(canPass & TYPE.SOFT_BLOCK)) return true;
    if (cell & TYPE.BOMB       && !(canPass & TYPE.BOMB))       return true;
    return false;
  }
}
