// Matches original: BOMB_FUSE_TIME(9) * bomb ticks_per_frame(18) = 162 dt-ticks
const FUSE_TICKS = 162;
// Matches original: BombObject.burn() queues 'explode' with 0.5 frames * 18 ticks-per-frame = 9 ticks
export const CHAIN_DELAY_TICKS = 9;

export class BombComponent {
  constructor(gridX, gridY, bombYield, ownerId) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.fuseTicks = FUSE_TICKS;
    this.yield = bombYield;
    this.ownerId = ownerId;
    this.chainDelayTicks = 0; // > 0 while waiting to chain-detonate
  }
}
