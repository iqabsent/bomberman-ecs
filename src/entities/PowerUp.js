import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { CollectibleComponent } from '../components/CollectibleComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_POWER_UP, TYPE } from '../ecs/config.js';
import { EVENT } from '../ecs/events.js';

export function createPowerUp(engine, { gridX, gridY, type }) {
  const id = 'powerup';

  engine.addComponent(id, new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT }));
  engine.addComponent(id, new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_POWER_UP, spriteKey: 'POWER_' + type }));
  engine.addComponent(id, new CollectibleComponent({ type }));
  engine.addComponent(id, new GridPlacementComponent({ gridX, gridY }));
  engine.addComponent(id, new DestroyableComponent({ mapType: TYPE.POWER, onDestroyedEvent: EVENT.POWERUP_DESTROYED }));

  return id;
}
