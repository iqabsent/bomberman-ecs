import { STATE, BLOCK_WIDTH, BLOCK_HEIGHT, LEVEL } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';

export class LevelSystem {
  constructor() {
    this.name = 'level';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return;

    if (gameState.currentState === STATE.LOADING) {
      if (gameState.levelLoading) {
        gameState.levelLoading = false;

        // Remove all old entities before MapSystem/EnemySystem spawn new ones
        LevelSystem.removeAllLevelEntities(gameState, engine);
        LevelSystem.resetPlayer(engine, gameState, gameState.previousState === STATE.TITLE);

        // Reset game state based on where we came from
        if (gameState.previousState === STATE.LEVEL_CLEAR) {
          if (gameState.currentLevel >= LEVEL.length - 1) {
            gameState.toGameWonState();
            return;
          }
          gameState.nextLevel();
          gameState.lives++;
        } else if (gameState.previousState === STATE.TITLE) {
          gameState.newGame();
        }
      }

      if (!gameState.mapLoading && !gameState.enemyLoading) {
        gameState.toLevelStartState();
      }
      return;
    }

    if (gameState.currentState === STATE.LEVEL_START) {
      // Respawn player if arriving from PLAYER_DIED (health.isDying still set)
      for (const [id] of engine.entities.entries()) {
        const player = engine.getComponent(id, PlayerComponent);
        if (!player) continue;

        const health    = engine.getComponent(id, HealthComponent);
        const transform = engine.getComponent(id, TransformComponent);
        const velocity  = engine.getComponent(id, VelocityComponent);
        const anim      = engine.getComponent(id, AnimationComponent);
        if (!health || !health.isDying) continue;
        if (!transform || !velocity || !anim) continue;

        transform.x = BLOCK_WIDTH;
        transform.y = BLOCK_HEIGHT;
        transform.gridX = 1;
        transform.gridY = 1;
        velocity.vx = 0;
        velocity.vy = 0;
        player.activeBombs = 0;
        health.isDying = false;
        health.deathAnimStarted = false;
        anim.setAnimation('MAN_DOWN');
        anim.shouldAnimate = false;
      }
      return;
    }
  }

  static removeAllLevelEntities(gameState, engine) {
    for (const id of gameState.enemies)      engine.removeEntity(id);
    for (const id of gameState.dyingEnemies) engine.removeEntity(id);
    for (const id of gameState.bombs)        engine.removeEntity(id);
    for (const id of gameState.powerups)     engine.removeEntity(id);
    for (const id of gameState.softBlocks)   engine.removeEntity(id);
    for (const id of gameState.flames)       engine.removeEntity(id);
    if (gameState.door) engine.removeEntity(gameState.door);
  }

  static resetPlayer(engine, gameState, resetPowerups = false) {
    for (const [id] of engine.entities.entries()) {
      const player = engine.getComponent(id, PlayerComponent);
      if (!player) continue;

      const transform = engine.getComponent(id, TransformComponent);
      const velocity  = engine.getComponent(id, VelocityComponent);
      const anim      = engine.getComponent(id, AnimationComponent);
      const health    = engine.getComponent(id, HealthComponent);
      if (!transform || !velocity || !anim) continue;

      transform.x = BLOCK_WIDTH;
      transform.y = BLOCK_HEIGHT;
      transform.gridX = 1;
      transform.gridY = 1;
      velocity.vx = 0;
      velocity.vy = 0;
      if (resetPowerups) {
        player.reset();
      } else {
        player.activeBombs = 0;
      }
      if (health) { health.isDying = false; health.deathAnimStarted = false; }
      anim.setAnimation('MAN_DOWN');
      anim.shouldAnimate = false;
    }
  }
}
