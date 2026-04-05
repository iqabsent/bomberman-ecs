import { LEVEL } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { CollectibleComponent } from '../components/CollectibleComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { SoundComponent } from '../components/SoundComponent.js';

// Applies collected power-ups to the player and removes the entity.
// CollisionSystem is responsible for setting collectible.pickedUpBy.
export class CollectibleSystem {
  constructor() {
    this.name = 'collectible';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return;

    for (let i = gameState.powerups.length - 1; i >= 0; i--) {
      const entityId   = gameState.powerups[i];
      const collectible = engine.getComponent(entityId, CollectibleComponent);
      if (!collectible || !collectible.pickedUpBy) continue;

      const collectorId = collectible.pickedUpBy;
      const player     = engine.getComponent(collectorId, PlayerComponent);
      if (player) {
        player.pendingPowerup = collectible.type;
        const sound = engine.getComponent(collectorId, SoundComponent);
        if (sound) sound.queue.push('powerup');

        const levelPower = LEVEL[gameState.currentLevel % LEVEL.length].power;
        if (collectible.type === levelPower) gameState.levelPowerCollected = true;
      }

      gameState.powerups.splice(i, 1);
      engine.removeEntity(entityId);
    }
  }
}
