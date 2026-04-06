import { TransformComponent } from '../components/TransformComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { BombComponent } from '../components/BombComponent.js';
import { FuseComponent } from '../components/FuseComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { SoundComponent } from '../components/SoundComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { BLOCK_WIDTH, BLOCK_HEIGHT, RENDER_LAYER_BOMB, ANIM_TICKS_PER_FRAME_BOMB } from '../ecs/config.js';

export function createBomb({ gridX, gridY, bombYield, ownerId }) {
  const entity = { id: `bomb-${gridX}-${gridY}` };

  entity.transform  = new TransformComponent({ x: gridX * BLOCK_WIDTH, y: gridY * BLOCK_HEIGHT });
  entity.render     = new RenderComponent({ width: BLOCK_WIDTH, height: BLOCK_HEIGHT, layer: RENDER_LAYER_BOMB });
  entity.animation  = new AnimationComponent({ ticksPerFrame: ANIM_TICKS_PER_FRAME_BOMB, animationKey: 'BOMB', shouldAnimate: true });
  entity.bomb        = new BombComponent({ bombYield, ownerId });
  entity.gridPlacement = new GridPlacementComponent({ gridX, gridY });
  entity.fuse          = new FuseComponent();
  entity.destroyable = new DestroyableComponent();
  entity.sound       = new SoundComponent();

  return entity;
}
