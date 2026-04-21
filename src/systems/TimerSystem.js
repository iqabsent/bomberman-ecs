import { STATE } from '../ecs/config.js';
import { GAME_STATE } from '../components';

export class TimerSystem {
  constructor() {
    this.name = 'timer';
  }

  apply(engine, dt) {

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;
    if (gameState.currentState !== STATE.PLAYING) return;

    gameState.gameTime = Math.max(0, gameState.gameTime - dt * (1000 / 60));
    if (gameState.gameTime === 0 && !gameState.timeUp) {
      gameState.timeUp = true;
      // TODO(events): create TimerExpiredEvent event entity instead; timeUp guard becomes redundant once events are one-shot (event-entity pattern)
      gameState.pendingEnemySpawnTimer = true;
    }
  }
}
