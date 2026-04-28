import { BLOCK_WIDTH, BLOCK_HEIGHT, TYPE, DIRECTIONS, BOMB_CHAIN_FUSE_TICKS } from '../ecs/config.js';
import { BOMB, DESTROYABLE, FUSE, GAME_STATE, GRID_PLACEMENT, PLAYER, SOFT_BLOCK, SOUND, TRANSFORM } from '../components';
import { createBomb } from '../entities/Bomb.js';
import { createFlame } from '../entities/Flame.js';
import { EVENT } from '../ecs/events.js';
import { getEvent, emitEvent, clearEventsByType } from '../ecs/eventHelpers.js';

export class BombSystem {
  constructor() {
    this.name = 'bomb';
  }

  apply(engine, dt) {

    clearEventsByType(engine, EVENT.DAMAGE_EXPLOSION);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    const id = 'player';

    // Handle placement requests
    {
      const player = engine.getComponent(id, PLAYER);
      if (player && getEvent(engine, id, EVENT.BOMB_PLACEMENT_INTENT)) {
        const transform = engine.getComponent(id, TRANSFORM);
        if (transform) this.tryPlaceBomb(id, transform, player, gameState, engine);
      }
    }

    // Tick fuses
    const toDetonate = [];
    for (const bombId of engine.query(BOMB)) {
      const bomb = engine.getComponent(bombId, BOMB);
      const fuse = engine.getComponent(bombId, FUSE);
      if (!bomb || !fuse) continue;

      // Normal fuse — skip if owner has DETONATE (chained bombs always tick down regardless)
      if (!bomb.chained) {
        const ownerPlayer = bomb.ownerId
          ? engine.getComponent(bomb.ownerId, PLAYER)
          : null;
        if (ownerPlayer && ownerPlayer.canDetonate) continue;
      }

      fuse.ticks -= dt;
      if (fuse.ticks <= 0) toDetonate.push(bombId);
    }

    // D-key detonation — detonate oldest owned bomb (FIFO via Set insertion order)
    {
      const player = engine.getComponent(id, PLAYER);
      if (player && getEvent(engine, id, EVENT.BOMB_DETONATION_INTENT)) {
        let bombId;
        for (const bid of engine.query(BOMB)) {
          const b = engine.getComponent(bid, BOMB);
          if (b && b.ownerId === id) { bombId = bid; break; }
        }
        if (bombId && !toDetonate.includes(bombId)) toDetonate.push(bombId);
      }
    }

    for (const bombId of toDetonate) {
      this.detonateBomb(bombId, gameState, engine);
    }
  }

  tryPlaceBomb(ownerId, transform, player, gameState, engine) {

    const gridX = Math.round(transform.x / BLOCK_WIDTH);
    const gridY = Math.round(transform.y / BLOCK_HEIGHT);

    const cell = gameState.gameMap[gridY] && gameState.gameMap[gridY][gridX];
    if (!(cell & TYPE.PASSABLE) || cell & TYPE.BOMB) return;

    gameState.gameMap[gridY][gridX] |= TYPE.BOMB;

    createBomb(engine, { gridX, gridY, bombYield: player.bombYield, ownerId });

    engine.getSingleton(SOUND).queue.push('plant');

    player.activeBombs++;
  }

  detonateBomb(bombId, gameState, engine) {
    const bomb          = engine.getComponent(bombId, BOMB);
    const bombPlacement = engine.getComponent(bombId, GRID_PLACEMENT);
    if (!bomb || !bombPlacement) return;

    engine.removeEntity(bombId);

    gameState.gameMap[bombPlacement.gridY][bombPlacement.gridX] &= ~TYPE.BOMB;

    if (bomb.ownerId) {
      const player = engine.getComponent(bomb.ownerId, PLAYER);
      if (player) player.activeBombs = Math.max(0, player.activeBombs - 1);
    }

    this.spawnFlame(bombPlacement.gridX, bombPlacement.gridY, 'C', gameState, engine);

    engine.getSingleton(SOUND).queue.push('explode');

    for (const [dx, dy] of DIRECTIONS) {
      let hit = false;
      for (let i = 1; !hit && i <= bomb.yield; i++) {
        const tx = bombPlacement.gridX + dx * i;
        const ty = bombPlacement.gridY + dy * i;

        if (tx < 0 || ty < 0 || ty >= gameState.gameMap.length || tx >= gameState.gameMap[0].length) break;

        const cell = gameState.gameMap[ty][tx];

        if (cell & TYPE.HARD_BLOCK) {
          hit = true;
          continue;
        }

        if (cell & TYPE.SOFT_BLOCK) {
          for (const sbId of engine.query(SOFT_BLOCK)) {
            const gp = engine.getComponent(sbId, GRID_PLACEMENT);
            if (gp && gp.gridX === tx && gp.gridY === ty) {
              const sbDestroyable = engine.getComponent(sbId, DESTROYABLE);
              if (sbDestroyable && sbDestroyable.destroyState === null) emitEvent(engine, sbId, { type: EVENT.DAMAGE_EXPLOSION });
              break;
            }
          }
          hit = true;
          continue;
        }

        if (cell & TYPE.BOMB) {
          for (const chainId of engine.query(BOMB)) {
            const gp = engine.getComponent(chainId, GRID_PLACEMENT);
            if (gp && gp.gridX === tx && gp.gridY === ty) {
              const chainBomb = engine.getComponent(chainId, BOMB);
              const chainFuse = engine.getComponent(chainId, FUSE);
              if (chainBomb && chainFuse && !chainBomb.chained) {
                chainBomb.chained = true;
                chainFuse.ticks = BOMB_CHAIN_FUSE_TICKS;
              }
              break;
            }
          }
          hit = true;
        }

        const isEdge = hit || i === bomb.yield;
        let flameType;
        if (dx !== 0) {
          flameType = isEdge ? (dx < 0 ? 'L' : 'R') : 'H';
        } else {
          flameType = isEdge ? (dy < 0 ? 'T' : 'B') : 'V';
        }

        this.spawnFlame(tx, ty, flameType, gameState, engine);
      }
    }
  }

  spawnFlame(gridX, gridY, type, gameState, engine) {
    if (gameState.gameMap[gridY]) {
      gameState.gameMap[gridY][gridX] |= TYPE.EXPLOSION;
    }

    createFlame(engine, { gridX, gridY, type });
  }
}
