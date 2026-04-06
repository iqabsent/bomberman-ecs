import { STATE, TYPE, MAP_WIDTH, MAP_HEIGHT, LEVEL } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { createSoftBlock } from '../entities/SoftBlock.js';
import { createPowerUp } from '../entities/PowerUp.js';
import { createDoor } from '../entities/Door.js';

export class MapSystem {
  constructor() {
    this.name = 'map';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return;

    if (gameState.currentState === STATE.LOADING && gameState.mapLoading) {
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
            const entity = createSoftBlock({ gridX: x, gridY: y });
            engine.addEntity(entity);
            engine.addComponent(entity.id, entity.transform);
            engine.addComponent(entity.id, entity.render);
            engine.addComponent(entity.id, entity.animation);
            engine.addComponent(entity.id, entity.gridPlacement);
            engine.addComponent(entity.id, entity.destroyable);
            gameState.softBlocks.push(entity.id);
          }
        }
      }

      gameState.mapLoading = false;
      return;
    }

    // Process cells where soft blocks have finished burning
    if (gameState.pendingMapReveals.length === 0) return;

    const levelPower = LEVEL[gameState.currentLevel % LEVEL.length].power;

    for (const { gridX, gridY } of gameState.pendingMapReveals) {
      if (gameState.softBlockCount > 0) gameState.softBlockCount--;
      const n = gameState.softBlockCount;

      if (!gameState.powerSpawned && (!(n - 1) || Math.random() < 1 / (n - 1))) {
        gameState.powerSpawned = true;
        gameState.gameMap[gridY][gridX] = TYPE.PASSABLE | TYPE.POWER;
        const entity = createPowerUp({ gridX, gridY, type: levelPower });
        engine.addEntity(entity);
        engine.addComponent(entity.id, entity.transform);
        engine.addComponent(entity.id, entity.render);
        engine.addComponent(entity.id, entity.collectible);
        engine.addComponent(entity.id, entity.gridPlacement);
        engine.addComponent(entity.id, entity.destroyable);
        gameState.powerups.push(entity.id);
      } else if (!gameState.doorSpawned && (!n || Math.random() < 1 / n)) {
        gameState.doorSpawned = true;
        gameState.gameMap[gridY][gridX] = TYPE.PASSABLE | TYPE.DOOR;
        const entity = createDoor({ gridX, gridY });
        engine.addEntity(entity);
        engine.addComponent(entity.id, entity.transform);
        engine.addComponent(entity.id, entity.render);
        engine.addComponent(entity.id, entity.gridPlacement);
        engine.addComponent(entity.id, entity.destroyable);
        gameState.door = entity.id;
      } else {
        gameState.gameMap[gridY][gridX] = TYPE.PASSABLE;
      }
    }

    gameState.pendingMapReveals = [];
  }
}
