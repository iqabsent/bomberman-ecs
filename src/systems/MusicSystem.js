import { STATE } from '../ecs/config.js';
import { GAME_STATE } from '../components';
import { soundManager } from '../utils/SoundManager.js';

export class MusicSystem {
  constructor() {
    this.name = 'music';
    this.runsWhenPaused = true;
    this._lastMusicKey = null;
    this._muted = false;
    // Callback to fire when the current one-shot track finishes
    this._onMusicEnd = null;
    // State transition to apply next tick (set by one-shot callback or poll)
    this._pendingTransition = null;
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    // Apply any deferred state transition from a finished one-shot track.
    // The transition is set via _pendingTransition rather than applied directly in the onended
    // callback to avoid mutating game state from within an async audio event.
    if (this._pendingTransition) {
      const method = this._pendingTransition;
      this._pendingTransition = null;
      this._onMusicEnd = null;
      gameState[method]();
      return;
    }

    // Poll each tick as a fallback — handles the case where audio was blocked
    // or the onended event didn't fire (e.g. file missing, autoplay policy)
    if (this._onMusicEnd && soundManager.isMusicDone()) {
      this._pendingTransition = this._onMusicEnd;
      return;
    }

    if (gameState.musicMuted !== this._muted) {
      this._muted = gameState.musicMuted;
      this._muted ? soundManager.muteMusic() : soundManager.unmuteMusic();
    }

    const state = gameState.currentState;

    // Don't interfere while paused — music keeps playing on its own
    if (state === STATE.PAUSED) return;

    let desiredKey       = null;
    let loop             = false;
    let oneShotTransition = null;

    switch (state) {
      case STATE.TITLE:
        desiredKey = 'title';
        loop       = true;
        break;

      case STATE.LEVEL_START:
        desiredKey        = 'levelStart';
        oneShotTransition = 'toLevelState';
        break;

      case STATE.LEVEL_CLEAR:
        desiredKey        = 'stageClear';
        oneShotTransition = 'toLoadingState';
        break;

      case STATE.PLAYER_DIED:
        desiredKey        = 'miss';
        oneShotTransition = 'toLevelStartState';
        break;

      case STATE.GAME_OVER:
        desiredKey        = 'gameOver';
        oneShotTransition = 'toTitleState';
        break;

      case STATE.GAME_WON:
        desiredKey = 'ending';
        break;

      case STATE.PLAYING: {
        if (gameState.playerInvincible) {
          desiredKey = 'specialPowerUpGet';
        } else if (gameState.levelPowerCollected) {
          desiredKey = 'powerUpGet';
        } else {
          desiredKey = 'main';
        }
        loop = true;
        break;
      }

      default:
        // LOADING and any other transient states — silence
        desiredKey = null;
    }

    if (desiredKey !== this._lastMusicKey) {
      this._onMusicEnd = null;

      if (desiredKey === null) {
        soundManager.stopMusic();
      } else {
        const onEnded = oneShotTransition
          ? () => { this._pendingTransition = oneShotTransition; }
          : null;
        soundManager.playMusic(desiredKey, { loop, onEnded });
        if (oneShotTransition) this._onMusicEnd = oneShotTransition;
      }

      this._lastMusicKey = desiredKey;
    }
  }
}
