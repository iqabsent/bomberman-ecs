import { LEVEL } from '../ecs/config.js';
import { GAME_STATE, COLLECTIBLE, PLAYER, SOUND } from '../components';

// Applies collected power-ups to the player and removes the entity.
// PlayerSystem is responsible for setting collectible.pickedUpBy.
export class CollectibleSystem {
  constructor() {
    this.name = 'collectible';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    for (let i = gameState.powerups.length - 1; i >= 0; i--) {
      const entityId   = gameState.powerups[i];
      const collectible = engine.getComponent(entityId, COLLECTIBLE);
      // TODO(events): query for PickedUp component on this entity instead (component-on-entity pattern)
      if (!collectible || !collectible.pickedUpBy) continue;

      const collectorId = collectible.pickedUpBy;
      const player     = engine.getComponent(collectorId, PLAYER);
      if (player) {
        // TODO(events): add PowerUpIntent component to player entity with power-up type as payload (component-on-entity pattern)
        player.pendingPowerup = collectible.type;
        engine.getSingleton(SOUND).queue.push('powerup');

        const levelPower = LEVEL[gameState.currentLevel % LEVEL.length].power;
        // TODO(events): create LevelPowerCollectedEvent event entity instead (event-entity pattern)
        if (collectible.type === levelPower) gameState.levelPowerCollected = true;
      }

      gameState.powerups.splice(i, 1);
      engine.removeEntity(entityId);
    }
  }
}
