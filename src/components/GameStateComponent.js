import { STATE, DEFAULT_LIVES, TYPE, LEVEL_TIME } from '../ecs/config.js';

export class GameStateComponent {
  constructor() {
    this.currentState = STATE.TITLE;
    this.currentLevel = 0;
    this.lives = DEFAULT_LIVES;
    this.score = 0;
    this.bombs = [];
    this.flames = [];      // entity IDs for active Flame entities
    this.powerups = [];
    this.enemies = [];
    this.dyingEnemies = [];
    this.softBlocks = [];  // entity IDs for SoftBlock entities
    this.door = null;
    this.gameTime = LEVEL_TIME;
    this.timeUp = false;
    this.isPaused = false;
    this.gameMap = null;
    this.cameraX = 0;
    this.cameraY = 0;

    // Soft block tracking for power-up / door spawn odds
    this.softBlockCount = 0;
    this.powerSpawned = false;
    this.doorSpawned = false;
    this.doorTriggered = false;

    // Cells pending map reveal — written by DestroyableSystem, processed by MapSystem
    this.pendingMapReveals = [];

    // Pending enemy spawns — written by DestroyableSystem/TimerSystem, processed by EnemySystem
    // pendingEnemySpawnDoor: { gridX, gridY, enemyType } — deferred until flames leave the cell
    // pendingEnemySpawnTimer: true — spawn PONTANs from random clear cells
    this.pendingEnemySpawnDoor  = null;
    this.pendingEnemySpawnTimer = false;

    // Set by CollectibleSystem when the level's designated power-up is collected.
    // MusicSystem uses this to switch to the power-up-get music track.
    this.levelPowerCollected = false;

    // Loading sub-states — set true when work is pending, cleared by each responsible system
    this.levelLoading = true;
    this.mapLoading = true;
    this.enemyLoading = true;
  }

  setMap(map) {
    this.gameMap = map;
    this.softBlockCount = 0;
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] & TYPE.SOFT_BLOCK) this.softBlockCount++;
      }
    }
  }

  _transition(newState) {
    this.previousState = this.currentState;
    this.currentState = newState;
  }

  toTitleState()         { this._transition(STATE.TITLE); }
  toLoadingState()       { this._transition(STATE.LOADING); this.levelLoading = true; this.mapLoading = true; this.enemyLoading = true; }
  toLevelStartState()    { this._transition(STATE.LEVEL_START); }
  toLevelState()         { this._transition(STATE.PLAYING); }
  toPausedState()        { this.isPaused = true;  this._transition(STATE.PAUSED); }
  toResumedState()       { this.isPaused = false; this._transition(STATE.PLAYING); }
  toPlayerDiedState()    { this._transition(STATE.PLAYER_DIED); }
  toLevelClearState()    { this._transition(STATE.LEVEL_CLEAR); }
  toGameOverState()      { this._transition(STATE.GAME_OVER); }
  toGameWonState()       { this._transition(STATE.GAME_WON); }
  addScore(points) { this.score += points; }

  newGame() {
    // TODO: these need to be split up and handled in their respective systems — GameStateComponent should ideally just hold data and not have any logic
    this.currentLevel = 0;
    this.lives = DEFAULT_LIVES;
    this.score = 0;
    this.gameTime = LEVEL_TIME;
    this.timeUp = false;
    this.powerSpawned = false;
    this.doorSpawned = false;
    this.doorTriggered = false;
    this.door = null;
    this.gameMap = null;
    this.powerups = [];
    this.bombs = [];
    this.flames = [];
    this.enemies = [];
    this.dyingEnemies = [];
    this.softBlocks = [];
    this.pendingMapReveals = [];
    this.pendingEnemySpawnDoor  = null;
    this.pendingEnemySpawnTimer = false;
    this.levelPowerCollected    = false;
    this.mapLoading = true;
    this.enemyLoading = true;
  }

  nextLevel() {
    //TODO: these need to be split up and handled in their respective systems — GameStateComponent should ideally just hold data and not have any logic
    this.currentLevel++;
    this.gameTime = LEVEL_TIME;
    this.timeUp = false;
    this.powerSpawned = false;
    this.doorSpawned = false;
    this.doorTriggered = false;
    this.door = null;
    this.powerups = [];
    this.bombs = [];
    this.flames = [];
    this.enemies = [];
    this.dyingEnemies = [];
    this.softBlocks = [];
    this.pendingMapReveals = [];
    this.pendingEnemySpawnDoor  = null;
    this.pendingEnemySpawnTimer = false;
    this.levelPowerCollected    = false;
    this.mapLoading = true;
    this.enemyLoading = true;
  }
}
