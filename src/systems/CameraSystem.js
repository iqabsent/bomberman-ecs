import { BLOCK_WIDTH, MAP_WIDTH, CAMERA_PLAYER_OFFSET_X } from '../ecs/config.js';
import { GAME_STATE, TRANSFORM } from '../components';

export class CameraSystem {
  constructor(canvas) {
    this.name = 'camera';
    this.canvas = canvas;
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    const playerId = gameState.player;
    if (!playerId) return;
    const playerTransform = engine.getComponent(playerId, TRANSFORM);
    if (!playerTransform) return;

    const viewportW = this.canvas.width;
    const targetCameraX = playerTransform.x + CAMERA_PLAYER_OFFSET_X - viewportW / 2;
    const maxCameraX = MAP_WIDTH * BLOCK_WIDTH - viewportW;
    gameState.cameraX = Math.max(0, Math.min(targetCameraX, Math.max(0, maxCameraX)));
    gameState.cameraY = 0;
  }
}
