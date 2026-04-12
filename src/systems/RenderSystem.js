import { TYPE, BLOCK_WIDTH, BLOCK_HEIGHT, OFFSET_Y, STATE } from '../ecs/config.js';
import { TRANSFORM, RENDER, GAME_STATE } from '../components';
import { assetManager } from '../utils/AssetManager.js';

export class RenderSystem {
  constructor(ctx) {
    this.ctx = ctx;
    this.name = 'render';
    this.runsWhenPaused = true;
  }

  apply(engine) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) return;

    if (gameState.currentState !== STATE.TITLE && gameState.currentState !== STATE.LEVEL_START && gameState.currentState !== STATE.LOADING) {
      this.renderHUD(ctx, gameState);

      ctx.save();
      ctx.translate(-gameState.cameraX, OFFSET_Y);

      if (gameState.gameMap) {
        this.renderMap(ctx, gameState.gameMap);
      }

      // Collect all renderable entities, sort by layer, draw in order
      const renderables = [];
      for (const id of engine.entities) {
        const transform = engine.getComponent(id, TRANSFORM);
        const render    = engine.getComponent(id, RENDER);
        if (!transform || !render) continue;
        const sprite = render.sprite ?? (render.spriteKey ? assetManager.getSprite(render.spriteKey) : null);
        if (sprite) renderables.push({ transform, render, sprite });
      }
      renderables.sort((a, b) => a.render.layer - b.render.layer);
      for (const { transform, render, sprite } of renderables) {
        ctx.drawImage(sprite, transform.x, transform.y, render.width, render.height);
      }

      ctx.restore();
    }

    switch (gameState.currentState) {
      case STATE.TITLE:        this.renderOverlay(ctx, 'PRESS S TO START'); break;
      case STATE.LEVEL_START:  this.renderOverlay(ctx, `STAGE ${gameState.currentLevel + 1}`); break;
      case STATE.GAME_OVER:    this.renderOverlay(ctx, 'GAME OVER');    break;
      case STATE.GAME_WON:     this.renderOverlay(ctx, 'YOU WIN');      break;
      case STATE.PAUSED:       this.renderOverlay(ctx, 'GAME PAUSED');  break;
    }
  }

  renderOverlay(ctx, message) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Only hard blocks — soft blocks are now SoftBlock entities (layer 1)
  renderMap(ctx, gameMap) {
    const hardBlockSprite = assetManager.getSprite('HARD_BLOCK');

    for (let y = 0; y < gameMap.length; y++) {
      for (let x = 0; x < gameMap[y].length; x++) {
        if (gameMap[y][x] & TYPE.HARD_BLOCK) {
          if (hardBlockSprite) {
            ctx.drawImage(hardBlockSprite, x * BLOCK_WIDTH, y * BLOCK_HEIGHT, BLOCK_WIDTH, BLOCK_HEIGHT);
          }
        }
      }
    }
  }

  renderHUD(ctx, gameState) {
    ctx.fillStyle = '#007C00';
    ctx.fillRect(0, 0, ctx.canvas.width, OFFSET_Y);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Level: ${gameState.currentLevel + 1}`, 10, 25);
    ctx.fillText(`Lives: ${gameState.lives}`, 150, 25);
    ctx.fillText(`Score: ${gameState.score}`, 300, 25);
    ctx.fillText(`Time: ${Math.floor(gameState.gameTime / 1000)}s`, 450, 25);

    ctx.font = '12px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Arrow Keys: Move | S: Bomb | D: Detonate', 10, 50);
  }
}
