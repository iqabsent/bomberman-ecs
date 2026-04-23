import { GAME_STATE } from '../components';
import { EVENT } from '../ecs/events.js';
import { getEvent } from '../ecs/eventHelpers.js';

export class CollectibleSystem {
  constructor() {
    this.name = 'collectible';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    for (let i = gameState.powerups.length - 1; i >= 0; i--) {
      const entityId = gameState.powerups[i];
      if (!getEvent(engine, entityId, EVENT.PICKED_UP)) continue;
      gameState.powerups.splice(i, 1);
      engine.removeEntity(entityId);
    }
  }
}
