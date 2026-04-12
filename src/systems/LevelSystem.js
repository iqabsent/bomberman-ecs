import { STATE, SPAWN, LEVEL, DEFAULT_LIVES, LEVEL_TIME } from '../ecs/config.js';
import { GAME_STATE, PLAYER, HEALTH } from '../components';

export class LevelSystem {
  constructor() {
    this.name = 'level';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    if (gameState.currentState === STATE.LOADING) {
      if (gameState.levelLoading) {
        gameState.levelLoading = false;

        // Remove all old entities before MapSystem/EnemySystem spawn new ones
        LevelSystem.removeAllLevelEntities(gameState, engine);
        const spawnType = gameState.previousState === STATE.TITLE ? SPAWN.GAME_SPAWN : SPAWN.LEVEL_SPAWN;
        for (const id of engine.entities) {
          const player = engine.getComponent(id, PLAYER);
          if (player) player.pendingSpawn = spawnType;
        }

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
      // Flag dying players for respawn — arriving from PLAYER_DIED with health.isDying still set
      for (const id of engine.entities) {
        const player = engine.getComponent(id, PLAYER);
        if (!player) continue;
        const health = engine.getComponent(id, HEALTH);
        if (health && health.isDying) player.pendingSpawn = SPAWN.RESPAWN;
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

}
