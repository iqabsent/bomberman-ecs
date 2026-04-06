import { STATE } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';

export class TimerSystem {
  constructor() {
    this.name = 'timer';
  }

  apply(engine, dt) {

    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return;
    if (gameState.currentState !== STATE.PLAYING) return;

    gameState.gameTime = Math.max(0, gameState.gameTime - dt * (1000 / 60));
    if (gameState.gameTime === 0 && !gameState.timeUp) {
      gameState.timeUp = true;
      gameState.pendingEnemySpawnTimer = true;
    }
  }
}
