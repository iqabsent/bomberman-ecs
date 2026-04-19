import { BLOCK_WIDTH, BLOCK_HEIGHT, STATE, SPAWN, SPEED, MAX_BOMBS, MAX_YIELD, INVINCIBILITY_TIMER, TYPE, DAMAGE_TYPE, POWER } from '../ecs/config.js';
import { GRID_PLACEMENT, GAME_STATE, TRANSFORM, VELOCITY, ANIMATION, PLAYER, HEALTH, SOUND, COLLECTIBLE, COLLISION } from '../components';

export class PlayerSystem {
  constructor() {
    this.name = 'player';
  }

  apply(engine, dt) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    // Flag dying players for respawn — arriving from PLAYER_DIED with health.isDying still set
    if (gameState.currentState === STATE.LEVEL_START) {
      for (const id of gameState.players) {
        const player = engine.getComponent(id, PLAYER);
        const health = engine.getComponent(id, HEALTH);
        if (player && health && health.isDying) player.pendingSpawn = SPAWN.RESPAWN;
      }
    }

    // Process pending spawns regardless of game state — may be set during LOADING or LEVEL_START
    for (const id of gameState.players) {
      const player = engine.getComponent(id, PLAYER);
      if (!player || !player.pendingSpawn) continue;

      const transform     = engine.getComponent(id, TRANSFORM);
      const velocity      = engine.getComponent(id, VELOCITY);
      const anim          = engine.getComponent(id, ANIMATION);
      const health        = engine.getComponent(id, HEALTH);
      const gridPlacement = engine.getComponent(id, GRID_PLACEMENT);
      const collision     = engine.getComponent(id, COLLISION);
      PlayerSystem.spawnPlayer(player, transform, velocity, anim, health, gridPlacement, collision);
      if (player.pendingSpawn === SPAWN.GAME_SPAWN) {
        PlayerSystem.resetPlayerStats(player, collision);
        gameState.playerInvincible = false;
      }
      player.pendingSpawn = null;
    }

    if (gameState.currentState === STATE.LEVEL_CLEAR || gameState.currentState === STATE.PLAYER_DIED) {
      for (const id of gameState.players) {
        const velocity = engine.getComponent(id, VELOCITY);
        const anim     = engine.getComponent(id, ANIMATION);
        if (velocity) { velocity.vx = 0; velocity.vy = 0; }
        if (anim)     anim.shouldAnimate = false;
      }
    }

    if (gameState.currentState === STATE.PLAYING) {
      const { gameMap } = gameState;

      for (const id of gameState.players) {
        const player = engine.getComponent(id, PLAYER);
        if (!player) continue;

        const health    = engine.getComponent(id, HEALTH);
        const anim      = engine.getComponent(id, ANIMATION);
        const transform = engine.getComponent(id, TRANSFORM);
        const velocity  = engine.getComponent(id, VELOCITY);
        const collision = engine.getComponent(id, COLLISION);
        if (!health || !anim || !transform || !velocity) continue;

        if (player.pendingPowerup) {
          if (player.pendingPowerup === POWER.INVINCIBLE) gameState.playerInvincible = true;
          PlayerSystem.applyPowerup(player, collision, player.pendingPowerup);
          player.pendingPowerup = null;
        }

        // Tick invincibility down every frame regardless of explosions
        if (player.invincibilityTimer > 0) {
          player.invincibilityTimer -= dt * (1000 / 60);
          if (player.invincibilityTimer < 0) player.invincibilityTimer = 0;

          // Timer just expired this tick — swap animation set back and signal MusicSystem
          if (player.invincibilityTimer === 0) {
            anim.animationKey = anim.animationKey.replace('_I_', '_');
            anim.shouldAnimate = true; // force one tick so AnimationSystem registers the key change
            gameState.playerInvincible = false;
          }
        }

        // Maintain immunity flag — read when processing pendingDamage below
        health.immune = player.invincibilityTimer > 0 || player.fireproof;

        // Process pending damage events (set by CollisionSystem)
        for (const dmg of health.pendingDamage) {
          if (health.isDying) break;
          if (dmg === DAMAGE_TYPE.FIRE  && !health.immune)                health.isDying = true;
          if (dmg === DAMAGE_TYPE.ENEMY && player.invincibilityTimer <= 0) health.isDying = true;
        }
        health.pendingDamage = [];

        if (!health.isDying) {
          // Apply input direction to velocity and animation
          const inv = player.invincibilityTimer > 0;
          velocity.vx = player.inputDx * player.movementSpeed;
          velocity.vy = player.inputDy * player.movementSpeed;
          const moving = velocity.vx !== 0 || velocity.vy !== 0;
          anim.shouldAnimate = moving;
          if (moving) {
            anim.loop = true;
            if      (player.inputDy < 0) anim.animationKey = inv ? 'MAN_I_UP'    : 'MAN_UP';
            else if (player.inputDy > 0) anim.animationKey = inv ? 'MAN_I_DOWN'  : 'MAN_DOWN';
            else if (player.inputDx < 0) anim.animationKey = inv ? 'MAN_I_LEFT'  : 'MAN_LEFT';
            else if (player.inputDx > 0) anim.animationKey = inv ? 'MAN_I_RIGHT' : 'MAN_RIGHT';
            if (anim.frame === 1 && anim.ticks === 0) {
              engine.getSingleton(SOUND).queue.push(velocity.vx !== 0 ? 'step_lr' : 'step_ud');
            }
          }

          // Cell overlap checks — power-up pickup and door
          const gridPlacement = engine.getComponent(id, GRID_PLACEMENT);
          if (gridPlacement && gameMap) {
            const gridX = gridPlacement.gridX;
            const gridY = gridPlacement.gridY;
            const cell  = gameMap[gridY]?.[gridX];

            if (cell & TYPE.POWER) {
              const entityId = gameState.powerups.find(pid => {
                const gp = engine.getComponent(pid, GRID_PLACEMENT);
                return gp && gp.gridX === gridX && gp.gridY === gridY;
              });
              if (entityId) {
                const collectible = engine.getComponent(entityId, COLLECTIBLE);
                if (collectible && !collectible.pickedUpBy) {
                  collectible.pickedUpBy = id;
                  gameState.gameMap[gridY][gridX] &= ~TYPE.POWER;
                }
              }
            }

            if (cell & TYPE.DOOR && !gameState.enemies.some(eid => !engine.getComponent(eid, HEALTH)?.isDying)) {
              gameState.toLevelClearState();
            }
          }

          continue;
        }

        // First frame of death — kick off the animation
        if (!health.deathAnimStarted) {
          health.deathAnimStarted = true;
          velocity.vx = 0;
          velocity.vy = 0;
          anim.animationKey = 'MAN_DEATH';
          anim.loop = false;
          anim.shouldAnimate = true;
          engine.getSingleton(SOUND).queue.push('burn');
          continue;
        }

        // Still playing — wait for death animation to complete
        if (anim.shouldAnimate) continue;

        // Animation complete — handle death
        gameState.lives--;
        if (gameState.lives > 0) {
          velocity.vx = 0;
          velocity.vy = 0;
          // Leave health.isDying = true — PlayerSystem flags RESPAWN when LEVEL_START begins
          gameState.toPlayerDiedState();
        } else {
          // Game over — leave isDying true so input/collision stay disabled
          gameState.toGameOverState();
        }
      }

    }
  }

  static spawnPlayer(player, transform, velocity, anim, health, gridPlacement, collision) {
    if (!transform || !velocity || !anim) return;
    transform.x = BLOCK_WIDTH;
    transform.y = BLOCK_HEIGHT;
    if (gridPlacement) { gridPlacement.gridX = 1; gridPlacement.gridY = 1; }
    velocity.vx = 0;
    velocity.vy = 0;
    player.activeBombs = 0;
    if (health) { health.isDying = false; health.deathAnimStarted = false; health.immune = player.invincibilityTimer > 0 || player.fireproof; }
    anim.animationKey = player.invincibilityTimer > 0 ? 'MAN_I_DOWN' : 'MAN_DOWN';
    anim.loop = true;
    anim.shouldAnimate = false;
  }

  static applyPowerup(player, collision, type) {
    switch (type) {
      case POWER.FLAME:      player.bombYield = Math.min(player.bombYield + 1, MAX_YIELD); break;
      case POWER.BOMB:       player.maxBombs  = Math.min(player.maxBombs  + 1, MAX_BOMBS); break;
      case POWER.SPEED:      player.movementSpeed = SPEED.FAST; break;
      case POWER.DETONATE:   player.canDetonate = true; break;
      case POWER.PASS_BOMB:  if (collision) collision.canPass |= TYPE.BOMB; break;
      case POWER.PASS_WALL:  if (collision) collision.canPass |= TYPE.SOFT_BLOCK; break;
      case POWER.FIREPROOF:  player.fireproof = true; break;
      case POWER.INVINCIBLE: player.invincibilityTimer = INVINCIBILITY_TIMER; break;
    }
  }

  static resetPlayerStats(player, collision) {
    player.maxBombs = 1;
    player.bombYield = 1;
    player.activeBombs = 0;
    player.movementSpeed = SPEED.NORMAL;
    player.canDetonate = false;
    player.fireproof = false;
    player.invincibilityTimer = 0;
    if (collision) collision.canPass = 0;
  }
}
