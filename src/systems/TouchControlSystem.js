import { PLAYER, HEALTH, GAME_STATE } from '../components';
import { STATE } from '../ecs/config.js';
import { soundManager } from '../utils/SoundManager.js';
import { EVENT } from '../ecs/events.js';
import { emitEvent } from '../ecs/eventHelpers.js';

// Zones that fire once on first contact only (not on slide-in)
const ONE_SHOT = new Set(['START', 'SELECT', 'DETONATE']);

export class TouchInputSystem {
  constructor(ctx) {
    this.name = 'touch-input';
    this.runsWhenPaused = true;
    this.ctx = ctx;

    this._visible = false;
    this._pointers = new Map(); // pointerId → zone name (or null if between zones)
    this._held = new Set();     // zones pressed this tick (recomputed each apply)
    this._justPressed = new Set(); // zones that fired their initial contact this tick

    const canvas = ctx.canvas;
    canvas.addEventListener('pointerdown',   this._onDown.bind(this));
    canvas.addEventListener('pointermove',   this._onMove.bind(this));
    canvas.addEventListener('pointerup',     this._onUp.bind(this));
    canvas.addEventListener('pointercancel', this._onUp.bind(this));
  }

  apply(engine) {
    const gameState = engine.getSingleton(GAME_STATE);
    if (!gameState) { this._justPressed.clear(); return; }

    // Recompute held set from current pointer positions
    this._held.clear();
    for (const zone of this._pointers.values()) {
      if (zone) this._held.add(zone);
    }

    // START: pause/resume or start game from title
    if (this._justPressed.has('START')) {
      if (gameState.currentState === STATE.TITLE) {
        gameState.toLoadingState();
      } else if (gameState.currentState === STATE.PLAYING || gameState.currentState === STATE.PAUSED) {
        const wasPaused = engine.paused;
        wasPaused ? gameState.toResumedState() : gameState.toPausedState();
        engine.paused = !engine.paused;
        if (wasPaused) {
          soundManager.resumeAll();
        } else {
          soundManager.pauseAll();
          soundManager.play('pause');
        }
      }
    }

    // SELECT: toggle music
    if (this._justPressed.has('SELECT')) {
      gameState.musicMuted = !gameState.musicMuted;
    }

    if (gameState.currentState === STATE.PLAYING && !engine.paused) {
      for (const id of gameState.players) {
        const player = engine.getComponent(id, PLAYER);
        if (!player) continue;
        const health = engine.getComponent(id, HEALTH);
        if (health?.isDying) continue;

        // D-pad: if any touch direction is held, fully override keyboard directional input
        const touchDx = this._held.has('LEFT') ? -1 : this._held.has('RIGHT') ? 1 : null;
        const touchDy = this._held.has('UP')   ? -1 : this._held.has('DOWN')  ? 1 : null;

        if (touchDx !== null || touchDy !== null) {
          // Prefer whichever single axis has input; if both, prefer horizontal
          if (touchDx !== null) {
            player.inputDx = touchDx;
            player.inputDy = 0;
          } else {
            player.inputDx = 0;
            player.inputDy = touchDy;
          }
        }

        if (this._held.has('BOMB') && player.activeBombs < player.maxBombs) {
          emitEvent(engine, id, { type: EVENT.BOMB_PLACEMENT_INTENT });
        }
        if (this._justPressed.has('DETONATE') && player.canDetonate) {
          emitEvent(engine, id, { type: EVENT.BOMB_DETONATION_INTENT });
        }
      }
    }

    this._justPressed.clear();
  }

  // Zone positions anchor D-pad to the left edge and BOMB/DETONATE/SELECT/START
  // to the right edge and centre, so they stay in the correct corners regardless
  // of how wide the canvas is in landscape.
  _zones() {
    const w = this.ctx.canvas.width;
    return {
      UP:       { x: 53,        y: 258, w: 50, h: 50, arrow: 'up' },
      LEFT:     { x: 3,         y: 308, w: 50, h: 50, arrow: 'left' },
      RIGHT:    { x: 103,       y: 308, w: 50, h: 50, arrow: 'right' },
      DOWN:     { x: 53,        y: 358, w: 50, h: 45, arrow: 'down' },
      BOMB:     { x: w - 152,   y: 298, w: 55, h: 55, label: 'S', circle: true },
      DETONATE: { x: w - 70,    y: 298, w: 55, h: 55, label: 'D', circle: true },
      SELECT:   { x: w/2 - 58,  y: 368, w: 55, h: 30, label: 'SELECT' },
      START:    { x: w/2 + 4,   y: 368, w: 55, h: 30, label: 'START' },
    };
  }

  draw() {
    if (!this._visible) return;
    for (const [name, zone] of Object.entries(this._zones())) {
      this._drawZone(this.ctx, zone, this._held.has(name));
    }
  }

  _zoneAt(x, y) {
    for (const [name, z] of Object.entries(this._zones())) {
      if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return name;
    }
    return null;
  }

  _canvasPos(e) {
    const rect = this.ctx.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.ctx.canvas.width  / rect.width),
      y: (e.clientY - rect.top)  * (this.ctx.canvas.height / rect.height),
    };
  }

  _onDown(e) {
    e.preventDefault();
    const { x, y } = this._canvasPos(e);
    const zone = this._zoneAt(x, y);

    if (!zone) {
      this._visible = !this._visible;
      return;
    }

    if (!this._visible) return;

    this._pointers.set(e.pointerId, zone);
    this._justPressed.add(zone);
  }

  _onMove(e) {
    e.preventDefault();
    if (!this._pointers.has(e.pointerId)) return;
    const { x, y } = this._canvasPos(e);
    const next = this._zoneAt(x, y);
    const prev = this._pointers.get(e.pointerId);
    if (next !== prev) {
      this._pointers.set(e.pointerId, next);
      // Slide into a non-one-shot zone counts as a press
      if (next && !ONE_SHOT.has(next)) this._justPressed.add(next);
    }
  }

  _onUp(e) {
    this._pointers.delete(e.pointerId);
  }

  _drawZone(ctx, zone, pressed) {
    const { x, y, w, h, label, arrow, circle } = zone;
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();

    if (arrow) {
      ctx.globalAlpha = pressed ? 1.0 : 0.55;
      ctx.fillStyle = '#fff';
      this._drawArrow(ctx, cx, cy, arrow);
    } else if (circle) {
      const r = Math.min(w, h) / 2 - 2;
      ctx.globalAlpha = pressed ? 0.85 : 0.4;
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = pressed ? 1.0 : 0.65;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy);
    } else {
      ctx.globalAlpha = pressed ? 0.75 : 0.4;
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 8);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = pressed ? 1.0 : 0.65;
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${label.length > 2 ? 11 : 16}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy);
    }

    ctx.restore();
  }

  _drawArrow(ctx, cx, cy, dir) {
    const s = 11;
    ctx.beginPath();
    switch (dir) {
      case 'up':    ctx.moveTo(cx,     cy - s); ctx.lineTo(cx + s, cy + s); ctx.lineTo(cx - s, cy + s); break;
      case 'down':  ctx.moveTo(cx,     cy + s); ctx.lineTo(cx + s, cy - s); ctx.lineTo(cx - s, cy - s); break;
      case 'left':  ctx.moveTo(cx - s, cy);     ctx.lineTo(cx + s, cy - s); ctx.lineTo(cx + s, cy + s); break;
      case 'right': ctx.moveTo(cx + s, cy);     ctx.lineTo(cx - s, cy - s); ctx.lineTo(cx - s, cy + s); break;
    }
    ctx.closePath();
    ctx.fill();
  }
}

export class TouchRenderSystem {
  constructor(touchInput) {
    this.name = 'touch-render';
    this.runsWhenPaused = true;
    this._input = touchInput;
  }

  apply() {
    this._input.draw();
  }
}
