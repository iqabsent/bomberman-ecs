import { TYPE, STATE, DAMAGE_TYPE } from '../ecs/config.js';
import { GAME_STATE, GRID_PLACEMENT, HEALTH } from '../components';

export class CollisionSystem {
  constructor() {
    this.name = 'collision';
  }

  apply(engine, _dt) {
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
        // TODO(events): add DamageEvent component (FIRE) to this enemy entity instead (component-on-entity pattern)
        health.pendingDamage.push(DAMAGE_TYPE.FIRE);
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
        // TODO(events): add DamageEvent component (FIRE) to this player entity instead (component-on-entity pattern)
        health.pendingDamage.push(DAMAGE_TYPE.FIRE);
      }

      for (const ec of enemyCells) {
        if (ec.gridX === gp.gridX && ec.gridY === gp.gridY) {
          // TODO(events): add DamageEvent component (ENEMY) to this player entity instead (component-on-entity pattern)
          health.pendingDamage.push(DAMAGE_TYPE.ENEMY);
          break;
        }
      }
    }
  }
}
