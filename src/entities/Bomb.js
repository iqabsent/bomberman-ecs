import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { BombComponent } from '../components/BombComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { SoundComponent } from '../components/SoundComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT } from '../ecs/config.js';

export function createBomb(gridX, gridY, bombYield, ownerId) {
  const entity = { id: `bomb-${gridX}-${gridY}` };

  entity.transform  = new TransformComponent(gridX * BLOCK_WIDTH, gridY * BLOCK_HEIGHT);
  entity.render     = new RenderComponent(null, BLOCK_WIDTH, BLOCK_HEIGHT, 3);
  // 18 ticks per frame — matches BombObject._ticks_per_frame in the original
  entity.animation  = new AnimationComponent(18);
  entity.animation.animationKey = 'BOMB';
  entity.animation.shouldAnimate = true;
  entity.bomb        = new BombComponent(gridX, gridY, bombYield, ownerId);
  entity.destroyable = new DestroyableComponent();
  entity.sound       = new SoundComponent();

  return entity;
}
