import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { SoundComponent } from '../components/SoundComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_PLAYER, ANIM_TICKS_PER_FRAME_PLAYER } from '../ecs/config.js';

let nextId = 1;

export function createPlayer() {
  const entity = { id: `player-${nextId++}` };

  entity.transform   = new TransformComponent({ x: BLOCK_WIDTH, y: BLOCK_HEIGHT });
  entity.render      = new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_PLAYER });
  entity.velocity    = new VelocityComponent();
  entity.animation   = new AnimationComponent({ ticksPerFrame: ANIM_TICKS_PER_FRAME_PLAYER, animationKey: 'MAN_DOWN' });
  entity.player      = new PlayerComponent();
  entity.health      = new HealthComponent();
  entity.gridPlacement = new GridPlacementComponent({ gridX: 1, gridY: 1 });
  entity.collision   = new CollisionComponent();
  entity.destroyable = new DestroyableComponent();
  entity.sound       = new SoundComponent();

  return entity;
}
