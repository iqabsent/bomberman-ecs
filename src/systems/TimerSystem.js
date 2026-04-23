import { STATE } from '../ecs/config.js';
import { GAME_STATE, GAME_STATE_ENTITY } from '../components';
import { EVENT } from '../ecs/events.js';
import { emitEvent, clearEventsByType } from '../ecs/eventHelpers.js';

export class TimerSystem {
  constructor() {
    this.name = 'timer';
  }

  apply(engine, dt) {
    clearEventsByType(engine, EVENT.TIMER_EXPIRED);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;
    if (gameState.currentState !== STATE.PLAYING) return;

    gameState.gameTime = Math.max(0, gameState.gameTime - dt * (1000 / 60));
    if (gameState.gameTime === 0 && !gameState.timeUp) {
      gameState.timeUp = true;
      emitEvent(engine, GAME_STATE_ENTITY, { type: EVENT.TIMER_EXPIRED });
    }
  }
}
