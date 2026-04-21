import { PLAYER, HEALTH, GAME_STATE } from '../components';
import { soundManager } from '../utils/SoundManager.js';
import { STATE } from '../ecs/config.js';

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
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) {
      this.justPressed.clear();
      return;
    }

    if (gameState.currentState === STATE.TITLE && this.justPressed.has('KeyS')) {
      gameState.toLoadingState();
    }

    if (this.justPressed.has('KeyM')) {
      gameState.musicMuted = !gameState.musicMuted;
    }

    if (this.justPressed.has('KeyP') &&
        (gameState.currentState === STATE.PLAYING || gameState.currentState === STATE.PAUSED)) {
      const wasPaused = engine.paused;
      wasPaused ? gameState.toResumedState() : gameState.toPausedState();
      engine.paused = !engine.paused;
      if (wasPaused) {
        soundManager.resumeAll();
      } else {
        soundManager.pauseAll();
        soundManager.play('pause'); // starts after pauseAll — not in the interrupted set
      }
    }

    if (gameState.currentState === STATE.PLAYING && !engine.paused) {
      for (const id of gameState.players) {
        const player = engine.getComponent(id, PLAYER);
        if (!player) continue;

        const health = engine.getComponent(id, HEALTH);
        if (health?.isDying) {
          player.inputDx = 0;
          player.inputDy = 0;
          continue;
        }

        // One axis at a time — no diagonal movement in Bomberman
        player.inputDx = 0;
        player.inputDy = 0;
        if      (this.keyStates.has('ArrowLeft'))  player.inputDx = -1;
        else if (this.keyStates.has('ArrowRight')) player.inputDx =  1;
        else if (this.keyStates.has('ArrowUp'))    player.inputDy = -1;
        else if (this.keyStates.has('ArrowDown'))  player.inputDy =  1;

        // TODO(events): add BombPlacementIntent component to player entity when true; remove it when false (component-on-entity pattern)
        player.pendingBombPlacement  = this.keyStates.has('KeyS') && player.activeBombs < player.maxBombs;
        // TODO(events): add BombDetonationIntent component to player entity; removed by cleanup at start of next frame (component-on-entity pattern)
        if (this.justPressed.has('KeyD') && player.canDetonate) player.pendingBombDetonation = true;
      }
    }

    this.justPressed.clear();
  }
}
