import { BOMB_FUSE_TICKS } from '../ecs/config.js';

export class FuseComponent {
  constructor({ ticks = BOMB_FUSE_TICKS } = {}) {
    this.ticks = ticks;
  }
}
