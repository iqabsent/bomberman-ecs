import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { SoundComponent } from '../components/SoundComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT } from '../ecs/config.js';

let nextId = 1;

export function createPlayer() {
  const entity = { id: `player-${nextId++}` };

  entity.transform   = new TransformComponent(BLOCK_WIDTH, BLOCK_HEIGHT);
  entity.render      = new RenderComponent(null, BLOCK_WIDTH, BLOCK_HEIGHT, 6);
  entity.velocity    = new VelocityComponent(0, 0);
  // 6 ticks per frame — matches PlayerObject._ticks_per_frame in the original
  entity.animation   = new AnimationComponent(6);
  entity.animation.animationKey = 'MAN_DOWN';
  entity.player      = new PlayerComponent();
  entity.health      = new HealthComponent();
  entity.collision   = new CollisionComponent();
  entity.destroyable = new DestroyableComponent();
  entity.sound       = new SoundComponent();

  return entity;
}
