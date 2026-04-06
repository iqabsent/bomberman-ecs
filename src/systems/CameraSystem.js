import { CANVAS_WIDTH, BLOCK_WIDTH, MAP_WIDTH } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';

export class CameraSystem {
  constructor() {
    this.name = 'camera';
  }

  apply(engine) {
    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return;

    let playerTransform = null;
    for (const [id] of engine.entities.entries()) {
      const player = engine.getComponent(id, PlayerComponent);
      if (!player) continue;
      playerTransform = engine.getComponent(id, TransformComponent);
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
