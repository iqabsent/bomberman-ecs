import { AnimationComponent } from '../components/AnimationComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { assetManager } from '../utils/AssetManager.js';

export class AnimationSystem {
  constructor() {
    this.name = 'animation';
  }

  apply(engine, dt) {

    for (const [id] of engine.entities.entries()) {
      const anim = engine.getComponent(id, AnimationComponent);
      const render = engine.getComponent(id, RenderComponent);
      if (!anim || !render || !anim.animationKey) continue;

      const frames = assetManager.getAnimation(anim.animationKey);
      if (!frames || !frames.length) continue;

      // Reset frame/ticks when the animation key changes
      if (anim.animationKey !== anim._prevAnimationKey) {
        anim.frame = 0;
        anim.ticks = 0;
        anim._prevAnimationKey = anim.animationKey;
      }

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
