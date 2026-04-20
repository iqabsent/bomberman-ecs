import { DESTROY, TYPE } from '../ecs/config.js';
import { GAME_STATE, ANIMATION, DESTROYABLE, GRID_PLACEMENT } from '../components';

export class DestroyableSystem {
  constructor() {
    this.name = 'destroyable';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    // Advance any DESTROYING entity to DESTROYED once its animation completes
    for (const id of engine.entities) {
      const destroyable = engine.getComponent(id, DESTROYABLE);
      if (!destroyable || destroyable.destroyState !== DESTROY.DESTROYING) continue;
      const anim = engine.getComponent(id, ANIMATION);
      if (anim && anim.completed) destroyable.destroyState = DESTROY.DESTROYED;
    }

    // Soft blocks
    for (let i = gameState.softBlocks.length - 1; i >= 0; i--) {
      const id          = gameState.softBlocks[i];
      const destroyable = engine.getComponent(id, DESTROYABLE);
      if (!destroyable) continue;

      if (destroyable.destroyState === DESTROY.PENDING) {
        destroyable.destroyState = DESTROY.DESTROYING;
        const gridPlacement = engine.getComponent(id, GRID_PLACEMENT);
        if (gridPlacement) gameState.pendingMapReveals.push({ gridX: gridPlacement.gridX, gridY: gridPlacement.gridY });
        const anim = engine.getComponent(id, ANIMATION);
        if (anim) { anim.loop = false; anim.shouldAnimate = true; }
      }

      if (destroyable.destroyState === DESTROY.DESTROYED) {
        gameState.softBlocks.splice(i, 1);
        engine.removeEntity(id);
      }
    }

    // Power-ups — instant removal, queues PONTAN spawn
    for (let i = gameState.powerups.length - 1; i >= 0; i--) {
      const id          = gameState.powerups[i];
      const destroyable = engine.getComponent(id, DESTROYABLE);
      if (!destroyable || destroyable.destroyState !== DESTROY.PENDING) continue;

      const gp = engine.getComponent(id, GRID_PLACEMENT);
      if (gp) {
        gameState.gameMap[gp.gridY][gp.gridX] &= ~TYPE.POWER;
        gameState.pendingEnemySpawnPowerUp = { gridX: gp.gridX, gridY: gp.gridY };
      }
      gameState.powerups.splice(i, 1);
      engine.removeEntity(id);
    }

    // Door — destruction queues an enemy spawn for EnemySystem to handle once flames clear
    if (gameState.door && !gameState.doorTriggered) {
      const destroyable = engine.getComponent(gameState.door, DESTROYABLE);
      if (destroyable && destroyable.destroyState === DESTROY.PENDING) {
        destroyable.destroyState = DESTROY.DESTROYING;
        const gridPlacement = engine.getComponent(gameState.door, GRID_PLACEMENT);
        gameState.pendingEnemySpawnDoor = { gridX: gridPlacement.gridX, gridY: gridPlacement.gridY };
        gameState.doorTriggered = true;
      }
    }
  }
}
