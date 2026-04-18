import {
  BLOCK_WIDTH, BLOCK_HEIGHT, MAP_WIDTH, MAP_HEIGHT,
  TYPE, DIRECTIONS, ENEMY, LEVEL, STATE, DESTROY
} from '../ecs/config.js';
import { GAME_STATE, TRANSFORM, ANIMATION, RENDER, ENEMY as ENEMY_C, HEALTH, VELOCITY, COLLISION, DESTROYABLE, GRID_PLACEMENT, SOUND } from '../components';
import { createEnemy as createEnemyEntity } from '../entities/Enemy.js';

// Ticks before death animation starts — original: queue('startDeathAnimation', 5) * 18
const DEATH_WAIT_TICKS = 90;

export class EnemySystem {
  constructor() {
    this.name = 'enemy';
  }

  apply(engine, dt) {

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    if (gameState.currentState === STATE.LOADING && gameState.enemyLoading && !gameState.mapLoading) {
      const levelData = LEVEL[gameState.currentLevel % LEVEL.length];
      for (const [type, count] of Object.entries(levelData.enemies)) {
        const stats = ENEMY[type];
        if (!stats) continue;
        for (let i = 0; i < count; i++) {
          const spawn = EnemySystem.findSpawnPoint(gameState.gameMap, stats.spawn_distance);
          if (!spawn) continue;
          const id = EnemySystem.createEnemy(type, stats, spawn.gridX, spawn.gridY, engine);
          gameState.enemies.push(id);
        }
      }
      gameState.enemyLoading = false;
      return;
    }

    if (gameState.currentState === STATE.PLAYING || gameState.currentState === STATE.LEVEL_CLEAR) {
      for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const entityId    = gameState.enemies[i];
        const destroyable = engine.getComponent(entityId, DESTROYABLE);
        if (destroyable?.destroyState === DESTROY.DESTROYED) {
          gameState.enemies.splice(i, 1);
          engine.removeEntity(entityId);
        }
      }
    }

    if (gameState.currentState === STATE.PLAYING) {
      // Door burn — spawn enemies once flames have cleared the door cell
      if (gameState.pendingEnemySpawnDoor) {
        const { gridX, gridY, enemyType } = gameState.pendingEnemySpawnDoor;
        const flamesOnCell = gameState.flames.some(id => {
          const gp = engine.getComponent(id, GRID_PLACEMENT);
          return gp && gp.gridX === gridX && gp.gridY === gridY;
        });
        if (!flamesOnCell) {
          const stats = ENEMY[enemyType];
          if (stats) {
            for (let j = 0; j < 8; j++) {
              const id = EnemySystem.createEnemy(enemyType, stats, gridX, gridY, engine);
              gameState.enemies.push(id);
            }
          }
          gameState.pendingEnemySpawnDoor = null;
        }
      }

      // Timer expiry — spawn PONTANs at random clear cells
      if (gameState.pendingEnemySpawnTimer) {
        const stats = ENEMY['PONTAN'];
        for (let i = 0; i < 5; i++) {
          const spawn = EnemySystem.findSpawnPoint(gameState.gameMap, 0);
          if (spawn) {
            const id = EnemySystem.createEnemy('PONTAN', stats, spawn.gridX, spawn.gridY, engine);
            gameState.enemies.push(id);
          }
        }
        gameState.pendingEnemySpawnTimer = false;
      }

      // Gather player grid positions for collision checks
      const playerCells = [];
      for (const id of gameState.players) {
        const gridPlacement = engine.getComponent(id, GRID_PLACEMENT);
        const health        = engine.getComponent(id, HEALTH);
        if (gridPlacement && health) {
          playerCells.push({ id, gridX: gridPlacement.gridX, gridY: gridPlacement.gridY, health });
        }
      }

      for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const entityId     = gameState.enemies[i];
        const enemy        = engine.getComponent(entityId, ENEMY_C);
        const health       = engine.getComponent(entityId, HEALTH);
        if (!enemy || !health || health.isDying) continue;

        const transform     = engine.getComponent(entityId, TRANSFORM);
        const gridPlacement = engine.getComponent(entityId, GRID_PLACEMENT);
        const anim          = engine.getComponent(entityId, ANIMATION);
        const render        = engine.getComponent(entityId, RENDER);
        const destroyable   = engine.getComponent(entityId, DESTROYABLE);

        // Check explosion collision
        const mapCell = gameState.gameMap[gridPlacement.gridY] && gameState.gameMap[gridPlacement.gridY][gridPlacement.gridX];
        if (mapCell & TYPE.EXPLOSION) {
          this.killEnemy(enemy, health, anim, render, destroyable, gameState, engine);
          continue;
        }

        // Check player collision — PlayerSystem resolves death (immunity guard lives there)
        for (const pc of playerCells) {
          if (pc.gridX === gridPlacement.gridX && pc.gridY === gridPlacement.gridY && !pc.health.isDying) {
            gameState.pendingPlayerDeath = pc.id;
          }
        }

        const velocity  = engine.getComponent(entityId, VELOCITY);
        const collision = engine.getComponent(entityId, COLLISION);

        if (collision.blocked) {
          enemy.speed = 0;
          enemy.recentlyActed = false;
        }

        this.updateAI(enemy, transform, gridPlacement, gameState, dt, anim, velocity, collision);
      }
    }
  }

  updateAI(enemy, transform, gridPlacement, gameState, dt, anim, velocity, collision) {
    if (enemy.recentlyActed) {
      enemy.debounceLeft -= dt;
      if (enemy.debounceLeft <= 0) enemy.recentlyActed = false;
    }

    const cellX = gridPlacement.gridX * BLOCK_WIDTH;
    const cellY = gridPlacement.gridY * BLOCK_HEIGHT;
    const aligned = Math.abs((cellX - transform.x) + (cellY - transform.y)) <= enemy.speed;

    const shouldAct = !enemy.speed
      || (!enemy.recentlyActed && aligned && Math.random() < enemy.actionFrequency);

    if (shouldAct) {
      this.pickDirection(enemy, velocity, collision, gridPlacement, gameState, anim);
      enemy.recentlyActed = true;
      enemy.debounceLeft = enemy.framesBetweenActions;
    }
  }

  pickDirection(enemy, velocity, collision, gridPlacement, gameState, anim) {
    const options = [];
    for (const [dx, dy] of DIRECTIONS) {
      const gx = gridPlacement.gridX + dx;
      const gy = gridPlacement.gridY + dy;
      if (gx < 0 || gx >= MAP_WIDTH || gy < 0 || gy >= MAP_HEIGHT) continue;
      const cell = gameState.gameMap[gy]?.[gx];
      if (cell & TYPE.HARD_BLOCK) continue;
      if (cell & TYPE.SOFT_BLOCK && !(collision.canPass & TYPE.SOFT_BLOCK)) continue;
      if (cell & TYPE.BOMB) continue;
      options.push([dx, dy]);
    }

    if (!options.length) {
      enemy.speed = 0;
      velocity.vx = 0;
      velocity.vy = 0;
      return;
    }

    const [dx, dy] = options[Math.floor(Math.random() * options.length)];
    enemy.speed = ENEMY[enemy.type].movement_speed;
    velocity.vx = dx * enemy.speed;
    velocity.vy = dy * enemy.speed;

    anim.animationKey = (dx < 0 || dy > 0) ? enemy.type + '_LD' : enemy.type + '_RU';
    anim.loop = true;
  }

  killEnemy(enemy, health, anim, render, destroyable, gameState, engine) {
    health.isDying = true;
    destroyable.destroyState = DESTROY.DESTROYING;
    render.sprite = null;
    render.spriteKey = enemy.type + '_DEATH';
    anim.animationKey = 'ENEMY_DEATH';
    anim.loop = false;
    anim.delay = DEATH_WAIT_TICKS;

    gameState.score += enemy.points;

    if (!gameState.enemies.some(id => !engine.getComponent(id, HEALTH)?.isDying)) {
      engine.getSingleton(SOUND).queue.push('pause');
    }
  }

  static findSpawnPoint(gameMap, minDist) {
    const candidates = [];
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        if (x + y < minDist) continue;
        if (gameMap[y][x] & TYPE.PASSABLE && !(gameMap[y][x] & ~TYPE.PASSABLE)) {
          candidates.push({ gridX: x, gridY: y });
        }
      }
    }
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  static createEnemy(type, stats, gridX, gridY, engine) {
    return createEnemyEntity(engine, { type, stats, gridX, gridY });
  }
}
