import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { BombComponent } from '../components/BombComponent.js';
import { FuseComponent } from '../components/FuseComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_BOMB, ANIM_TICKS_PER_FRAME_BOMB } from '../ecs/config.js';

export function createBomb(engine, { gridX, gridY, bombYield, ownerId }) {
  const id = `bomb-${gridX}-${gridY}`;

  engine.addComponent(id, new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT }));
  engine.addComponent(id, new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_BOMB }));
  engine.addComponent(id, new AnimationComponent({ ticksPerFrame: ANIM_TICKS_PER_FRAME_BOMB, animationKey: 'BOMB', shouldAnimate: true }));
  engine.addComponent(id, new BombComponent({ bombYield, ownerId }));
  engine.addComponent(id, new GridPlacementComponent({ gridX, gridY }));
  engine.addComponent(id, new FuseComponent());
  engine.addComponent(id, new DestroyableComponent());

  return id;
}
