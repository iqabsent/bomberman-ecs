import { TYPE } from '../ecs/config.js';
import { GAME_STATE, FLAME, GRID_PLACEMENT } from '../components';
import { EVENT } from '../ecs/events.js';
import { getEvent } from '../ecs/eventHelpers.js';

export class ExplosionSystem {
  constructor() {
    this.name = 'explosion';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    const expired = [];
    for (const flameId of engine.query(FLAME)) {
      if (getEvent(engine, flameId, EVENT.ANIMATION_COMPLETED)) expired.push(flameId);
    }

    for (const flameId of expired) {
      const flamePlacement = engine.getComponent(flameId, GRID_PLACEMENT);
      engine.removeEntity(flameId);

      if (!flamePlacement) continue;

      // Only clear EXPLOSION flag if no other flame still covers this cell
      let stillBurning = false;
      for (const id of engine.query(FLAME)) {
        const gp = engine.getComponent(id, GRID_PLACEMENT);
        if (gp && gp.gridX === flamePlacement.gridX && gp.gridY === flamePlacement.gridY) {
          stillBurning = true;
          break;
        }
      }
      if (!stillBurning && gameState.gameMap[flamePlacement.gridY]) {
        gameState.gameMap[flamePlacement.gridY][flamePlacement.gridX] &= ~TYPE.EXPLOSION;
      }
    }
  }
}
