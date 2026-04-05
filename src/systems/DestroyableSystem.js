import { LEVEL } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { TransformComponent } from '../components/TransformComponent.js';

export class DestroyableSystem {
  constructor() {
    this.name = 'destroyable';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return;

    // Soft blocks
    for (let i = gameState.softBlocks.length - 1; i >= 0; i--) {
      const id          = gameState.softBlocks[i];
      const destroyable = engine.getComponent(id, DestroyableComponent);
      const anim        = engine.getComponent(id, AnimationComponent);
      if (!destroyable || !destroyable.burning || !anim) continue;

      const transform = engine.getComponent(id, TransformComponent);

      // Queue reveal immediately when burn starts (first tick burning is detected)
      if (!destroyable.revealQueued && transform) {
        destroyable.revealQueued = true;
        gameState.pendingMapReveals.push({ gridX: transform.gridX, gridY: transform.gridY });
      }

      // Remove entity once animation completes
      if (!anim.shouldAnimate) {
        gameState.softBlocks.splice(i, 1);
        engine.removeEntity(id);
      }
    }

    // Door — burning queues an enemy spawn for EnemySystem to handle once flames clear
    if (gameState.door && !gameState.doorTriggered) {
      const destroyable = engine.getComponent(gameState.door, DestroyableComponent);
      if (destroyable && destroyable.burning) {
        destroyable.burning = false;
        const transform     = engine.getComponent(gameState.door, TransformComponent);
        const nextLevelData = LEVEL[(gameState.currentLevel + 1) % LEVEL.length];
        const enemyType     = Object.keys(nextLevelData.enemies).slice(-1)[0];
        gameState.pendingEnemySpawnDoor = { gridX: transform.gridX, gridY: transform.gridY, enemyType };
        gameState.doorTriggered = true;
      }
    }
  }
}
