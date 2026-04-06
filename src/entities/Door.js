import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_DOOR } from '../ecs/config.js';

export function createDoor({ gridX, gridY }) {
  const entity = { id: 'door' }; // only one door per level

  entity.transform   = new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT });
  entity.render      = new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_DOOR, spriteKey: 'DOOR' });
  entity.destroyable = new DestroyableComponent();

  return entity;
}
