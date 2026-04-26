import { ANIMATION, RENDER } from '../components';
import { EVENT } from '../ecs/events.js';
import { emitEvent, clearEventsByType } from '../ecs/eventHelpers.js';
import { assetManager } from '../utils/AssetManager.js';

export class AnimationSystem {
  constructor() {
    this.name = 'animation';
  }

  apply(engine, dt) {
    clearEventsByType(engine, EVENT.ANIMATION_COMPLETED);

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
              emitEvent(engine, id, { type: EVENT.ANIMATION_COMPLETED });
              if (animation.onCompleteEvent) {
                const { targetId, type, payload } = animation.onCompleteEvent;
                emitEvent(engine, targetId, { type, payload });
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
