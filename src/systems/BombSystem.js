import { BLOCK_WIDTH, BLOCK_HEIGHT, TYPE, DIRECTIONS, BOMB_CHAIN_FUSE_TICKS } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { BombComponent } from '../components/BombComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { createBomb } from '../entities/Bomb.js';
import { createFlame } from '../entities/Flame.js';
import { SoundComponent } from '../components/SoundComponent.js';

export class BombSystem {
  constructor() {
    this.name = 'bomb';
  }

  apply(engine, dt) {

    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return;

    // Handle placement requests
    for (const [id] of engine.entities.entries()) {
      const player = engine.getComponent(id, PlayerComponent);
      if (!player || !player.wantsToPlaceBomb) continue;
      player.wantsToPlaceBomb = false;
      const transform = engine.getComponent(id, TransformComponent);
      if (transform) this.tryPlaceBomb(id, transform, player, gameState, engine);
    }

    // Tick fuses and chain delays
    const toDetonate = [];
    for (const bombId of gameState.bombs) {
      const bomb        = engine.getComponent(bombId, BombComponent);
      const destroyable = engine.getComponent(bombId, DestroyableComponent);
      if (!bomb) continue;

      // Chain hit — shorten fuse and mark as chained so canDetonate can't block it
      if (destroyable && destroyable.burning && !bomb.chained) {
        bomb.chained = true;
        bomb.fuseTicks = BOMB_CHAIN_FUSE_TICKS;
      }

      // Normal fuse — skip if owner has DETONATE (they control detonation manually)
      // chained bombs always tick down regardless
      if (!bomb.chained) {
        const ownerPlayer = bomb.ownerId
          ? engine.getComponent(bomb.ownerId, PlayerComponent)
          : null;
        if (ownerPlayer && ownerPlayer.canDetonate) continue;
      }

      bomb.fuseTicks -= dt;
      if (bomb.fuseTicks <= 0) toDetonate.push(bombId);
    }

    // D-key detonation — detonate oldest owned bomb (FIFO)
    for (const [id] of engine.entities.entries()) {
      const player = engine.getComponent(id, PlayerComponent);
      if (!player || !player.wantsToDetonate) continue;
      player.wantsToDetonate = false;
      if (!player.canDetonate) continue;

      const bombId = gameState.bombs.find(bid => {
        const b = engine.getComponent(bid, BombComponent);
        return b && b.ownerId === id;
      });
      if (bombId && !toDetonate.includes(bombId)) toDetonate.push(bombId);
    }

    for (const bombId of toDetonate) {
      this.detonateBomb(bombId, gameState, engine);
    }
  }

  tryPlaceBomb(ownerId, transform, player, gameState, engine) {
    if (player.activeBombs >= player.maxBombs) return;

    const gridX = Math.round(transform.x / BLOCK_WIDTH);
    const gridY = Math.round(transform.y / BLOCK_HEIGHT);

    const cell = gameState.gameMap[gridY] && gameState.gameMap[gridY][gridX];
    if (!(cell & TYPE.PASSABLE) || cell & TYPE.BOMB) return;

    gameState.gameMap[gridY][gridX] |= TYPE.BOMB;

    const entity = createBomb({ gridX, gridY, bombYield: player.bombYield, ownerId });
    engine.addEntity(entity);
    engine.addComponent(entity.id, entity.transform);
    engine.addComponent(entity.id, entity.render);
    engine.addComponent(entity.id, entity.animation);
    engine.addComponent(entity.id, entity.bomb);
    engine.addComponent(entity.id, entity.destroyable);
    engine.addComponent(entity.id, entity.sound);
    gameState.bombs.push(entity.id);

    const ownerSound = engine.getComponent(ownerId, SoundComponent);
    if (ownerSound) ownerSound.queue.push('plant');

    player.activeBombs++;
  }

  detonateBomb(bombId, gameState, engine) {
    const bomb = engine.getComponent(bombId, BombComponent);
    if (!bomb) return;

    const idx = gameState.bombs.indexOf(bombId);
    if (idx > -1) gameState.bombs.splice(idx, 1);
    engine.removeEntity(bombId);

    gameState.gameMap[bomb.gridY][bomb.gridX] &= ~TYPE.BOMB;

    if (bomb.ownerId) {
      const player = engine.getComponent(bomb.ownerId, PlayerComponent);
      if (player) player.activeBombs = Math.max(0, player.activeBombs - 1);
    }

    this.spawnFlame(bomb.gridX, bomb.gridY, 'C', gameState, engine, bomb.ownerId);

    for (const [dx, dy] of DIRECTIONS) {
      let hit = false;
      for (let i = 1; !hit && i <= bomb.yield; i++) {
        const tx = bomb.gridX + dx * i;
        const ty = bomb.gridY + dy * i;

        if (tx < 0 || ty < 0 || ty >= gameState.gameMap.length || tx >= gameState.gameMap[0].length) break;

        const cell = gameState.gameMap[ty][tx];

        if (cell & TYPE.HARD_BLOCK) {
          hit = true;
          continue;
        }

        if (cell & TYPE.SOFT_BLOCK) {
          // Start burn animation — DestroyableSystem handles the reveal spawn on completion
          const softBlockId = gameState.softBlocks.find(id => {
            const t = engine.getComponent(id, TransformComponent);
            return t && t.gridX === tx && t.gridY === ty;
          });
          if (softBlockId) {
            const sbAnim        = engine.getComponent(softBlockId, AnimationComponent);
            const sbDestroyable = engine.getComponent(softBlockId, DestroyableComponent);
            if (sbAnim && sbDestroyable) {
              sbAnim.animationKey = 'SOFT_BLOCK';
              sbAnim.loop = false;
              sbAnim.frame = 1;
              sbAnim.ticks = 0;
              sbAnim.shouldAnimate = true;
              sbDestroyable.burning = true;
            }
          }
          hit = true;
          continue;
        }

        if (cell & TYPE.POWER) {
          const entityId = gameState.powerups.find(id => {
            const t = engine.getComponent(id, TransformComponent);
            return t && t.gridX === tx && t.gridY === ty;
          });
          if (entityId) {
            const t = engine.getComponent(entityId, TransformComponent);
            gameState.gameMap[t.gridY][t.gridX] &= ~TYPE.POWER;
            gameState.powerups.splice(gameState.powerups.indexOf(entityId), 1);
            engine.removeEntity(entityId);
            gameState.pendingEnemySpawnDoor = { gridX: tx, gridY: ty, enemyType: 'PONTAN' };
          }
        }


        if (cell & TYPE.BOMB) {
          const chainId = gameState.bombs.find(id => {
            const b = engine.getComponent(id, BombComponent);
            return b && b.gridX === tx && b.gridY === ty;
          });
          if (chainId) {
            const chainDestroyable = engine.getComponent(chainId, DestroyableComponent);
            if (chainDestroyable) chainDestroyable.burning = true;
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

  spawnFlame(gridX, gridY, type, gameState, engine, soundOwnerId) {
    if (gameState.gameMap[gridY]) {
      gameState.gameMap[gridY][gridX] |= TYPE.EXPLOSION;
    }

    const entity = createFlame({ gridX, gridY, type });
    engine.addEntity(entity);
    engine.addComponent(entity.id, entity.transform);
    engine.addComponent(entity.id, entity.render);
    engine.addComponent(entity.id, entity.animation);
    engine.addComponent(entity.id, entity.flame);
    gameState.flames.push(entity.id);

    // Play explode once for the center flame
    if (type === 'C' && soundOwnerId) {
      const sound = engine.getComponent(soundOwnerId, SoundComponent);
      if (sound) sound.queue.push('explode');
    }
  }
}
