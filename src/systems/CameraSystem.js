import { CANVAS_WIDTH, BLOCK_WIDTH, MAP_WIDTH } from '../ecs/config.js';
import { GAME_STATE, TRANSFORM, PLAYER } from '../components';

export class CameraSystem {
  constructor() {
    this.name = 'camera';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    let playerTransform = null;
    for (const id of engine.entities) {
      const player = engine.getComponent(id, PLAYER);
      if (!player) continue;
      playerTransform = engine.getComponent(id, TRANSFORM);
      break;
    }
    if (!playerTransform) return;

    const halfViewportWidth = CANVAS_WIDTH / 2;
    const targetCameraX = playerTransform.x + 14 - halfViewportWidth;
    const maxCameraX = MAP_WIDTH * BLOCK_WIDTH - CANVAS_WIDTH;
    gameState.cameraX = Math.max(0, Math.min(targetCameraX, maxCameraX));
    gameState.cameraY = 0;
  }
}
