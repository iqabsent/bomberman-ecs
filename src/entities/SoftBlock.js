import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT } from '../ecs/config.js';

let nextId = 1;

export function createSoftBlock(gridX, gridY) {
  const entity = { id: `softblock-${nextId++}` };
  entity.transform = new TransformComponent(gridX * BLOCK_WIDTH, gridY * BLOCK_HEIGHT);
  entity.render = new RenderComponent(null, BLOCK_WIDTH, BLOCK_HEIGHT, 1);
  entity.animation = new AnimationComponent(6);
  entity.animation.animationKey = 'SOFT_BLOCK';
  entity.animation.shouldAnimate = false; // static until hit by explosion
  entity.destroyable = new DestroyableComponent();
  return entity;
}
