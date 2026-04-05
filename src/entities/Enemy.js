import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { AIComponent } from '../components/AIComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT } from '../ecs/config.js';

let nextId = 1;

export function createEnemy(type, stats, gridX, gridY) {
  const entity = { id: `enemy-${nextId++}` };

  entity.transform   = new TransformComponent(gridX * BLOCK_WIDTH, gridY * BLOCK_HEIGHT);
  entity.render      = new RenderComponent(null, BLOCK_WIDTH, BLOCK_HEIGHT, 5);
  // 18 ticks per frame — matches EnemyObject._ticks_per_frame in the original
  entity.animation   = new AnimationComponent(18);
  entity.animation.setAnimation(type + '_LD');
  entity.animation.shouldAnimate = true;
  entity.ai          = new AIComponent(stats);
  entity.enemy       = new EnemyComponent(type, stats);
  entity.health      = new HealthComponent();
  entity.destroyable = new DestroyableComponent();

  return entity;
}
