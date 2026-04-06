import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { CollectibleComponent } from '../components/CollectibleComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_POWER_UP } from '../ecs/config.js';

let nextId = 1;

export function createPowerUp({ gridX, gridY, type }) {
  const entity = { id: `powerup-${nextId++}` };

  entity.transform   = new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT });
  entity.render      = new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_POWER_UP, spriteKey: 'POWER_' + type });
  entity.collectible = new CollectibleComponent({ type });
  entity.gridPlacement = new GridPlacementComponent({ gridX, gridY });
  entity.destroyable   = new DestroyableComponent();

  return entity;
}
