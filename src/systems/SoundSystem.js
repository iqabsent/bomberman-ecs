import { soundManager } from '../utils/SoundManager.js';
import { SOUND, ANIMATION, PLAYER } from '../components';

export class SoundSystem {
  constructor() {
    this.name = 'sound';
  }

  apply(engine) {
    // Footstep sounds — derived from player animation frame transitions
    for (const id of engine.entities) {
      const player = engine.getComponent(id, PLAYER);
      if (!player) continue;
      const anim = engine.getComponent(id, ANIMATION);
      if (anim && anim.shouldAnimate && anim.frame === 1 && anim.ticks === 0) {
        const isLR = anim.animationKey?.endsWith('LEFT') || anim.animationKey?.endsWith('RIGHT');
        soundManager.play(isLR ? 'step_lr' : 'step_ud');
      }
    }

    // Drain the global sound queue
    const sound = engine.getSingleton(SOUND);
    if (!sound) return;
    for (const key of sound.queue) soundManager.play(key);
    sound.queue = [];
  }
}
