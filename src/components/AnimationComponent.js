export class AnimationComponent {
  constructor(ticksPerFrame = 6) {
    this.animationKey = null;
    this.frame = 0;
    this.ticks = 0;
    this.ticksPerFrame = ticksPerFrame;
    this.loop = true;
    this.shouldAnimate = false;
  }

  // Only resets frame/ticks when the key actually changes — matches original setAnimation guard
  setAnimation(key, loop = true) {
    if (this.animationKey === key) return;
    this.animationKey = key;
    this.loop = loop;
    this.frame = 0;
    this.ticks = 0;
  }
}
