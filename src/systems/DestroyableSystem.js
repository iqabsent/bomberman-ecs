import { DESTROY, TYPE } from '../ecs/config.js';
import { GAME_STATE, ANIMATION, DESTROYABLE, GRID_PLACEMENT } from '../components';
import { EVENT } from '../ecs/events.js';
import { getEvent } from '../ecs/eventHelpers.js';

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
      if (getEvent(engine, id, EVENT.ANIMATION_COMPLETED)) destroyable.destroyState = DESTROY.DESTROYED;
    }

    // Soft blocks
    for (let i = gameState.softBlocks.length - 1; i >= 0; i--) {
      const id          = gameState.softBlocks[i];
      const destroyable = engine.getComponent(id, DESTROYABLE);
      if (!destroyable) continue;

      if (destroyable.destroyState === DESTROY.PENDING) {
        destroyable.destroyState = DESTROY.DESTROYING;
        const gridPlacement = engine.getComponent(id, GRID_PLACEMENT);
        // TODO(events): create SoftBlockDestroyed event entity with { gridX, gridY } payload instead (event-entity pattern)
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
        // TODO(events): create PowerUpDestroyedEvent event entity with { gridX, gridY } payload — consider unifying with DoorDestroyedEvent into EnemySpawnQueued (event-entity pattern)
        gameState.pendingEnemySpawnPowerUp = { gridX: gp.gridX, gridY: gp.gridY };
      }
      gameState.powerups.splice(i, 1);
      engine.removeEntity(id);
    }

    // Door — destruction queues an enemy spawn for EnemySystem to handle once flames clear
    // TODO(events): query for absence of DoorTriggeredEvent entity — its existence acts as the idempotency guard (event-entity pattern)
    if (gameState.door && !gameState.doorTriggered) {
      const destroyable = engine.getComponent(gameState.door, DESTROYABLE);
      if (destroyable && destroyable.destroyState === DESTROY.PENDING) {
        destroyable.destroyState = DESTROY.DESTROYING;
        const gridPlacement = engine.getComponent(gameState.door, GRID_PLACEMENT);
        // TODO(events): create DoorDestroyedEvent event entity with { gridX, gridY } payload; its existence replaces doorTriggered (event-entity pattern)
        gameState.pendingEnemySpawnDoor = { gridX: gridPlacement.gridX, gridY: gridPlacement.gridY };
        gameState.doorTriggered = true;
      }
    }
  }
}
