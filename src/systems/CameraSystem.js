import { CANVAS_WIDTH, BLOCK_WIDTH, MAP_WIDTH } from '../ecs/config.js';
import { GAME_STATE, TRANSFORM } from '../components';

export class CameraSystem {
  constructor() {
    this.name = 'camera';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    const playerId = gameState.players[0];
    if (!playerId) return;
    const playerTransform = engine.getComponent(playerId, TRANSFORM);
    if (!playerTransform) return;

    const halfViewportWidth = CANVAS_WIDTH / 2;
    const targetCameraX = playerTransform.x + 14 - halfViewportWidth;
    const maxCameraX = MAP_WIDTH * BLOCK_WIDTH - CANVAS_WIDTH;
    gameState.cameraX = Math.max(0, Math.min(targetCameraX, maxCameraX));
    gameState.cameraY = 0;
  }
}
