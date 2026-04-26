import { DESTROY } from '../ecs/config.js';
import { GAME_STATE, GAME_STATE_ENTITY, ANIMATION, DESTROYABLE, GRID_PLACEMENT } from '../components';
import { EVENT } from '../ecs/events.js';
import { emitEvent, getEvent, clearEventsByType } from '../ecs/eventHelpers.js';

export class DestroyableSystem {
  constructor() {
    this.name = 'destroyable';
  }

  apply(engine) {
    clearEventsByType(engine, EVENT.SOFT_BLOCK_DESTROYED);
    clearEventsByType(engine, EVENT.DOOR_DESTROYED);
    clearEventsByType(engine, EVENT.POWERUP_DESTROYED);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    for (const id of engine.entities) {
      const destroyable = engine.getComponent(id, DESTROYABLE);
      if (!destroyable) continue;

      // All destroyable entities: advance DESTROYING → DESTROYED when animation completes
      if (destroyable.destroyState === DESTROY.DESTROYING && getEvent(engine, id, EVENT.ANIMATION_COMPLETED)) {
        destroyable.destroyState = DESTROY.DESTROYED;
      }

      // Entities without component-driven behaviour (enemies, player) handle their own lifecycle
      if (!destroyable.onTriggerEvent && !destroyable.onDestroyedEvent) continue;

      if (destroyable.destroyState === null && getEvent(engine, id, EVENT.DESTROY_TRIGGERED)) {
        destroyable.destroyState = DESTROY.DESTROYING;
        const gp = engine.getComponent(id, GRID_PLACEMENT);
        if (gp) {
          if (destroyable.mapType) gameState.gameMap[gp.gridY][gp.gridX] &= ~destroyable.mapType;
          const anim = engine.getComponent(id, ANIMATION);
          if (anim) { anim.loop = false; anim.shouldAnimate = true; }
          else setFlameOnComplete(engine, gameState, gp.gridX, gp.gridY, id);
          if (destroyable.onTriggerEvent) {
            emitEvent(engine, id, { type: destroyable.onTriggerEvent, payload: { gridX: gp.gridX, gridY: gp.gridY } });
          }
        }
      }

      if (destroyable.destroyState === DESTROY.DESTROYED) {
        const gp = engine.getComponent(id, GRID_PLACEMENT);
        if (destroyable.onDestroyedEvent && gp) {
          emitEvent(engine, GAME_STATE_ENTITY, { type: destroyable.onDestroyedEvent, payload: { gridX: gp.gridX, gridY: gp.gridY } });
        }
        if (destroyable.shouldPersist) {
          engine.removeComponent(id, DESTROYABLE);
        } else {
          engine.removeEntity(id);
        }
      }
    }
  }
}

function setFlameOnComplete(engine, gameState, gridX, gridY, targetId) {
  const flameId = gameState.flames.find(fid => {
    const fp = engine.getComponent(fid, GRID_PLACEMENT);
    return fp && fp.gridX === gridX && fp.gridY === gridY;
  });
  if (!flameId) return;
  const anim = engine.getComponent(flameId, ANIMATION);
  if (anim) anim.onCompleteEvent = { targetId, type: EVENT.ANIMATION_COMPLETED };
}
