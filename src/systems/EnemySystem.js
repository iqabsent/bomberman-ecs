import {
  BLOCK_WIDTH, BLOCK_HEIGHT, MAP_WIDTH, MAP_HEIGHT,
  TYPE, DIRECTIONS, ENEMY, LEVEL, STATE, DESTROY
} from '../ecs/config.js';
import { GAME_STATE, GAME_STATE_ENTITY, TRANSFORM, ANIMATION, RENDER, ENEMY as ENEMY_C, VELOCITY, COLLISION, DESTROYABLE, GRID_PLACEMENT, SOUND } from '../components';
import { createEnemy as createEnemyEntity } from '../entities/Enemy.js';
import { EVENT } from '../ecs/events.js';
import { getEvent, emitEvent, clearEventsByType } from '../ecs/eventHelpers.js';

// Ticks before death animation starts — original: queue('startDeathAnimation', 5) * 18
const DEATH_WAIT_TICKS = 90;

export class EnemySystem {
  constructor() {
    this.name = 'enemy';
  }

  apply(engine, dt) {
    clearEventsByType(engine, EVENT.ENEMY_LOAD_COMPLETE);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    if (gameState.currentState === STATE.LOADING &&
        getEvent(engine, GAME_STATE_ENTITY, EVENT.MAP_LOAD_COMPLETE)) {
      const levelData = LEVEL[gameState.currentLevel % LEVEL.length];
      for (const [type, count] of Object.entries(levelData.enemies)) {
        const stats = ENEMY[type];
        if (!stats) continue;
        for (let i = 0; i < count; i++) {
          const spawn = EnemySystem.findSpawnPoint(gameState.gameMap, stats.spawn_distance);
          if (!spawn) continue;
          EnemySystem.createEnemy(type, stats, spawn.gridX, spawn.gridY, engine);
        }
      }
      emitEvent(engine, GAME_STATE_ENTITY, { type: EVENT.ENEMY_LOAD_COMPLETE });
      return;
    }

    if (gameState.currentState === STATE.PLAYING || gameState.currentState === STATE.LEVEL_CLEAR) {
      const toRemove = [];
      for (const entityId of engine.query(ENEMY_C)) {
        const destroyable = engine.getComponent(entityId, DESTROYABLE);
        if (destroyable?.destroyState === DESTROY.DESTROYED) toRemove.push(entityId);
      }
      for (const entityId of toRemove) engine.removeEntity(entityId);
    }

    if (gameState.currentState === STATE.PLAYING) {
      const doorDestroyed = getEvent(engine, GAME_STATE_ENTITY, EVENT.DOOR_DESTROYED);
      if (doorDestroyed) {
        const { gridX, gridY } = doorDestroyed.payload;
        const nextLevelData = LEVEL[(gameState.currentLevel + 1) % LEVEL.length];
        const enemyType     = Object.keys(nextLevelData.enemies).slice(-1)[0];
        const stats         = ENEMY[enemyType];
        if (stats) {
          for (let j = 0; j < 8; j++) {
            EnemySystem.createEnemy(enemyType, stats, gridX, gridY, engine);
          }
        }
      }

      const powerupDestroyed = getEvent(engine, GAME_STATE_ENTITY, EVENT.POWERUP_DESTROYED);
      if (powerupDestroyed) {
        const { gridX, gridY } = powerupDestroyed.payload;
        const stats = ENEMY['PONTAN'];
        for (let j = 0; j < 8; j++) {
          EnemySystem.createEnemy('PONTAN', stats, gridX, gridY, engine);
        }
      }

      if (getEvent(engine, GAME_STATE_ENTITY, EVENT.TIMER_EXPIRED)) {
        const stats = ENEMY['PONTAN'];
        for (let i = 0; i < 5; i++) {
          const spawn = EnemySystem.findSpawnPoint(gameState.gameMap, 0);
          if (spawn) EnemySystem.createEnemy('PONTAN', stats, spawn.gridX, spawn.gridY, engine);
        }
      }

      for (const entityId of engine.query(ENEMY_C)) {
        const enemy       = engine.getComponent(entityId, ENEMY_C);
        const destroyable = engine.getComponent(entityId, DESTROYABLE);
        if (!enemy || !destroyable || destroyable.destroyState !== null) continue;

        const transform     = engine.getComponent(entityId, TRANSFORM);
        const gridPlacement = engine.getComponent(entityId, GRID_PLACEMENT);
        const anim          = engine.getComponent(entityId, ANIMATION);
        const render        = engine.getComponent(entityId, RENDER);

        if (getEvent(engine, entityId, EVENT.DAMAGE_EXPLOSION)) {
          this.killEnemy(enemy, anim, render, destroyable, gameState, engine);
          continue;
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

  killEnemy(enemy, anim, render, destroyable, gameState, engine) {
    destroyable.destroyState = DESTROY.DESTROYING;
    render.sprite = null;
    render.spriteKey = enemy.type + '_DEATH';
    anim.animationKey = 'ENEMY_DEATH';
    anim.loop = false;
    anim.delay = DEATH_WAIT_TICKS;

    gameState.score += enemy.points;

    let anyAlive = false;
    for (const id of engine.query(ENEMY_C)) {
      if (engine.getComponent(id, DESTROYABLE)?.destroyState === null) { anyAlive = true; break; }
    }
    if (!anyAlive) engine.getSingleton(SOUND).queue.push('pause');
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
