import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_SOFT_BLOCK, ANIM_TICKS_PER_FRAME_SOFT_BLOCK } from '../ecs/config.js';
import { SoftBlockComponent } from '../components/SoftBlockComponent.js';
import { EVENT } from '../ecs/events.js';

let nextId = 1;

export function createSoftBlock(engine, { gridX, gridY }) {
  const id = `softblock-${nextId++}`;

  engine.addComponent(id, new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT }));
  engine.addComponent(id, new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_SOFT_BLOCK }));
  engine.addComponent(id, new AnimationComponent({ ticksPerFrame: ANIM_TICKS_PER_FRAME_SOFT_BLOCK, animationKey: 'SOFT_BLOCK' }));
  engine.addComponent(id, new GridPlacementComponent({ gridX, gridY }));
  engine.addComponent(id, new DestroyableComponent({ onTriggerEvent: EVENT.SOFT_BLOCK_DESTROYED }));
  engine.addComponent(id, new SoftBlockComponent());

  return id;
}
