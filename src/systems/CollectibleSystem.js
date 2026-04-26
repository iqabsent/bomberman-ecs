import { GAME_STATE, GAME_STATE_ENTITY } from '../components';
import { EVENT } from '../ecs/events.js';
import { getEvent } from '../ecs/eventHelpers.js';

export class CollectibleSystem {
  constructor() {
    this.name = 'collectible';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    if (gameState.powerup && getEvent(engine, gameState.powerup, EVENT.PICKED_UP)) {
      engine.removeEntity(gameState.powerup);
      gameState.powerup = null;
    }

    if (getEvent(engine, GAME_STATE_ENTITY, EVENT.POWERUP_DESTROYED)) {
      gameState.powerup = null;
    }
  }
}
