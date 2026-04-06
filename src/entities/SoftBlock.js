import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_SOFT_BLOCK, ANIM_TICKS_PER_FRAME_SOFT_BLOCK } from '../ecs/config.js';

let nextId = 1;

export function createSoftBlock({ gridX, gridY }) {
  const entity = { id: `softblock-${nextId++}` };
  entity.transform = new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT });
  entity.render = new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_SOFT_BLOCK });
  entity.animation = new AnimationComponent({ ticksPerFrame: ANIM_TICKS_PER_FRAME_SOFT_BLOCK });
  entity.animation.animationKey = 'SOFT_BLOCK';
  entity.animation.shouldAnimate = false; // static until hit by explosion
  entity.destroyable = new DestroyableComponent();
  return entity;
}
