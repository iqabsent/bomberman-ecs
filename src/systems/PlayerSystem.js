import { BLOCK_WIDTH, BLOCK_HEIGHT, STATE, SPAWN, SPEED, MAX_BOMBS, MAX_YIELD, INVINCIBILITY_TIMER } from '../ecs/config.js';
import { GridPlacementComponent } from '../components/GridPlacementComponent.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { SoundComponent } from '../components/SoundComponent.js';

export class PlayerSystem {
  constructor() {
    this.name = 'player';
  }

  apply(engine, dt) {
    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return;

    // Process pending spawns regardless of game state — may be set during LOADING or LEVEL_START
    for (const [id] of engine.entities.entries()) {
      const player = engine.getComponent(id, PlayerComponent);
      if (!player || !player.pendingSpawn) continue;

      const transform     = engine.getComponent(id, TransformComponent);
      const velocity      = engine.getComponent(id, VelocityComponent);
      const anim          = engine.getComponent(id, AnimationComponent);
      const health        = engine.getComponent(id, HealthComponent);
      const gridPlacement = engine.getComponent(id, GridPlacementComponent);
      PlayerSystem.spawnPlayer(player, transform, velocity, anim, health, gridPlacement);
      if (player.pendingSpawn === SPAWN.GAME_SPAWN) PlayerSystem.resetPlayerStats(player);
      player.pendingSpawn = null;
    }

    if (gameState.currentState === STATE.LEVEL_CLEAR || gameState.currentState === STATE.PLAYER_DIED) {
      for (const [id] of engine.entities.entries()) {
        const player = engine.getComponent(id, PlayerComponent);
        if (!player) continue;
        const velocity = engine.getComponent(id, VelocityComponent);
        const anim     = engine.getComponent(id, AnimationComponent);
        if (velocity) { velocity.vx = 0; velocity.vy = 0; }
        if (anim)     anim.shouldAnimate = false;
      }
    }

    if (gameState.currentState === STATE.PLAYING) {
      for (const [id] of engine.entities.entries()) {
        const player = engine.getComponent(id, PlayerComponent);
        if (!player) continue;

        if (player.pendingPowerup) {
          PlayerSystem.applyPowerup(player, player.pendingPowerup);
          player.pendingPowerup = null;
        }

        const health    = engine.getComponent(id, HealthComponent);
        const anim      = engine.getComponent(id, AnimationComponent);
        const transform = engine.getComponent(id, TransformComponent);
        const velocity  = engine.getComponent(id, VelocityComponent);
        if (!health || !anim || !transform || !velocity) continue;

        // Tick invincibility down every frame regardless of explosions
        if (player.invincibilityTimer > 0) {
          player.invincibilityTimer -= dt * (1000 / 60);
          if (player.invincibilityTimer < 0) player.invincibilityTimer = 0;

          // Swap back to normal animation set the moment invincibility expires
          if (player.invincibilityTimer === 0 && anim.animationKey?.includes('_I_')) {
            anim.animationKey = anim.animationKey.replace('_I_', '_');
            anim.shouldAnimate = true; // force one tick so AnimationSystem registers the key change
          }
        }

        // Translate destroyable.burning → health.isDying
        const destroyable = engine.getComponent(id, DestroyableComponent);
        if (destroyable && destroyable.burning && !health.isDying) {
          health.isDying = true;
          destroyable.burning = false;
        }

        if (!health.isDying) continue;

        // First frame of death — kick off the animation
        if (!health.deathAnimStarted) {
          health.deathAnimStarted = true;
          velocity.vx = 0;
          velocity.vy = 0;
          anim.animationKey = 'MAN_DEATH';
          anim.loop = false;
          anim.shouldAnimate = true;
          const sound = engine.getComponent(id, SoundComponent);
          if (sound) sound.queue.push('burn');
          continue;
        }

        // Still playing — wait for death animation to complete
        if (anim.shouldAnimate) continue;

        // Animation complete — handle death
        gameState.lives--;
        if (gameState.lives > 0) {
          velocity.vx = 0;
          velocity.vy = 0;
          // Leave health.isDying = true — LevelSystem flags RESPAWN when LEVEL_START begins
          gameState.toPlayerDiedState();
        } else {
          // Game over — leave isDying true so input/collision stay disabled
          gameState.toGameOverState();
        }
      }
    }
  }

  static spawnPlayer(player, transform, velocity, anim, health, gridPlacement) {
    if (!transform || !velocity || !anim) return;
    transform.x = BLOCK_WIDTH;
    transform.y = BLOCK_HEIGHT;
    if (gridPlacement) { gridPlacement.gridX = 1; gridPlacement.gridY = 1; }
    velocity.vx = 0;
    velocity.vy = 0;
    player.activeBombs = 0;
    if (health) { health.isDying = false; health.deathAnimStarted = false; }
    anim.animationKey = player.invincibilityTimer > 0 ? 'MAN_I_DOWN' : 'MAN_DOWN';
    anim.loop = true;
    anim.shouldAnimate = false;
  }

  static applyPowerup(player, type) {
    switch (type) {
      case 'FLAME':      player.bombYield = Math.min(player.bombYield + 1, MAX_YIELD); break;
      case 'BOMB':       player.maxBombs  = Math.min(player.maxBombs  + 1, MAX_BOMBS); break;
      case 'SPEED':      player.movementSpeed = SPEED.FAST; break;
      case 'DETONATE':   player.canDetonate = true; break;
      case 'PASS_BOMB':  player.canPassBomb = true; break;
      case 'PASS_WALL':  player.canPassWall = true; break;
      case 'FIREPROOF':  player.fireproof = true; break;
      case 'INVINCIBLE': player.invincibilityTimer = INVINCIBILITY_TIMER; break;
    }
  }

  static resetPlayerStats(player) {
    player.maxBombs = 1;
    player.bombYield = 1;
    player.activeBombs = 0;
    player.movementSpeed = SPEED.NORMAL;
    player.canDetonate = false;
    player.canPassBomb = false;
    player.canPassWall = false;
    player.fireproof = false;
    player.invincibilityTimer = 0;
  }
}
