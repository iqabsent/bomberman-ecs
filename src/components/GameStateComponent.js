import { STATE } from '../ecs/config.js';

export class GameStateComponent {
  static type = 'GameStateComponent';
  constructor() {
    this.currentState = STATE.TITLE;
    this.currentLevel = 0;
    this.lives = 0;
    this.score = 0;
    this.gameTime = 0;
    this.timeUp = false;
    this.gameMap = null;
    this.cameraX = 0;
    this.cameraY = 0;

    // Soft block tracking for power-up / door spawn odds
    this.softBlockCount = 0;
    this.powerSpawned = false;
    this.doorSpawned = false;

    // Set by PlayerSystem when POWER_UP_COLLECTED event is emitted; read by MusicSystem
    this.levelPowerCollected = false;
    // Set by PlayerSystem when INVINCIBLE powerup is gained/expires; read by MusicSystem
    this.playerInvincible = false;
    // Toggled by SELECT touch button; read by MusicSystem
    this.musicMuted = false;
  }
}
