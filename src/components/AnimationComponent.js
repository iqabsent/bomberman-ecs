export class AnimationComponent {
  constructor(ticksPerFrame = 6) {
    this.animationKey = null;
    this._prevAnimationKey = null;
    this.frame = 0;
    this.ticks = 0;
    this.ticksPerFrame = ticksPerFrame;
    this.loop = true;
    this.shouldAnimate = false;
  }
}
