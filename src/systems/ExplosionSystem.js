import { TYPE } from '../ecs/config.js';
import { GAME_STATE, FLAME, FUSE, GRID_PLACEMENT } from '../components';

export class ExplosionSystem {
  constructor() {
    this.name = 'explosion';
  }

  apply(engine, dt) {

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    const expired = [];

    for (const flameId of gameState.flames) {
      const flame        = engine.getComponent(flameId, FLAME);
      const fuse         = engine.getComponent(flameId, FUSE);
      const flamePlacement = engine.getComponent(flameId, GRID_PLACEMENT);
      if (!flame || !fuse || !flamePlacement) continue;

      fuse.ticks -= dt;

      if (fuse.ticks <= 0) {
        expired.push(flameId);
      }
    }

    // Remove expired flames and clear their map flags
    for (const flameId of expired) {
      const flamePlacement = engine.getComponent(flameId, GRID_PLACEMENT);
      if (!flamePlacement) continue;

      const idx = gameState.flames.indexOf(flameId);
      if (idx > -1) gameState.flames.splice(idx, 1);

      // Only clear flag if no other flame still covers this cell
      const stillBurning = gameState.flames.some(id => {
        const gp = engine.getComponent(id, GRID_PLACEMENT);
        return gp && gp.gridX === flamePlacement.gridX && gp.gridY === flamePlacement.gridY;
      });
      if (!stillBurning && gameState.gameMap[flamePlacement.gridY]) {
        gameState.gameMap[flamePlacement.gridY][flamePlacement.gridX] &= ~TYPE.EXPLOSION;
      }

      engine.removeEntity(flameId);
    }
  }
}
