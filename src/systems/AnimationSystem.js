import { DESTROY } from '../ecs/config.js';
import { ANIMATION, RENDER, DESTROYABLE } from '../components';
import { assetManager } from '../utils/AssetManager.js';

export class AnimationSystem {
  constructor() {
    this.name = 'animation';
  }

  apply(engine, dt) {

    for (const id of engine.entities) {
      const render = engine.getComponent(id, RENDER);
      const animation = engine.getComponent(id, ANIMATION);
      if (!render || !animation || !animation.animationKey) continue;

      const frames = assetManager.getAnimation(animation.animationKey);
      if (!frames || !frames.length) continue;

      // Reset frame/ticks when the animation key changes
      if (animation.animationKey !== animation._prevAnimationKey) {
        animation.frame = 0;
        animation.ticks = 0;
        animation._prevAnimationKey = animation.animationKey;
      }

      // Tick pre-animation delay; when it expires, start playing
      if (animation.delay > 0) {
        animation.delay -= dt;
        if (animation.delay <= 0) {
          animation.delay = 0;
          animation.frame = 0;
          animation.ticks = 0;
          animation.shouldAnimate = true;
        }
        continue;
      }

      if (animation.shouldAnimate) {
        animation.ticks += dt;
        if (animation.ticks >= animation.ticksPerFrame) {
          animation.ticks = 0;
          animation.frame++;
          if (animation.frame >= frames.length) {
            if (animation.loop) {
              animation.frame = 0;
            } else {
              animation.frame = frames.length - 1;
              animation.shouldAnimate = false;
              const destroyable = engine.getComponent(id, DESTROYABLE);
              if (destroyable && destroyable.destroyState === DESTROY.DESTROYING) {
                destroyable.destroyState = DESTROY.DESTROYED;
              }
            }
          }
        }
      }

      // Always write current frame to render sprite, even while paused
      render.sprite = frames[animation.frame];
    }
  }
}
