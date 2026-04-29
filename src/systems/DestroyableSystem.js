import { DESTROY } from '../ecs/config.js';
import { GAME_STATE, GAME_STATE_ENTITY, ANIMATION, DESTROYABLE, FLAME, GRID_PLACEMENT } from '../components';
import { EVENT } from '../ecs/events.js';
import { emitEvent, getEvent, clearEventsByType } from '../ecs/eventHelpers.js';

export class DestroyableSystem {
  constructor() {
    this.name = 'destroyable';
  }

  apply(engine) {
    clearEventsByType(engine, EVENT.DOOR_DESTROYED);
    clearEventsByType(engine, EVENT.POWERUP_DESTROYED);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    for (const id of engine.entities) {
      const destroyable = engine.getComponent(id, DESTROYABLE);
      if (!destroyable) continue;

      // All destroyables: advance DESTROYING → DESTROYED when own animation completes
      if (destroyable.destroyState === DESTROY.DESTROYING && getEvent(engine, id, EVENT.ANIMATION_COMPLETED)) {
        destroyable.destroyState = DESTROY.DESTROYED;
      }

      // Self-managed destroyables (enemy, player, bomb, flame) handle their own lifecycle
      if (!destroyable.managed) continue;

      if (destroyable.destroyState === null && getEvent(engine, id, EVENT.DESTROY_TRIGGERED)) {
        destroyable.destroyState = DESTROY.DESTROYING;
        const gp = engine.getComponent(id, GRID_PLACEMENT);
        if (gp) {
          if (destroyable.mapType) gameState.gameMap[gp.gridY][gp.gridX] &= ~destroyable.mapType;
          const anim = engine.getComponent(id, ANIMATION);
          if (anim) { anim.loop = false; anim.shouldAnimate = true; }
        }
      }

      // Managed destroyables without animation wait for all flames at their cell to leave
      if (destroyable.destroyState === DESTROY.DESTROYING && !engine.getComponent(id, ANIMATION)) {
        const gp = engine.getComponent(id, GRID_PLACEMENT);
        if (gp && !flameAt(engine, gp.gridX, gp.gridY)) {
          destroyable.destroyState = DESTROY.DESTROYED;
        }
      }

      if (destroyable.destroyState === DESTROY.DESTROYED) {
        const gp = engine.getComponent(id, GRID_PLACEMENT);
        if (gp) {
          if (id === 'door')    emitEvent(engine, GAME_STATE_ENTITY, { type: EVENT.DOOR_DESTROYED,    payload: { gridX: gp.gridX, gridY: gp.gridY } });
          if (id === 'powerup') emitEvent(engine, GAME_STATE_ENTITY, { type: EVENT.POWERUP_DESTROYED, payload: { gridX: gp.gridX, gridY: gp.gridY } });
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

function flameAt(engine, gridX, gridY) {
  for (const fid of engine.query(FLAME)) {
    const gp = engine.getComponent(fid, GRID_PLACEMENT);
    if (gp && gp.gridX === gridX && gp.gridY === gridY) return true;
  }
  return false;
}
