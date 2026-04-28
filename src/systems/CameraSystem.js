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

    const playerTransform = engine.getComponent('player', TRANSFORM);
    if (!playerTransform) return;

    const viewportW  = this.canvas.width;
    const levelWidth = MAP_WIDTH * BLOCK_WIDTH;
    const maxCameraX = levelWidth - viewportW;

    if (maxCameraX <= 0) {
      gameState.cameraX = maxCameraX / 2; // negative → RenderSystem translates right, centering the level
    } else {
      const targetCameraX = playerTransform.x + CAMERA_PLAYER_OFFSET_X - viewportW / 2;
      gameState.cameraX = Math.max(0, Math.min(targetCameraX, maxCameraX));
    }
    gameState.cameraY = 0;
  }
}
