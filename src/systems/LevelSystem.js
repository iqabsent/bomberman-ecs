import { STATE, SPAWN, LEVEL, DEFAULT_LIVES, LEVEL_TIME } from '../ecs/config.js';
import { GAME_STATE } from '../components';
import { EVENT } from '../ecs/events.js';
import { emitEvent, clearEventsByType } from '../ecs/eventHelpers.js';

export class LevelSystem {
  constructor() {
    this.name = 'level';
  }

  apply(engine) {
    clearEventsByType(engine, EVENT.SPAWN_INTENT);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    if (gameState.currentState === STATE.LOADING) {
      if (gameState.levelLoading) {
        gameState.levelLoading = false;

        // Remove all old entities before MapSystem/EnemySystem spawn new ones
        LevelSystem.removeAllLevelEntities(gameState, engine);
        const spawnType = gameState.previousState === STATE.TITLE ? SPAWN.GAME_SPAWN : SPAWN.LEVEL_SPAWN;
        emitEvent(engine, gameState.player, { type: EVENT.SPAWN_INTENT, payload: spawnType });

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

      // TODO(events): query for two SystemReadyEvent entities (one from MapSystem, one from EnemySystem) instead (event-entity pattern)
      if (!gameState.mapLoading && !gameState.enemyLoading) {
        gameState.toLevelStartState();
      }
      return;
    }
  }

  static resetLevelState(gameState) {
    gameState.gameTime = LEVEL_TIME;
    gameState.timeUp = false;
    gameState.powerSpawned = false;
    gameState.doorSpawned = false;
    gameState.door = null;
    gameState.gameMap = null;
    gameState.powerup = null;
    gameState.bombs = [];
    gameState.flames = [];
    gameState.enemies = [];
    gameState.softBlocks = [];
    gameState.levelPowerCollected    = false;
  }

  static removeAllLevelEntities(gameState, engine) {
    for (const id of gameState.enemies)      engine.removeEntity(id);
    for (const id of gameState.bombs)        engine.removeEntity(id);
    if (gameState.powerup) engine.removeEntity(gameState.powerup);
    for (const id of gameState.softBlocks)   engine.removeEntity(id);
    for (const id of gameState.flames)       engine.removeEntity(id);
    if (gameState.door) engine.removeEntity(gameState.door);
  }

}
