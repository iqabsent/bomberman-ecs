import { STATE } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';

export class TimerSystem {
  constructor() {
    this.name = 'timer';
    this.lastTime = null;
  }

  apply(engine, time) {
    if (!this.lastTime) this.lastTime = time;
    const rawDt = (time - this.lastTime) / (1000 / 60);
    const dt = Math.min(rawDt, 3);
    this.lastTime = time;

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
