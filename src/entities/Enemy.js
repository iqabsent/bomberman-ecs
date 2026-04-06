import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { AIComponent } from '../components/AIComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_ENEMY, ANIM_TICKS_PER_FRAME_ENEMY } from '../ecs/config.js';

let nextId = 1;

export function createEnemy({ type, stats, gridX, gridY }) {
  const entity = { id: `enemy-${nextId++}` };

  entity.transform   = new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT });
  entity.render      = new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_ENEMY });
  entity.animation   = new AnimationComponent({ ticksPerFrame: ANIM_TICKS_PER_FRAME_ENEMY, animationKey: type + '_LD', shouldAnimate: true });
  entity.ai          = new AIComponent({ stats });
  entity.enemy       = new EnemyComponent({ type, stats });
  entity.health      = new HealthComponent();
  entity.destroyable = new DestroyableComponent();

  return entity;
}
