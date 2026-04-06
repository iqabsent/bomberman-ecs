import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { FlameComponent } from '../components/FlameComponent.js';
import {
  BLOCK_WIDTH, BLOCK_HEIGHT,
  RENDER_LAYER_EXPLOSION, ANIM_TICKS_PER_FRAME_EXPLOSION, EXPLOSION_LIFETIME_TICKS
} from '../ecs/config.js';

let nextId = 1;

export function createFlame({ gridX, gridY, type }) {
  const entity = { id: `flame-${nextId++}` };
  entity.transform = new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT });
  entity.render = new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_EXPLOSION });
  entity.animation = new AnimationComponent({ ticksPerFrame: ANIM_TICKS_PER_FRAME_EXPLOSION });
  entity.animation.animationKey = 'EXPLO_' + type;
  entity.animation.loop = false; // non-looping, plays once
  entity.animation.shouldAnimate = true;
  entity.flame = new FlameComponent({ gridX, gridY, type, fuseTicks: EXPLOSION_LIFETIME_TICKS });
  return entity;
}
