import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { MovableComponent } from '../components/MovableComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_PLAYER, ANIM_TICKS_PER_FRAME_PLAYER } from '../ecs/config.js';

export function createPlayer(engine) {
  const id = 'player';

  engine.addComponent(id, new TransformComponent({ x: BLOCK_WIDTH, y: BLOCK_HEIGHT }));
  engine.addComponent(id, new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_PLAYER }));
  engine.addComponent(id, new VelocityComponent());
  engine.addComponent(id, new AnimationComponent({ ticksPerFrame: ANIM_TICKS_PER_FRAME_PLAYER, animationKey: 'MAN_DOWN' }));
  engine.addComponent(id, new PlayerComponent());
  engine.addComponent(id, new DestroyableComponent());
  engine.addComponent(id, new MovableComponent());
  engine.addComponent(id, new GridPlacementComponent({ gridX: 1, gridY: 1 }));

  return id;
}
