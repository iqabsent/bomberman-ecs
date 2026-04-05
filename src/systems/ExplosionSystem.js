import { TYPE } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { FlameComponent } from '../components/FlameComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';

export class ExplosionSystem {
  constructor() {
    this.name = 'explosion';
    this.lastTime = null;
  }

  apply(engine, time) {
    if (!this.lastTime) this.lastTime = time;
    const rawDt = (time - this.lastTime) / (1000 / 60);
    const dt = Math.min(rawDt, 3);
    this.lastTime = time;

    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return;

    const expired = [];

    for (const flameId of gameState.flames) {
      const flame = engine.getComponent(flameId, FlameComponent);
      if (!flame) continue;

      flame.fuseTicks -= dt;

      if (flame.fuseTicks <= 0) {
        expired.push(flameId);
        continue;
      }

      // Set burning on any destroyable entity occupying this flame cell
      for (const [id] of engine.entities.entries()) {
        const destroyable = engine.getComponent(id, DestroyableComponent);
        if (!destroyable || destroyable.burning) continue;
        const transform = engine.getComponent(id, TransformComponent);
        if (!transform || transform.gridX !== flame.gridX || transform.gridY !== flame.gridY) continue;

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
      const flame = engine.getComponent(flameId, FlameComponent);
      if (!flame) continue;

      const idx = gameState.flames.indexOf(flameId);
      if (idx > -1) gameState.flames.splice(idx, 1);

      // Only clear flag if no other flame still covers this cell
      const stillBurning = gameState.flames.some(id => {
        const f = engine.getComponent(id, FlameComponent);
        return f && f.gridX === flame.gridX && f.gridY === flame.gridY;
      });
      if (!stillBurning && gameState.gameMap[flame.gridY]) {
        gameState.gameMap[flame.gridY][flame.gridX] &= ~TYPE.EXPLOSION;
      }

      engine.removeEntity(flameId);
    }
  }
}
