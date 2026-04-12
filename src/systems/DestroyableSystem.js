import { LEVEL } from '../ecs/config.js';
import { GAME_STATE, ANIMATION, DESTROYABLE, GRID_PLACEMENT } from '../components';

export class DestroyableSystem {
  constructor() {
    this.name = 'destroyable';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    // Soft blocks
    for (let i = gameState.softBlocks.length - 1; i >= 0; i--) {
      const id          = gameState.softBlocks[i];
      const destroyable   = engine.getComponent(id, DESTROYABLE);
      const anim          = engine.getComponent(id, ANIMATION);
      if (!destroyable || !destroyable.burning || !anim) continue;

      const gridPlacement = engine.getComponent(id, GRID_PLACEMENT);

      // Queue reveal and start burn animation on the first tick burning is detected
      if (!destroyable.revealQueued && gridPlacement) {
        destroyable.revealQueued = true;
        gameState.pendingMapReveals.push({ gridX: gridPlacement.gridX, gridY: gridPlacement.gridY });
        anim.loop = false;
        anim.shouldAnimate = true;
      }

      // Remove entity once animation completes
      if (!anim.shouldAnimate) {
        gameState.softBlocks.splice(i, 1);
        engine.removeEntity(id);
      }
    }

    // Door — burning queues an enemy spawn for EnemySystem to handle once flames clear
    if (gameState.door && !gameState.doorTriggered) {
      const destroyable = engine.getComponent(gameState.door, DESTROYABLE);
      if (destroyable && destroyable.burning) {
        destroyable.burning = false;
        const gridPlacement = engine.getComponent(gameState.door, GRID_PLACEMENT);
        const nextLevelData = LEVEL[(gameState.currentLevel + 1) % LEVEL.length];
        const enemyType     = Object.keys(nextLevelData.enemies).slice(-1)[0];
        gameState.pendingEnemySpawnDoor = { gridX: gridPlacement.gridX, gridY: gridPlacement.gridY, enemyType };
        gameState.doorTriggered = true;
      }
    }
  }
}
