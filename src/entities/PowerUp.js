import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { CollectibleComponent } from '../components/CollectibleComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT } from '../ecs/config.js';

let nextId = 1;

export function createPowerUp(gridX, gridY, type) {
  const entity = { id: `powerup-${nextId++}` };

  entity.transform   = new TransformComponent(gridX * BLOCK_WIDTH, gridY * BLOCK_HEIGHT);
  entity.render      = new RenderComponent(null, BLOCK_WIDTH, BLOCK_HEIGHT, 2, 'POWER_' + type);
  entity.collectible = new CollectibleComponent(type);
  entity.destroyable = new DestroyableComponent();

  return entity;
}
