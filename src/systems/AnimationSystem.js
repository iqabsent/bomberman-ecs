import { AnimationComponent } from '../components/AnimationComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { assetManager } from '../utils/AssetManager.js';

export class AnimationSystem {
  constructor() {
    this.name = 'animation';
    this.lastTime = null;
  }

  apply(engine, time) {
    if (!this.lastTime) this.lastTime = time;
    const rawDt = (time - this.lastTime) / (1000 / 60);
    const dt = Math.min(rawDt, 3);
    this.lastTime = time;

    for (const [id] of engine.entities.entries()) {
      const anim = engine.getComponent(id, AnimationComponent);
      const render = engine.getComponent(id, RenderComponent);
      if (!anim || !render || !anim.animationKey) continue;

      const frames = assetManager.getAnimation(anim.animationKey);
      if (!frames || !frames.length) continue;

      if (anim.shouldAnimate) {
        anim.ticks += dt;
        if (anim.ticks >= anim.ticksPerFrame) {
          anim.ticks = 0;
          anim.frame++;
          if (anim.frame >= frames.length) {
            if (anim.loop) {
              anim.frame = 0;
            } else {
              anim.frame = frames.length - 1;
              anim.shouldAnimate = false;
            }
          }
        }
      }

      // Always write current frame to render sprite, even while paused
      render.sprite = frames[anim.frame];
    }
  }
}
