import { STATE } from '../ecs/config.js';
import { GAME_STATE, GAME_STATE_ENTITY } from '../components';
import { EVENT } from '../ecs/events.js';
import { emitEvent, clearEventsByType } from '../ecs/eventHelpers.js';
import { soundManager } from '../utils/SoundManager.js';

export class MusicSystem {
  constructor() {
    this.name = 'music';
    this.runsWhenPaused = true;
    this._lastMusicKey = null;
    this._muted = false;
    this._waitingForEnd = false;
    // Deferred flag: set by onended callback or poll; emitted as MUSIC_COMPLETE next tick
    // to avoid mutating shared state from within an async audio event
    this._pendingMusicComplete = false;
  }

  apply(engine) {
    clearEventsByType(engine, EVENT.MUSIC_COMPLETE);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    if (this._pendingMusicComplete) {
      this._pendingMusicComplete = false;
      this._waitingForEnd = false;
      emitEvent(engine, GAME_STATE_ENTITY, { type: EVENT.MUSIC_COMPLETE });
      return;
    }

    // Poll each tick as a fallback — handles the case where audio was blocked
    // or the onended event didn't fire (e.g. file missing, autoplay policy)
    if (this._waitingForEnd && soundManager.isMusicDone()) {
      this._pendingMusicComplete = true;
      return;
    }

    if (gameState.musicMuted !== this._muted) {
      this._muted = gameState.musicMuted;
      this._muted ? soundManager.muteMusic() : soundManager.unmuteMusic();
    }

    const state = gameState.currentState;

    if (state === STATE.PAUSED) return;

    let desiredKey = null;
    let loop       = false;
    let oneShot    = false;

    switch (state) {
      case STATE.TITLE:
        desiredKey = 'title';
        loop       = true;
        break;

      case STATE.LEVEL_START:
        desiredKey = 'levelStart';
        oneShot    = true;
        break;

      case STATE.LEVEL_CLEAR:
        desiredKey = 'stageClear';
        oneShot    = true;
        break;

      case STATE.PLAYER_DIED:
        desiredKey = 'miss';
        oneShot    = true;
        break;

      case STATE.GAME_OVER:
        desiredKey = 'gameOver';
        oneShot    = true;
        break;

      case STATE.GAME_WON:
        desiredKey = 'ending';
        break;

      case STATE.PLAYING: {
        if (gameState.playerInvincible) {
          desiredKey = 'specialPowerUpGet';
        // TODO(events): query for LevelPowerCollectedEvent event entity instead (event-entity pattern)
        } else if (gameState.levelPowerCollected) {
          desiredKey = 'powerUpGet';
        } else {
          desiredKey = 'main';
        }
        loop = true;
        break;
      }

      default:
        desiredKey = null;
    }

    if (desiredKey !== this._lastMusicKey) {
      this._waitingForEnd = false;

      if (desiredKey === null) {
        soundManager.stopMusic();
      } else {
        const onEnded = oneShot ? () => { this._pendingMusicComplete = true; } : null;
        soundManager.playMusic(desiredKey, { loop, onEnded });
        if (oneShot) this._waitingForEnd = true;
      }

      this._lastMusicKey = desiredKey;
    }
  }
}
