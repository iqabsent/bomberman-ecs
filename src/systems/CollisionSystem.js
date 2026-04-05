import { BLOCK_WIDTH, BLOCK_HEIGHT, MAP_WIDTH, MAP_HEIGHT, TYPE, STATE } from '../ecs/config.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { CollectibleComponent } from '../components/CollectibleComponent.js';
import { GameStateComponent } from '../components/GameStateComponent.js';

export class CollisionSystem {
  constructor() {
    this.name = 'collision';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState || !gameState.gameMap) return;

    const { gameMap } = gameState;

    for (const [id] of engine.entities.entries()) {
      const collision = engine.getComponent(id, CollisionComponent);
      if (!collision) continue;

      const transform = engine.getComponent(id, TransformComponent);
      const velocity  = engine.getComponent(id, VelocityComponent);
      const health    = engine.getComponent(id, HealthComponent);
      if (!transform || !velocity) continue;
      if (health && health.isDying) continue;

      const dirX = Math.sign(velocity.vx);
      const dirY = Math.sign(velocity.vy);

      if (dirX !== 0 || dirY !== 0) {
        const gridX = Math.round(transform.x / BLOCK_WIDTH);
        const gridY = Math.round(transform.y / BLOCK_HEIGHT);

        const player = engine.getComponent(id, PlayerComponent);

        if (dirX !== 0) {
          const tgx = gridX + dirX;
          if (this.isCellBlocked(gameMap, tgx, gridY, player)) {
            const targetCellX = tgx * BLOCK_WIDTH;
            if (Math.abs(transform.x + velocity.vx - targetCellX) < BLOCK_WIDTH) {
              velocity.vx = 0;
              transform.x = gridX * BLOCK_WIDTH;
              transform.gridX = gridX;
            }
          }
        }

        if (dirY !== 0) {
          const tgy = gridY + dirY;
          if (this.isCellBlocked(gameMap, gridX, tgy, player)) {
            const targetCellY = tgy * BLOCK_HEIGHT;
            if (Math.abs(transform.y + velocity.vy - targetCellY) < BLOCK_HEIGHT) {
              velocity.vy = 0;
              transform.y = gridY * BLOCK_HEIGHT;
              transform.gridY = gridY;
            }
          }
        }
      }

      const gridX = Math.round(transform.x / BLOCK_WIDTH);
      const gridY = Math.round(transform.y / BLOCK_HEIGHT);
      const cell  = gameMap[gridY] && gameMap[gridY][gridX];

      // Mark overlapping collectible for pickup — CollectibleSystem handles the rest
      if (cell & TYPE.POWER) {
        const entityId = gameState.powerups.find(pid => {
          const t = engine.getComponent(pid, TransformComponent);
          return t && t.gridX === gridX && t.gridY === gridY;
        });
        if (entityId) {
          const collectible = engine.getComponent(entityId, CollectibleComponent);
          if (collectible && !collectible.pickedUpBy) {
            collectible.pickedUpBy = id;
            gameState.gameMap[gridY][gridX] &= ~TYPE.POWER;
          }
        }
      }

      if (cell & TYPE.DOOR && !gameState.enemies.length && gameState.currentState === STATE.PLAYING) {
        gameState.toLevelClearState();
      }
    }
  }

  isCellBlocked(gameMap, gx, gy, player = null) {
    if (gx < 0 || gx >= MAP_WIDTH || gy < 0 || gy >= MAP_HEIGHT) return true;
    const cell = gameMap[gy] && gameMap[gy][gx];
    if (cell & TYPE.HARD_BLOCK) return true;
    if (cell & TYPE.SOFT_BLOCK && !(player && player.canPassWall)) return true;
    if (cell & TYPE.BOMB       && !(player && player.canPassBomb)) return true;
    return false;
  }
}
