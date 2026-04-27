import { PLAYER, DESTROYABLE, GAME_STATE, GAME_STATE_ENTITY } from '../components';
import { soundManager } from '../utils/SoundManager.js';
import { STATE } from '../ecs/config.js';
import { EVENT } from '../ecs/events.js';
import { emitEvent, clearEventsByType } from '../ecs/eventHelpers.js';

export class InputSystem {
  constructor() {
    this.name = 'input';
    this.runsWhenPaused = true;
    this.keyStates = new Set();
    this.justPressed = new Set(); // cleared each tick after being consumed

    window.addEventListener('keydown', (ev) => {
      if (!this.keyStates.has(ev.code)) {
        this.justPressed.add(ev.code);
      }
      this.keyStates.add(ev.code);
    });
    window.addEventListener('keyup', (ev) => this.keyStates.delete(ev.code));
  }

  apply(engine) {
    clearEventsByType(engine, EVENT.BOMB_PLACEMENT_INTENT);
    clearEventsByType(engine, EVENT.BOMB_DETONATION_INTENT);
    clearEventsByType(engine, EVENT.LOAD_REQUESTED);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) {
      this.justPressed.clear();
      return;
    }

    if (gameState.currentState === STATE.TITLE && this.justPressed.has('KeyS')) {
      emitEvent(engine, GAME_STATE_ENTITY, { type: EVENT.LOAD_REQUESTED, payload: { reason: 'new_game' } });
    }

    if (this.justPressed.has('KeyM')) {
      gameState.musicMuted = !gameState.musicMuted;
    }

    if (this.justPressed.has('KeyP') &&
        (gameState.currentState === STATE.PLAYING || gameState.currentState === STATE.PAUSED)) {
      const wasPaused = engine.paused;
      gameState.currentState = wasPaused ? STATE.PLAYING : STATE.PAUSED;
      engine.paused = !engine.paused;
      if (wasPaused) {
        soundManager.resumeAll();
      } else {
        soundManager.pauseAll();
        soundManager.play('pause'); // starts after pauseAll — not in the interrupted set
      }
    }

    if (gameState.currentState === STATE.PLAYING && !engine.paused) {
      const id = gameState.player;
      const player = engine.getComponent(id, PLAYER);
      if (player) {
        const destroyable = engine.getComponent(id, DESTROYABLE);
        if (destroyable?.destroyState !== null) {
          player.inputDx = 0;
          player.inputDy = 0;
        } else {
          // One axis at a time — no diagonal movement in Bomberman
          player.inputDx = 0;
          player.inputDy = 0;
          if      (this.keyStates.has('ArrowLeft'))  player.inputDx = -1;
          else if (this.keyStates.has('ArrowRight')) player.inputDx =  1;
          else if (this.keyStates.has('ArrowUp'))    player.inputDy = -1;
          else if (this.keyStates.has('ArrowDown'))  player.inputDy =  1;

          if (this.keyStates.has('KeyS') && player.activeBombs < player.maxBombs) {
            emitEvent(engine, id, { type: EVENT.BOMB_PLACEMENT_INTENT });
          }
          if (this.justPressed.has('KeyD') && player.canDetonate) {
            emitEvent(engine, id, { type: EVENT.BOMB_DETONATION_INTENT });
          }
        }
      }
    }

    this.justPressed.clear();
  }
}
