import { GAME_STATE_ENTITY } from '../components';
import { EVENT } from '../ecs/events.js';
import { getEvent } from '../ecs/eventHelpers.js';

export class CollectibleSystem {
  constructor() {
    this.name = 'collectible';
  }

  apply(engine) {
    if (getEvent(engine, 'powerup', EVENT.PICKED_UP)) {
      engine.removeEntity('powerup');
    }
  }
}
