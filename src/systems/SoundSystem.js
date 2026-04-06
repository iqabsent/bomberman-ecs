import { soundManager } from '../utils/SoundManager.js';
import { SoundComponent } from '../components/SoundComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
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
        const anim = engine.getComponent(id, AnimationComponent);

        if (anim && anim.shouldAnimate && anim.frame !== sound._lastAnimFrame) {
          sound._lastAnimFrame = anim.frame;
          // Mirrors original: play once at the start of frame 1 per animation cycle
          if (anim.frame === 1) {
            const isLR = anim.animationKey?.endsWith('LEFT') || anim.animationKey?.endsWith('RIGHT');
            soundManager.play(isLR ? 'step_lr' : 'step_ud');
          }
        }

        if (!anim || !anim.shouldAnimate) sound._lastAnimFrame = -1; // reset so first step plays immediately next time
      }

      // Play all queued sounds and clear the queue
      for (const key of sound.queue) {
        soundManager.play(key);
      }
      sound.queue = [];
    }
  }
}
