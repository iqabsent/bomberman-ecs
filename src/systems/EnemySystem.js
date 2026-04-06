import {
  BLOCK_WIDTH, BLOCK_HEIGHT, MAP_WIDTH, MAP_HEIGHT,
  TYPE, DIRECTIONS, ENEMY, LEVEL, STATE
} from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { RenderComponent } from '../components/RenderComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { AIComponent } from '../components/AIComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { createEnemy as createEnemyEntity } from '../entities/Enemy.js';
import { FlameComponent } from '../components/FlameComponent.js';
import { assetManager } from '../utils/AssetManager.js';
import { SoundComponent } from '../components/SoundComponent.js';

// Ticks before death animation starts — original: queue('startDeathAnimation', 5) * 18
const DEATH_WAIT_TICKS = 90;

export class EnemySystem {
  constructor() {
    this.name = 'enemy';
  }

  apply(engine, dt) {

    const gameState = engine.getSingleton(GameStateComponent);
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

    // Advance death animations — runs in PLAYING and LEVEL_CLEAR
    if (gameState.currentState === STATE.PLAYING || gameState.currentState === STATE.LEVEL_CLEAR) {
      for (let i = gameState.dyingEnemies.length - 1; i >= 0; i--) {
        const entityId = gameState.dyingEnemies[i];
        const enemy    = engine.getComponent(entityId, EnemyComponent);
        const anim     = engine.getComponent(entityId, AnimationComponent);
        const render   = engine.getComponent(entityId, RenderComponent);
        if (!enemy) continue;
        this.advanceDeath(enemy, anim, render, dt, gameState, i, engine, entityId);
      }
    }

    if (gameState.currentState !== STATE.PLAYING) return;

    // Door burn — spawn enemies once flames have cleared the door cell
    if (gameState.pendingEnemySpawnDoor) {
      const { gridX, gridY, enemyType } = gameState.pendingEnemySpawnDoor;
      const flamesOnCell = gameState.flames.some(id => {
        const f = engine.getComponent(id, FlameComponent);
        return f && f.gridX === gridX && f.gridY === gridY;
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
    for (const [id] of engine.entities.entries()) {
      const playerInput = engine.getComponent(id, PlayerComponent);
      if (!playerInput) continue;
      const transform = engine.getComponent(id, TransformComponent);
      const health    = engine.getComponent(id, HealthComponent);
      const player    = engine.getComponent(id, PlayerComponent);
      if (transform && health) {
        playerCells.push({ gridX: transform.gridX, gridY: transform.gridY, health, player });
      }
    }

    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const entityId = gameState.enemies[i];
      const enemy    = engine.getComponent(entityId, EnemyComponent);
      if (!enemy) continue;

      const transform = engine.getComponent(entityId, TransformComponent);
      const ai        = engine.getComponent(entityId, AIComponent);
      const anim      = engine.getComponent(entityId, AnimationComponent);
      const render    = engine.getComponent(entityId, RenderComponent);

      // Check explosion collision
      const mapCell = gameState.gameMap[transform.gridY] && gameState.gameMap[transform.gridY][transform.gridX];
      if (mapCell & TYPE.EXPLOSION) {
        this.killEnemy(enemy, anim, render, gameState, i, engine, entityId);
        continue;
      }

      // Check player collision
      for (const pc of playerCells) {
        if (pc.gridX === transform.gridX && pc.gridY === transform.gridY) {
          if (!(pc.player && pc.player.invincibilityTimer) && !pc.health.isDying) {
            pc.health.isDying = true;
          }
        }
      }

      // AI — decide direction
      this.updateAI(enemy, ai, transform, gameState, dt, anim);

      // Move
      this.moveEnemy(ai, transform, gameState, dt);
    }
  }

  updateAI(enemy, ai, transform, gameState, dt, anim) {
    if (ai.recentlyActed) {
      ai.debounceLeft -= dt;
      if (ai.debounceLeft <= 0) ai.recentlyActed = false;
    }

    const cellX = transform.gridX * BLOCK_WIDTH;
    const cellY = transform.gridY * BLOCK_HEIGHT;
    const aligned = Math.abs((cellX - transform.x) + (cellY - transform.y)) <= ai.speed;

    const shouldAct = !ai.speed
      || (!ai.recentlyActed && aligned && Math.random() < ai.actionFrequency);

    if (shouldAct) {
      this.pickDirection(enemy, ai, transform, gameState, anim);
      ai.recentlyActed = true;
      ai.debounceLeft = ai.framesBetweenActions;
    }
  }

  pickDirection(enemy, ai, transform, gameState, anim) {
    const options = [];
    for (const [dx, dy] of DIRECTIONS) {
      if (!this.isCellBlocked(transform.gridX + dx, transform.gridY + dy, ai, gameState)) {
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

  moveEnemy(ai, transform, gameState, dt) {
    if (!ai.dirX && !ai.dirY) return;

    const delta = ai.speed * dt;
    const cellX = transform.gridX * BLOCK_WIDTH;
    const cellY = transform.gridY * BLOCK_HEIGHT;

    if (ai.dirX !== 0) {
      const errY = cellY - transform.y;
      const corrY = errY !== 0 ? Math.sign(errY) * Math.min(Math.abs(errY), delta) : 0;

      const tgx = transform.gridX + ai.dirX;
      if (this.isCellBlocked(tgx, transform.gridY, ai, gameState)) {
        const targetCellX = tgx * BLOCK_WIDTH;
        if (Math.abs(transform.x + ai.dirX * delta - targetCellX) < BLOCK_WIDTH) {
          transform.x = cellX;
          transform.gridX = Math.round(transform.x / BLOCK_WIDTH);
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

      const tgy = transform.gridY + ai.dirY;
      if (this.isCellBlocked(transform.gridX, tgy, ai, gameState)) {
        const targetCellY = tgy * BLOCK_HEIGHT;
        if (Math.abs(transform.y + ai.dirY * delta - targetCellY) < BLOCK_HEIGHT) {
          transform.y = cellY;
          transform.gridY = Math.round(transform.y / BLOCK_HEIGHT);
          ai.dirY = 0;
          ai.speed = 0;
          return;
        }
      }
      transform.y += ai.dirY * delta;
      transform.x += corrX;
    }

    transform.gridX = Math.round(transform.x / BLOCK_WIDTH);
    transform.gridY = Math.round(transform.y / BLOCK_HEIGHT);
  }

  isCellBlocked(gx, gy, ai, gameState) {
    if (gx < 0 || gx >= MAP_WIDTH || gy < 0 || gy >= MAP_HEIGHT) return true;
    const cell = gameState.gameMap[gy] && gameState.gameMap[gy][gx];
    if (cell & TYPE.HARD_BLOCK) return true;
    if (cell & TYPE.SOFT_BLOCK && !(ai.canPass & TYPE.SOFT_BLOCK)) return true;
    if (cell & TYPE.BOMB) return true;
    return false;
  }

  killEnemy(enemy, anim, render, gameState, idx, engine, entityId) {
    enemy.alive = false;
    enemy.deathPhase = 1;
    enemy.deathWaitLeft = DEATH_WAIT_TICKS;
    anim.animationKey = null;
    render.sprite = assetManager.getSprite(enemy.type + '_DEATH');

    // Remove from live list and award score immediately; move to dying list for animation
    gameState.score += enemy.points;
    gameState.enemies.splice(idx, 1);
    gameState.dyingEnemies.push(entityId);

    if (gameState.enemies.length === 0) {
      const gsEntity = Array.from(engine.entities.values()).find(
        e => engine.getComponent(e.id, GameStateComponent)
      );
      if (gsEntity) {
        const sound = engine.getComponent(gsEntity.id, SoundComponent);
        if (sound) sound.queue.push('pause');
      }
    }
  }

  advanceDeath(enemy, anim, render, dt, gameState, idx, engine, entityId) {
    if (enemy.deathPhase === 1) {
      enemy.deathWaitLeft -= dt;
      if (enemy.deathWaitLeft <= 0) {
        enemy.deathPhase = 2;
        anim.animationKey = 'ENEMY_DEATH';
        anim.loop = false;
        anim.shouldAnimate = true;
        render.sprite = null;
      }
    } else if (enemy.deathPhase === 2) {
      if (!anim.shouldAnimate) {
        gameState.dyingEnemies.splice(idx, 1);
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
    const entity = createEnemyEntity({ type, stats, gridX, gridY });
    engine.addEntity(entity);
    engine.addComponent(entity.id, entity.transform);
    engine.addComponent(entity.id, entity.render);
    engine.addComponent(entity.id, entity.animation);
    engine.addComponent(entity.id, entity.ai);
    engine.addComponent(entity.id, entity.enemy);
    engine.addComponent(entity.id, entity.health);
    engine.addComponent(entity.id, entity.destroyable);
    return entity.id;
  }
}
