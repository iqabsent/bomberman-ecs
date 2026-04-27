import { STATE, SPAWN, LEVEL, DEFAULT_LIVES, LEVEL_TIME } from '../ecs/config.js';
import { GAME_STATE, GAME_STATE_ENTITY } from '../components';
import { EVENT } from '../ecs/events.js';
import { emitEvent, getEvent, clearEventsByType } from '../ecs/eventHelpers.js';

export class LevelSystem {
  constructor() {
    this.name = 'level';
  }

  apply(engine) {
    clearEventsByType(engine, EVENT.SPAWN_INTENT);
    clearEventsByType(engine, EVENT.MAP_LOAD_REQUESTED);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    if (getEvent(engine, GAME_STATE_ENTITY, EVENT.MUSIC_COMPLETE)) {
      switch (gameState.currentState) {
        case STATE.LEVEL_START: gameState.currentState = STATE.PLAYING;          return;
        case STATE.PLAYER_DIED: gameState.currentState = STATE.LEVEL_START;      return;
        case STATE.GAME_OVER:   gameState.currentState = STATE.TITLE;            return;
        case STATE.LEVEL_CLEAR: this._startLoad(engine, gameState, 'level_clear'); return;
      }
    }

    if (getEvent(engine, GAME_STATE_ENTITY, EVENT.LOAD_REQUESTED)) {
      this._startLoad(engine, gameState, 'new_game');
      return;
    }

    if (gameState.currentState === STATE.LOADING) {
      if (getEvent(engine, GAME_STATE_ENTITY, EVENT.MAP_LOAD_COMPLETE) &&
          getEvent(engine, GAME_STATE_ENTITY, EVENT.ENEMY_LOAD_COMPLETE)) {
        gameState.currentState = STATE.LEVEL_START;
      }
    }
  }

  _startLoad(engine, gameState, reason) {
    if (reason === 'level_clear' && gameState.currentLevel >= LEVEL.length - 1) {
      gameState.currentState = STATE.GAME_WON;
      return;
    }

    gameState.currentState = STATE.LOADING;
    LevelSystem.removeAllLevelEntities(gameState, engine);

    if (reason === 'level_clear') {
      gameState.currentLevel++;
      gameState.lives++;
      LevelSystem.resetLevelState(gameState);
    } else {
      gameState.currentLevel = 0;
      gameState.lives = DEFAULT_LIVES;
      gameState.score = 0;
      LevelSystem.resetLevelState(gameState);
    }

    const spawnType = reason === 'new_game' ? SPAWN.GAME_SPAWN : SPAWN.LEVEL_SPAWN;
    emitEvent(engine, gameState.player, { type: EVENT.SPAWN_INTENT, payload: spawnType });
    emitEvent(engine, GAME_STATE_ENTITY, { type: EVENT.MAP_LOAD_REQUESTED });
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
    gameState.levelPowerCollected = false;
  }

  static removeAllLevelEntities(gameState, engine) {
    for (const id of gameState.enemies)    engine.removeEntity(id);
    for (const id of gameState.bombs)      engine.removeEntity(id);
    if (gameState.powerup)                 engine.removeEntity(gameState.powerup);
    for (const id of gameState.softBlocks) engine.removeEntity(id);
    for (const id of gameState.flames)     engine.removeEntity(id);
    if (gameState.door)                    engine.removeEntity(gameState.door);
  }
}
