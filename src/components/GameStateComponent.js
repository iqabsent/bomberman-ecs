import { STATE } from '../ecs/config.js';

export class GameStateComponent {
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

    // Set by EnemySystem on enemy–player collision; cleared by PlayerSystem after processing
    this.pendingPlayerDeath = null;
    // Set by PlayerSystem when INVINCIBLE powerup is gained/expires; read by MusicSystem
    this.playerInvincible = false;

    // Loading sub-states — set true when work is pending, cleared by each responsible system
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
