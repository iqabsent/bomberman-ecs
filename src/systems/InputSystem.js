import { VELOCITY, ANIMATION, PLAYER, HEALTH, GAME_STATE, SOUND } from '../components';
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

        const velocity = engine.getComponent(id, VELOCITY);
        if (!velocity) continue;

        const health = engine.getComponent(id, HEALTH);

        if (health && health.isDying) {
          velocity.vx = 0;
          velocity.vy = 0;
          continue;
        }

        const prevVx = velocity.vx;
        const prevVy = velocity.vy;

        const speed = player.movementSpeed;

        // One axis at a time — no diagonal movement in Bomberman
        velocity.vx = 0;
        velocity.vy = 0;
        if      (this.keyStates.has('ArrowLeft'))  velocity.vx = -speed;
        else if (this.keyStates.has('ArrowRight')) velocity.vx =  speed;
        else if (this.keyStates.has('ArrowUp'))    velocity.vy = -speed;
        else if (this.keyStates.has('ArrowDown'))  velocity.vy =  speed;

        const anim = engine.getComponent(id, ANIMATION);
        if (anim) {
          const moving = velocity.vx !== 0 || velocity.vy !== 0;
          anim.shouldAnimate = moving;

          if (moving && anim.frame === 1 && anim.ticks === 0) {
            const sound = engine.getSingleton(SOUND);
            if (sound) sound.queue.push(velocity.vx !== 0 ? 'step_lr' : 'step_ud');
          }

          const dirChanged = velocity.vx !== prevVx || velocity.vy !== prevVy;
          const invChanged = (player.invincibilityTimer > 0) !== (anim.animationKey?.includes('_I_'));
          if ((dirChanged || invChanged) && moving) {
            const inv = player.invincibilityTimer > 0;
            anim.loop = true;
            if      (velocity.vy < 0) anim.animationKey = inv ? 'MAN_I_UP'    : 'MAN_UP';
            else if (velocity.vy > 0) anim.animationKey = inv ? 'MAN_I_DOWN'  : 'MAN_DOWN';
            else if (velocity.vx < 0) anim.animationKey = inv ? 'MAN_I_LEFT'  : 'MAN_LEFT';
            else if (velocity.vx > 0) anim.animationKey = inv ? 'MAN_I_RIGHT' : 'MAN_RIGHT';
          }
        }

        player.wantsToPlaceBomb = this.keyStates.has('KeyS');
        player.wantsToDetonate  = this.justPressed.has('KeyD');
      }
    }

    this.justPressed.clear();
  }
}
