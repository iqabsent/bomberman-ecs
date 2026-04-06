import { TYPE } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { FlameComponent } from '../components/FlameComponent.js';
import { FuseComponent } from '../components/FuseComponent.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';

export class ExplosionSystem {
  constructor() {
    this.name = 'explosion';
  }

  apply(engine, dt) {

    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return;

    const expired = [];

    for (const flameId of gameState.flames) {
      const flame        = engine.getComponent(flameId, FlameComponent);
      const fuse         = engine.getComponent(flameId, FuseComponent);
      const flamePlacement = engine.getComponent(flameId, GridPlacementComponent);
      if (!flame || !fuse || !flamePlacement) continue;

      fuse.ticks -= dt;

      if (fuse.ticks <= 0) {
        expired.push(flameId);
        continue;
      }

      // Set burning on any destroyable entity occupying this flame cell
      for (const [id] of engine.entities.entries()) {
        const destroyable = engine.getComponent(id, DestroyableComponent);
        if (!destroyable || destroyable.burning) continue;
        const entityPlacement = engine.getComponent(id, GridPlacementComponent);
        if (!entityPlacement || entityPlacement.gridX !== flamePlacement.gridX || entityPlacement.gridY !== flamePlacement.gridY) continue;

        // Respect invincibility, fireproof, and dying state
        const health  = engine.getComponent(id, HealthComponent);
        const player  = engine.getComponent(id, PlayerComponent);
        if (health && health.isDying) continue;
        if (player && player.invincibilityTimer > 0) continue;
        if (player && player.fireproof) continue;

        destroyable.burning = true;
      }
    }

    // Remove expired flames and clear their map flags
    for (const flameId of expired) {
      const flamePlacement = engine.getComponent(flameId, GridPlacementComponent);
      if (!flamePlacement) continue;

      const idx = gameState.flames.indexOf(flameId);
      if (idx > -1) gameState.flames.splice(idx, 1);

      // Only clear flag if no other flame still covers this cell
      const stillBurning = gameState.flames.some(id => {
        const gp = engine.getComponent(id, GridPlacementComponent);
        return gp && gp.gridX === flamePlacement.gridX && gp.gridY === flamePlacement.gridY;
      });
      if (!stillBurning && gameState.gameMap[flamePlacement.gridY]) {
        gameState.gameMap[flamePlacement.gridY][flamePlacement.gridX] &= ~TYPE.EXPLOSION;
      }

      engine.removeEntity(flameId);
    }
  }
}
