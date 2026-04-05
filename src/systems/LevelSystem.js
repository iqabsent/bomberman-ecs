import { STATE, BLOCK_WIDTH, BLOCK_HEIGHT, LEVEL, DEFAULT_LIVES, LEVEL_TIME } from '../ecs/config.js';
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
        LevelSystem.resetPlayer(engine, gameState.previousState === STATE.TITLE);

        // Reset game state based on where we came from
        if (gameState.previousState === STATE.LEVEL_CLEAR) {
          if (gameState.currentLevel >= LEVEL.length - 1) {
            gameState.toGameWonState();
            return;
          }
          gameState.currentLevel++;
          gameState.lives++;
          LevelSystem.resetLevelState(gameState);
        } else if (gameState.previousState === STATE.TITLE) {
          gameState.currentLevel = 0;
          gameState.lives = DEFAULT_LIVES;
          gameState.score = 0;
          LevelSystem.resetLevelState(gameState);
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
        anim.animationKey = 'MAN_DOWN';
        anim.loop = true;
        anim.shouldAnimate = false;
      }
      return;
    }
  }

  static resetLevelState(gameState) {
    gameState.gameTime = LEVEL_TIME;
    gameState.timeUp = false;
    gameState.powerSpawned = false;
    gameState.doorSpawned = false;
    gameState.doorTriggered = false;
    gameState.door = null;
    gameState.gameMap = null;
    gameState.powerups = [];
    gameState.bombs = [];
    gameState.flames = [];
    gameState.enemies = [];
    gameState.dyingEnemies = [];
    gameState.softBlocks = [];
    gameState.pendingMapReveals = [];
    gameState.pendingEnemySpawnDoor  = null;
    gameState.pendingEnemySpawnTimer = false;
    gameState.levelPowerCollected    = false;
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

  // TODO: player reset logic should belong to PlayerSystem, not LevelSystem
  static resetPlayer(engine, resetPowerups = false) {
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
        player.needsReset = true;
      } else {
        player.activeBombs = 0;
      }
      if (health) { health.isDying = false; health.deathAnimStarted = false; }
      anim.animationKey = 'MAN_DOWN';
      anim.shouldAnimate = false;
    }
  }
}
