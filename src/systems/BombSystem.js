import { BLOCK_WIDTH, BLOCK_HEIGHT, TYPE, DIRECTIONS, BOMB_CHAIN_FUSE_TICKS, DESTROY } from '../ecs/config.js';
import { BOMB, DESTROYABLE, FUSE, GAME_STATE, GRID_PLACEMENT, PLAYER, SOUND, TRANSFORM } from '../components';
import { createBomb } from '../entities/Bomb.js';
import { createFlame } from '../entities/Flame.js';

export class BombSystem {
  constructor() {
    this.name = 'bomb';
  }

  apply(engine, dt) {

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    // Handle placement requests
    for (const id of gameState.players) {
      const player = engine.getComponent(id, PLAYER);
      if (!player || !player.pendingBombPlacement) continue;
      player.pendingBombPlacement = false;
      const transform = engine.getComponent(id, TRANSFORM);
      if (transform) this.tryPlaceBomb(id, transform, player, gameState, engine);
    }

    // Tick fuses and chain delays
    const toDetonate = [];
    for (const bombId of gameState.bombs) {
      const bomb        = engine.getComponent(bombId, BOMB);
      const fuse        = engine.getComponent(bombId, FUSE);
      const destroyable = engine.getComponent(bombId, DESTROYABLE);
      if (!bomb || !fuse) continue;

      // Chain hit — shorten fuse and mark as chained so canDetonate can't block it
      if (destroyable && destroyable.destroyState === DESTROY.PENDING && !bomb.chained) {
        bomb.chained = true;
        fuse.ticks = BOMB_CHAIN_FUSE_TICKS;
      }

      // Normal fuse — skip if owner has DETONATE (they control detonation manually)
      // chained bombs always tick down regardless
      if (!bomb.chained) {
        const ownerPlayer = bomb.ownerId
          ? engine.getComponent(bomb.ownerId, PLAYER)
          : null;
        if (ownerPlayer && ownerPlayer.canDetonate) continue;
      }

      fuse.ticks -= dt;
      if (fuse.ticks <= 0) toDetonate.push(bombId);
    }

    // D-key detonation — detonate oldest owned bomb (FIFO)
    for (const id of gameState.players) {
      const player = engine.getComponent(id, PLAYER);
      if (!player || !player.pendingBombDetonation) continue;
      player.pendingBombDetonation = false;

      const bombId = gameState.bombs.find(bid => {
        const b = engine.getComponent(bid, BOMB);
        return b && b.ownerId === id;
      });
      if (bombId && !toDetonate.includes(bombId)) toDetonate.push(bombId);
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

    gameState.bombs.push(createBomb(engine, { gridX, gridY, bombYield: player.bombYield, ownerId }));

    engine.getSingleton(SOUND).queue.push('plant');

    player.activeBombs++;
  }

  detonateBomb(bombId, gameState, engine) {
    const bomb          = engine.getComponent(bombId, BOMB);
    const bombPlacement = engine.getComponent(bombId, GRID_PLACEMENT);
    if (!bomb || !bombPlacement) return;

    const idx = gameState.bombs.indexOf(bombId);
    if (idx > -1) gameState.bombs.splice(idx, 1);
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
          const softBlockId = gameState.softBlocks.find(id => {
            const gp = engine.getComponent(id, GRID_PLACEMENT);
            return gp && gp.gridX === tx && gp.gridY === ty;
          });
          if (softBlockId) {
            const sbDestroyable = engine.getComponent(softBlockId, DESTROYABLE);
            if (sbDestroyable && !sbDestroyable.destroyState) sbDestroyable.destroyState = DESTROY.PENDING;
          }
          hit = true;
          continue;
        }

        if (cell & TYPE.POWER) {
          const entityId = gameState.powerups.find(id => {
            const gp = engine.getComponent(id, GRID_PLACEMENT);
            return gp && gp.gridX === tx && gp.gridY === ty;
          });
          if (entityId) {
            const puDestroyable = engine.getComponent(entityId, DESTROYABLE);
            if (puDestroyable && !puDestroyable.destroyState) puDestroyable.destroyState = DESTROY.PENDING;
          }
        }

        if (cell & TYPE.DOOR) {
          if (gameState.door) {
            const doorDestroyable = engine.getComponent(gameState.door, DESTROYABLE);
            if (doorDestroyable && !doorDestroyable.destroyState) doorDestroyable.destroyState = DESTROY.PENDING;
          }
          // Door doesn't block flame spread
        }

        if (cell & TYPE.BOMB) {
          const chainId = gameState.bombs.find(id => {
            const gp = engine.getComponent(id, GRID_PLACEMENT);
            return gp && gp.gridX === tx && gp.gridY === ty;
          });
          if (chainId) {
            const chainDestroyable = engine.getComponent(chainId, DESTROYABLE);
            if (chainDestroyable && !chainDestroyable.destroyState) chainDestroyable.destroyState = DESTROY.PENDING;
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

    gameState.flames.push(createFlame(engine, { gridX, gridY, type }));
  }
}
