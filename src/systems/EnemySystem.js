import {
  BLOCK_WIDTH, BLOCK_HEIGHT, MAP_WIDTH, MAP_HEIGHT,
  TYPE, DIRECTIONS, ENEMY, LEVEL, STATE
} from '../ecs/config.js';
import { GAME_STATE, TRANSFORM, ANIMATION, RENDER, ENEMY as ENEMY_C, AI, HEALTH, PLAYER, GRID_PLACEMENT, SOUND } from '../components';
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
      this.advanceDeathAnimations(engine, gameState, dt);
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
        const player        = engine.getComponent(id, PLAYER);
        if (gridPlacement && health && player) {
          playerCells.push({ gridX: gridPlacement.gridX, gridY: gridPlacement.gridY, health, player });
        }
      }

      for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const entityId     = gameState.enemies[i];
        const enemy        = engine.getComponent(entityId, ENEMY_C);
        const health       = engine.getComponent(entityId, HEALTH);
        if (!enemy || !health || health.isDying) continue;

        const transform     = engine.getComponent(entityId, TRANSFORM);
        const gridPlacement = engine.getComponent(entityId, GRID_PLACEMENT);
        const ai            = engine.getComponent(entityId, AI);
        const anim          = engine.getComponent(entityId, ANIMATION);
        const render        = engine.getComponent(entityId, RENDER);

        // Check explosion collision
        const mapCell = gameState.gameMap[gridPlacement.gridY] && gameState.gameMap[gridPlacement.gridY][gridPlacement.gridX];
        if (mapCell & TYPE.EXPLOSION) {
          this.killEnemy(enemy, health, anim, render, gameState, i, engine, entityId);
          continue;
        }

        // Check player collision
        for (const pc of playerCells) {
          if (pc.gridX === gridPlacement.gridX && pc.gridY === gridPlacement.gridY) {
            if (!(pc.player && pc.player.invincibilityTimer) && !pc.health.isDying) {
              pc.health.isDying = true;
            }
          }
        }

        // AI — decide direction
        this.updateAI(enemy, ai, transform, gridPlacement, gameState, dt, anim);

        // Move
        this.moveEnemy(ai, transform, gridPlacement, gameState, dt);
      }
    }
  }

  updateAI(enemy, ai, transform, gridPlacement, gameState, dt, anim) {
    if (ai.recentlyActed) {
      ai.debounceLeft -= dt;
      if (ai.debounceLeft <= 0) ai.recentlyActed = false;
    }

    const cellX = gridPlacement.gridX * BLOCK_WIDTH;
    const cellY = gridPlacement.gridY * BLOCK_HEIGHT;
    const aligned = Math.abs((cellX - transform.x) + (cellY - transform.y)) <= ai.speed;

    const shouldAct = !ai.speed
      || (!ai.recentlyActed && aligned && Math.random() < ai.actionFrequency);

    if (shouldAct) {
      this.pickDirection(enemy, ai, gridPlacement, gameState, anim);
      ai.recentlyActed = true;
      ai.debounceLeft = ai.framesBetweenActions;
    }
  }

  pickDirection(enemy, ai, gridPlacement, gameState, anim) {
    const options = [];
    for (const [dx, dy] of DIRECTIONS) {
      if (!this.isCellBlocked(gridPlacement.gridX + dx, gridPlacement.gridY + dy, ai, gameState)) {
        options.push([dx, dy]);
      }
    }

    if (!options.length) {
      ai.dirX = 0;
      ai.dirY = 0;
      ai.speed = 0;
      return;
    }

    const [dx, dy] = options[Math.floor(Math.random() * options.length)];
    ai.dirX = dx;
    ai.dirY = dy;
    ai.speed = ENEMY[enemy.type].movement_speed;

    anim.animationKey = (dx < 0 || dy > 0) ? enemy.type + '_LD' : enemy.type + '_RU';
    anim.loop = true;
  }

  moveEnemy(ai, transform, gridPlacement, gameState, dt) {
    if (!ai.dirX && !ai.dirY) return;

    const delta = ai.speed * dt;
    const cellX = gridPlacement.gridX * BLOCK_WIDTH;
    const cellY = gridPlacement.gridY * BLOCK_HEIGHT;

    if (ai.dirX !== 0) {
      const errY = cellY - transform.y;
      const corrY = errY !== 0 ? Math.sign(errY) * Math.min(Math.abs(errY), delta) : 0;

      const tgx = gridPlacement.gridX + ai.dirX;
      if (this.isCellBlocked(tgx, gridPlacement.gridY, ai, gameState)) {
        const targetCellX = tgx * BLOCK_WIDTH;
        if (Math.abs(transform.x + ai.dirX * delta - targetCellX) < BLOCK_WIDTH) {
          transform.x = cellX;
          gridPlacement.gridX = Math.round(transform.x / BLOCK_WIDTH);
          ai.dirX = 0;
          ai.speed = 0;
          return;
        }
      }
      transform.x += ai.dirX * delta;
      transform.y += corrY;

    } else {
      const errX = cellX - transform.x;
      const corrX = errX !== 0 ? Math.sign(errX) * Math.min(Math.abs(errX), delta) : 0;

      const tgy = gridPlacement.gridY + ai.dirY;
      if (this.isCellBlocked(gridPlacement.gridX, tgy, ai, gameState)) {
        const targetCellY = tgy * BLOCK_HEIGHT;
        if (Math.abs(transform.y + ai.dirY * delta - targetCellY) < BLOCK_HEIGHT) {
          transform.y = cellY;
          gridPlacement.gridY = Math.round(transform.y / BLOCK_HEIGHT);
          ai.dirY = 0;
          ai.speed = 0;
          return;
        }
      }
      transform.y += ai.dirY * delta;
      transform.x += corrX;
    }

    gridPlacement.gridX = Math.round(transform.x / BLOCK_WIDTH);
    gridPlacement.gridY = Math.round(transform.y / BLOCK_HEIGHT);
  }

  isCellBlocked(gx, gy, ai, gameState) {
    if (gx < 0 || gx >= MAP_WIDTH || gy < 0 || gy >= MAP_HEIGHT) return true;
    const cell = gameState.gameMap[gy] && gameState.gameMap[gy][gx];
    if (cell & TYPE.HARD_BLOCK) return true;
    if (cell & TYPE.SOFT_BLOCK && !(ai.canPass & TYPE.SOFT_BLOCK)) return true;
    if (cell & TYPE.BOMB) return true;
    return false;
  }

  killEnemy(enemy, health, anim, render, gameState, idx, engine, entityId) {
    health.isDying = true;
    enemy.deathPhase = 1;
    enemy.deathWaitLeft = DEATH_WAIT_TICKS;
    anim.animationKey = null;
    render.sprite = null;
    render.spriteKey = enemy.type + '_DEATH';

    gameState.score += enemy.points;

    // There aren't any remaining enemies which are not busy dying
    if (!gameState.enemies.some(id => !engine.getComponent(id, HEALTH)?.isDying)) {
      engine.getSingleton(SOUND).queue.push('pause');
    }
  }

  advanceDeathAnimations(engine, gameState, dt) {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const entityId = gameState.enemies[i];
      const health   = engine.getComponent(entityId, HEALTH);
      if (!health || !health.isDying) continue;
      const enemy  = engine.getComponent(entityId, ENEMY_C);
      const anim   = engine.getComponent(entityId, ANIMATION);
      const render = engine.getComponent(entityId, RENDER);
      if (!enemy) continue;
      this.advanceDeath(enemy, anim, render, dt, gameState, i, engine, entityId);
    }
  }

  advanceDeath(enemy, anim, render, dt, gameState, idx, engine, entityId) {
    if (enemy.deathPhase === 1) {
      enemy.deathWaitLeft -= dt;
      if (enemy.deathWaitLeft <= 0) {
        enemy.deathPhase = 2;
        render.spriteKey = null;
        anim.animationKey = 'ENEMY_DEATH';
        anim.loop = false;
        anim.shouldAnimate = true;
      }
    } else if (enemy.deathPhase === 2) {
      if (!anim.shouldAnimate) {
        gameState.enemies.splice(idx, 1);
        engine.removeEntity(entityId);
      }
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
