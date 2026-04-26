import { TYPE, STATE } from '../ecs/config.js';
import { GAME_STATE, GRID_PLACEMENT, DESTROYABLE } from '../components';
import { EVENT } from '../ecs/events.js';
import { emitEvent, clearEventsByType } from '../ecs/eventHelpers.js';

export class CollisionSystem {
  constructor() {
    this.name = 'collision';
  }

  apply(engine, _dt) {
    clearEventsByType(engine, EVENT.DAMAGE_FIRE);
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
        emitEvent(engine, id, { type: EVENT.DESTROY_TRIGGERED });
      }

      enemyCells.push({ gridX: gp.gridX, gridY: gp.gridY });
    }

    const id = gameState.player;
    if (id) {
      const destroyable = engine.getComponent(id, DESTROYABLE);
      if (destroyable && destroyable.destroyState === null) {
        const gp = engine.getComponent(id, GRID_PLACEMENT);
        if (gp && gameMap) {
          const cell = gameMap[gp.gridY]?.[gp.gridX];
          if (cell & TYPE.EXPLOSION) {
            emitEvent(engine, id, { type: EVENT.DAMAGE_FIRE });
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
