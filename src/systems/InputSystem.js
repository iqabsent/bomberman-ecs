import { KEYMAP } from '../utils/KeyMap.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { LevelSystem } from './LevelSystem.js';
import { soundManager } from '../utils/SoundManager.js';
import { STATE } from '../ecs/config.js';

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
    const gameState = engine.getSingleton(GameStateComponent);

    if (gameState && gameState.currentState === STATE.TITLE && this.justPressed.has(KEYMAP.S)) {
      this.justPressed.clear();
      LevelSystem.removeAllLevelEntities(gameState, engine);
      LevelSystem.resetPlayer(engine, gameState, true);
      gameState.newGame();
      gameState.toLoadingState();
      return;
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

    // Only process player input while actively playing
    if (!gameState || gameState.currentState !== STATE.PLAYING) {
      this.justPressed.clear();
      return;
    }
    if (engine.paused) {
      this.justPressed.clear();
      return;
    }

    for (const [id] of engine.entities.entries()) {
      const player = engine.getComponent(id, PlayerComponent);
      if (!player) continue;

      const velocity = engine.getComponent(id, VelocityComponent);
      if (!velocity) continue;

      const health = engine.getComponent(id, HealthComponent);

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

      const anim = engine.getComponent(id, AnimationComponent);
      if (anim) {
        const moving = velocity.vx !== 0 || velocity.vy !== 0;
        anim.shouldAnimate = moving;

        const dirChanged = velocity.vx !== prevVx || velocity.vy !== prevVy;
        if (dirChanged && moving) {
          if      (velocity.vy < 0) anim.setAnimation('MAN_UP');
          else if (velocity.vy > 0) anim.setAnimation('MAN_DOWN');
          else if (velocity.vx < 0) anim.setAnimation('MAN_LEFT');
          else if (velocity.vx > 0) anim.setAnimation('MAN_RIGHT');
        }
      }

      player.wantsToPlaceBomb = this.keyStates.has(KEYMAP.S);
      player.wantsToDetonate  = this.justPressed.has(KEYMAP.D);
    }

    this.justPressed.clear();
  }
}
