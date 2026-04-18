import { soundManager } from '../utils/SoundManager.js';
import { SOUND } from '../components';

export class SoundSystem {
  constructor() {
    this.name = 'sound';
  }

  apply(engine) {
    // Drain the global sound queue
    const sound = engine.getSingleton(SOUND);
    if (!sound) return;
    for (const key of sound.queue) soundManager.play(key);
    sound.queue = [];
  }
}
