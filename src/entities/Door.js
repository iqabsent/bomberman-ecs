import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_DOOR } from '../ecs/config.js';

export function createDoor(engine, { gridX, gridY }) {
  const id = 'door'; // only one door per level

  engine.addComponent(id, new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT }));
  engine.addComponent(id, new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_DOOR, spriteKey: 'DOOR' }));
  engine.addComponent(id, new GridPlacementComponent({ gridX, gridY }));
  engine.addComponent(id, new DestroyableComponent({ shouldPersist: true, managed: true }));

  return id;
}
