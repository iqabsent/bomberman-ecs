import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { FlameComponent } from '../components/FlameComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT } from '../ecs/config.js';

// 6 frames total (4-frame symmetric expansion) × 6 ticks = 36 ticks lifetime
const EXPLO_LIFE_TICKS = 36;
const EXPLO_ANIM_TICKS_PER_FRAME = 6;

let nextId = 1;

export function createFlame(gridX, gridY, type) {
  const entity = { id: `flame-${nextId++}` };
  entity.transform = new TransformComponent(gridX * BLOCK_WIDTH, gridY * BLOCK_HEIGHT);
  entity.render = new RenderComponent(null, BLOCK_WIDTH, BLOCK_HEIGHT, 4);
  entity.animation = new AnimationComponent(EXPLO_ANIM_TICKS_PER_FRAME);
  entity.animation.setAnimation('EXPLO_' + type, false); // non-looping, plays once
  entity.animation.shouldAnimate = true;
  entity.flame = new FlameComponent(gridX, gridY, type, EXPLO_LIFE_TICKS);
  return entity;
}
