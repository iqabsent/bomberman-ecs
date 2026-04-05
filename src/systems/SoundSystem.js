import { soundManager } from '../utils/SoundManager.js';
import { SoundComponent } from '../components/SoundComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';

export class SoundSystem {
  constructor() {
    this.name = 'sound';
  }

  apply(engine) {
    for (const [id] of engine.entities.entries()) {
      const sound = engine.getComponent(id, SoundComponent);
      if (!sound) continue;

      // Derive footstep sounds for the player from animation frame transitions.
      // This keeps footstep triggering here rather than in PlayerSystem,
      // avoiding sound coupling in the movement/input logic.
      const playerInput = engine.getComponent(id, PlayerComponent);
      if (playerInput) {
        const velocity = engine.getComponent(id, VelocityComponent);
        const anim     = engine.getComponent(id, AnimationComponent);
        const moving   = velocity && (velocity.vx !== 0 || velocity.vy !== 0);

        if (moving && anim && anim.frame !== sound._lastAnimFrame) {
          sound._lastAnimFrame = anim.frame;
          // Mirrors original: play once at the start of frame 1 per animation cycle
          if (anim.frame === 1) {
            soundManager.play(velocity.vx !== 0 ? 'step_lr' : 'step_ud');
          }
        }

        if (!moving) sound._lastAnimFrame = -1; // reset so first step plays immediately next time
      }

      // Play all queued sounds and clear the queue
      for (const key of sound.queue) {
        soundManager.play(key);
      }
      sound.queue = [];
    }
  }
}
