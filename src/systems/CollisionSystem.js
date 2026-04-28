import { TYPE, STATE } from '../ecs/config.js';
import { GAME_STATE, GRID_PLACEMENT, DESTROYABLE } from '../components';
import { EVENT } from '../ecs/events.js';
import { emitEvent, clearEventsByType } from '../ecs/eventHelpers.js';

export class CollisionSystem {
  constructor() {
    this.name = 'collision';
  }

  apply(engine, _dt) {
    clearEventsByType(engine, EVENT.DAMAGE_ENEMY);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState || gameState.currentState !== STATE.PLAYING) return;

    const { gameMap } = gameState;

    const enemyCells = [];
    for (const id of gameState.enemies) {
      const destroyable = engine.getComponent(id, DESTROYABLE);
      if (!destroyable || destroyable.destroyState !== null) continue;
      const gp = engine.getComponent(id, GRID_PLACEMENT);
      if (!gp) continue;

      if (gameMap[gp.gridY]?.[gp.gridX] & TYPE.EXPLOSION) {
        emitEvent(engine, id, { type: EVENT.DAMAGE_EXPLOSION });
      }

      enemyCells.push({ gridX: gp.gridX, gridY: gp.gridY });
    }

    if (gameState.door) {
      const destroyable = engine.getComponent(gameState.door, DESTROYABLE);
      const gp          = engine.getComponent(gameState.door, GRID_PLACEMENT);
      if (destroyable && destroyable.destroyState === null && gp) {
        const cell = gameMap[gp.gridY]?.[gp.gridX];
        if ((cell & TYPE.DOOR) && (cell & TYPE.EXPLOSION)) {
          emitEvent(engine, gameState.door, { type: EVENT.DAMAGE_EXPLOSION });
        }
      }
    }

    if (gameState.powerup) {
      const destroyable = engine.getComponent(gameState.powerup, DESTROYABLE);
      const gp          = engine.getComponent(gameState.powerup, GRID_PLACEMENT);
      if (destroyable && destroyable.destroyState === null && gp) {
        const cell = gameMap[gp.gridY]?.[gp.gridX];
        if ((cell & TYPE.POWER) && (cell & TYPE.EXPLOSION)) {
          emitEvent(engine, gameState.powerup, { type: EVENT.DAMAGE_EXPLOSION });
        }
      }
    }

    const id = gameState.player;
    if (id) {
      const destroyable = engine.getComponent(id, DESTROYABLE);
      if (destroyable && destroyable.destroyState === null) {
        const gp = engine.getComponent(id, GRID_PLACEMENT);
        if (gp && gameMap) {
          const cell = gameMap[gp.gridY]?.[gp.gridX];
          if (cell & TYPE.EXPLOSION) {
            emitEvent(engine, id, { type: EVENT.DAMAGE_EXPLOSION });
          }
          for (const ec of enemyCells) {
            if (ec.gridX === gp.gridX && ec.gridY === gp.gridY) {
              emitEvent(engine, id, { type: EVENT.DAMAGE_ENEMY });
              break;
            }
          }
        }
      }
    }
  }
}
