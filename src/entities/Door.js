import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT } from '../ecs/config.js';

export function createDoor(gridX, gridY) {
  const entity = { id: 'door' }; // only one door per level

  entity.transform   = new TransformComponent(gridX * BLOCK_WIDTH, gridY * BLOCK_HEIGHT);
  entity.render      = new RenderComponent(null, BLOCK_WIDTH, BLOCK_HEIGHT, 2, 'DOOR');
  entity.destroyable = new DestroyableComponent();

  return entity;
}
