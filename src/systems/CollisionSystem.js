import { TYPE, STATE } from '../ecs/config.js';
import { GAME_STATE, GRID_PLACEMENT, HEALTH } from '../components';
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
      const health = engine.getComponent(id, HEALTH);
      if (!health || health.isDying) continue;
      const gp = engine.getComponent(id, GRID_PLACEMENT);
      if (!gp) continue;

      if (gameMap[gp.gridY]?.[gp.gridX] & TYPE.EXPLOSION) {
        emitEvent(engine, id, { type: EVENT.DAMAGE_FIRE });
      }

      enemyCells.push({ gridX: gp.gridX, gridY: gp.gridY });
    }

    for (const id of gameState.players) {
      const health = engine.getComponent(id, HEALTH);
      if (!health || health.isDying) continue;

      const gp = engine.getComponent(id, GRID_PLACEMENT);
      if (!gp || !gameMap) continue;

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
