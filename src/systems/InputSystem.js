import { KEYMAP } from '../utils/KeyMap.js';
import { VELOCITY, ANIMATION, PLAYER, HEALTH, GAME_STATE } from '../components';
import { LevelSystem } from './LevelSystem.js';
import { soundManager } from '../utils/SoundManager.js';
import { STATE, DEFAULT_LIVES } from '../ecs/config.js';

export class InputSystem {
  constructor() {
    this.name = 'input';
    this.runsWhenPaused = true;
    this.keyStates = new Set();
    this.justPressed = new Set(); // cleared each tick after being consumed

    window.addEventListener('keydown', (ev) => {
      if (!this.keyStates.has(ev.keyCode)) {
        this.justPressed.add(ev.keyCode);
      }
      this.keyStates.add(ev.keyCode);
    });
    window.addEventListener('keyup', (ev) => this.keyStates.delete(ev.keyCode));
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);

    if (gameState && gameState.currentState === STATE.TITLE && this.justPressed.has(KEYMAP.S)) {
      LevelSystem.removeAllLevelEntities(gameState, engine);
      gameState.currentLevel = 0;
      gameState.lives = DEFAULT_LIVES;
      gameState.score = 0;
      LevelSystem.resetLevelState(gameState);
      gameState.toLoadingState();
    }

    if (this.justPressed.has(KEYMAP.P) && gameState &&
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

    if (gameState && gameState.currentState === STATE.PLAYING && !engine.paused) {
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
        if      (this.keyStates.has(KEYMAP.LEFT))  velocity.vx = -speed;
        else if (this.keyStates.has(KEYMAP.RIGHT)) velocity.vx =  speed;
        else if (this.keyStates.has(KEYMAP.UP))    velocity.vy = -speed;
        else if (this.keyStates.has(KEYMAP.DOWN))  velocity.vy =  speed;

        const anim = engine.getComponent(id, ANIMATION);
        if (anim) {
          const moving = velocity.vx !== 0 || velocity.vy !== 0;
          anim.shouldAnimate = moving;

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

        player.wantsToPlaceBomb = this.keyStates.has(KEYMAP.S);
        player.wantsToDetonate  = this.justPressed.has(KEYMAP.D);
      }
    }

    this.justPressed.clear();
  }
}
