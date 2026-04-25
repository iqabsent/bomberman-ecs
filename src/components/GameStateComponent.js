import { STATE } from '../ecs/config.js';

export class GameStateComponent {
  static type = 'GameStateComponent';
  constructor() {
    this.currentState = STATE.TITLE;
    this.previousState = null;
    this.currentLevel = 0;
    this.lives = 0;
    this.score = 0;
    this.players = [];
    this.bombs = [];
    this.flames = [];
    this.powerups = [];
    this.enemies = [];
    this.softBlocks = [];
    this.door = null;
    this.gameTime = 0;
    this.timeUp = false;
    this.gameMap = null;
    this.cameraX = 0;
    this.cameraY = 0;

    // Soft block tracking for power-up / door spawn odds
    this.softBlockCount = 0;
    this.powerSpawned = false;
    this.doorSpawned = false;

    // TODO(events): replace with EnemySpawnQueued event entities (event-entity pattern) — multi-frame persistent state, needs dedicated component
    this.pendingEnemySpawnDoor    = null;
    this.pendingEnemySpawnPowerUp = null;

    // TODO(events): replace with LevelPowerCollectedEvent event entity; MusicSystem queries for it (event-entity pattern)
    this.levelPowerCollected = false;

    // Set by PlayerSystem when INVINCIBLE powerup is gained/expires; read by MusicSystem
    this.playerInvincible = false;

    // Toggled by SELECT touch button; read by MusicSystem
    this.musicMuted = false;

    // TODO(events): replace mapLoading/enemyLoading with SystemReadyEvent entities emitted by MapSystem and EnemySystem; LevelSystem queries for both (event-entity pattern)
    this.levelLoading = true;
    this.mapLoading = true;
    this.enemyLoading = true;
  }

  // TODO: state transition methods are behaviour — consider moving to a separate StateManager
  // NOTE: needing to know previousState is a code smell. flags should be used to control behaviour.
  _transition(newState) {
    this.previousState = this.currentState;
    this.currentState = newState;
  }

  toTitleState()      { this._transition(STATE.TITLE); }
  //NOTE: having LOADING_LEVEL -> LOADING_MAP -> LOADING_ENEMIES as separate, chained
  // .. states would allow us to get rid of toLoadingState() and all other toXState()
  // .. methods. then only _transition() breaks from pure data storage.
  toLoadingState()    { this._transition(STATE.LOADING); this.levelLoading = true; this.mapLoading = true; this.enemyLoading = true; }
  toLevelStartState() { this._transition(STATE.LEVEL_START); }
  toLevelState()      { this._transition(STATE.PLAYING); }
  toPausedState()     { this._transition(STATE.PAUSED); }
  toResumedState()    { this._transition(STATE.PLAYING); }
  toPlayerDiedState() { this._transition(STATE.PLAYER_DIED); }
  toLevelClearState() { this._transition(STATE.LEVEL_CLEAR); }
  toGameOverState()   { this._transition(STATE.GAME_OVER); }
  toGameWonState()    { this._transition(STATE.GAME_WON); }
}
