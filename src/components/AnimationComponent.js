export class AnimationComponent {
  constructor({ ticksPerFrame = 6, animationKey = null, shouldAnimate = false, loop = true, delay = 0 } = {}) {
    this.animationKey = animationKey;
    this._prevAnimationKey = null;
    this.frame = 0;
    this.ticks = 0;
    this.ticksPerFrame = ticksPerFrame;
    this.loop = loop;
    this.shouldAnimate = shouldAnimate;
    this.delay = delay;
    this.completed = false;
  }
}
