import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_ENEMY, ANIM_TICKS_PER_FRAME_ENEMY } from '../ecs/config.js';

let nextId = 1;

export function createEnemy(engine, { type, stats, gridX, gridY }) {
  const id = `enemy-${nextId++}`;

  engine.addComponent(id, new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT }));
  engine.addComponent(id, new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_ENEMY }));
  engine.addComponent(id, new AnimationComponent({ ticksPerFrame: ANIM_TICKS_PER_FRAME_ENEMY, animationKey: type + '_LD', shouldAnimate: true }));
  engine.addComponent(id, new EnemyComponent({ type, stats }));
  engine.addComponent(id, new HealthComponent());
  engine.addComponent(id, new CollisionComponent({ canPass: stats.can_pass }));
  engine.addComponent(id, new VelocityComponent());
  engine.addComponent(id, new GridPlacementComponent({ gridX, gridY }));
  engine.addComponent(id, new DestroyableComponent());

  return id;
}
