import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { FlameComponent } from '../components/FlameComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import {
  BLOCK_WIDTH, BLOCK_HEIGHT,
  RENDER_LAYER_EXPLOSION, ANIM_TICKS_PER_FRAME_EXPLOSION
} from '../ecs/config.js';

let nextId = 1;

export function createFlame(engine, { gridX, gridY, type }) {
  const id = `flame-${nextId++}`;

  engine.addComponent(id, new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT }));
  engine.addComponent(id, new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_EXPLOSION }));
  engine.addComponent(id, new AnimationComponent({ ticksPerFrame: ANIM_TICKS_PER_FRAME_EXPLOSION, animationKey: 'EXPLO_' + type, loop: false, shouldAnimate: true }));
  engine.addComponent(id, new FlameComponent({ type }));
  engine.addComponent(id, new GridPlacementComponent({ gridX, gridY }));

  return id;
}
