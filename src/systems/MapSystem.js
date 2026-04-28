import { TYPE, MAP_WIDTH, MAP_HEIGHT, LEVEL } from '../ecs/config.js';
import { GAME_STATE, GAME_STATE_ENTITY, GRID_PLACEMENT, DESTROYABLE } from '../components';
import { EVENT } from '../ecs/events.js';
import { getEvent, emitEvent, clearEventsByType } from '../ecs/eventHelpers.js';
import { createSoftBlock } from '../entities/SoftBlock.js';
import { createPowerUp } from '../entities/PowerUp.js';
import { createDoor } from '../entities/Door.js';

export class MapSystem {
  constructor() {
    this.name = 'map';
  }

  apply(engine) {
    clearEventsByType(engine, EVENT.MAP_LOAD_COMPLETE);
    clearEventsByType(engine, EVENT.DESTROY_TRIGGERED);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    if (getEvent(engine, GAME_STATE_ENTITY, EVENT.MAP_LOAD_REQUESTED)) {
      const map = [];
      for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
          if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
            row.push(TYPE.HARD_BLOCK);
          } else if (x % 2 === 0 && y % 2 === 0) {
            row.push(TYPE.HARD_BLOCK);
          } else if (x + y < 4 || Math.random() > 0.4) {
            row.push(TYPE.PASSABLE);
          } else {
            row.push(TYPE.SOFT_BLOCK);
          }
        }
        map.push(row);
      }
      gameState.gameMap = map;
      gameState.softBlockCount = 0;

      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          if (map[y][x] & TYPE.SOFT_BLOCK) {
            gameState.softBlockCount++;
            gameState.softBlocks.push(createSoftBlock(engine, { gridX: x, gridY: y }));
          }
        }
      }

      emitEvent(engine, GAME_STATE_ENTITY, { type: EVENT.MAP_LOAD_COMPLETE });
      return;
    }

    const damaged = gameState.softBlocks.filter(id => getEvent(engine, id, EVENT.DAMAGE_EXPLOSION));

    if (damaged.length > 0) {
      for (const id of damaged) {
        const idx = gameState.softBlocks.indexOf(id);
        if (idx > -1) gameState.softBlocks.splice(idx, 1);
      }

      const levelPower = LEVEL[gameState.currentLevel % LEVEL.length].power;

      for (const id of damaged) {
        const gp = engine.getComponent(id, GRID_PLACEMENT);
        if (!gp) continue;
        const { gridX, gridY } = gp;
        if (gameState.softBlockCount > 0) gameState.softBlockCount--;
        const n = gameState.softBlockCount;

        if (!gameState.powerSpawned && (!(n - 1) || Math.random() < 1 / (n - 1))) {
          gameState.powerSpawned = true;
          gameState.gameMap[gridY][gridX] = TYPE.PASSABLE | TYPE.POWER;
          gameState.powerup = createPowerUp(engine, { gridX, gridY, type: levelPower });
        } else if (!gameState.doorSpawned && (!n || Math.random() < 1 / n)) {
          gameState.doorSpawned = true;
          gameState.gameMap[gridY][gridX] = TYPE.PASSABLE | TYPE.DOOR;
          gameState.door = createDoor(engine, { gridX, gridY });
        } else {
          gameState.gameMap[gridY][gridX] = TYPE.PASSABLE;
        }

        emitEvent(engine, id, { type: EVENT.DESTROY_TRIGGERED });
      }
    }

    if (gameState.door) {
      const destroyable = engine.getComponent(gameState.door, DESTROYABLE);
      if (destroyable && destroyable.destroyState === null && getEvent(engine, gameState.door, EVENT.DAMAGE_EXPLOSION)) {
        emitEvent(engine, gameState.door, { type: EVENT.DESTROY_TRIGGERED });
      }
    }

    if (gameState.powerup) {
      const destroyable = engine.getComponent(gameState.powerup, DESTROYABLE);
      if (destroyable && destroyable.destroyState === null && getEvent(engine, gameState.powerup, EVENT.DAMAGE_EXPLOSION)) {
        emitEvent(engine, gameState.powerup, { type: EVENT.DESTROY_TRIGGERED });
      }
    }
  }
}
