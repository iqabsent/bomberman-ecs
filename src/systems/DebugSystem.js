import { STATE, TYPE } from '../ecs/config.js';
import { BOMB, ENEMY, EVENTS, FLAME, GAME_STATE, SOFT_BLOCK, TRANSFORM, ANIMATION, PLAYER, DESTROYABLE, MOVABLE } from '../components';

const STATE_NAMES = Object.fromEntries(Object.entries(STATE).map(([k, v]) => [v, k]));

const flag = (label, val) => `<span style="color:${val ? '#0f0' : '#888'}">${label}</span>`;
const val  = (label, v)   => `<span style="color:#ff0">${label}:<b>${v}</b></span>`;

const EVENT_TTL = 180; // ticks (~3s at 60fps)

function abbreviateId(id) {
  return id
    .replace('game-state-entity', 'gse')
    .replace('softblock-', 'sb')
    .replace('enemy-', 'e')
    .replace('flame-', 'fl')
    .replace('bomb-', 'b')
    .replace('powerup', 'pu');
}

export class DebugSystem {
  constructor() {
    this.name = 'debug';
    this.runsWhenPaused = true;
    this.el = document.getElementById('debug');
    this._dtHistory = [];
    this._eventLog = new Map(); // key → { shortId, type, ttl }
  }

  apply(engine, dt) {
    if (!this.el) return;

    const gameState = engine.getSingleton(GAME_STATE);

    const player    = engine.getComponent('player', PLAYER);
    const destroyable = engine.getComponent('player', DESTROYABLE);
    const transform = engine.getComponent('player', TRANSFORM);
    const anim      = engine.getComponent('player', ANIMATION);
    const collision = engine.getComponent('player', MOVABLE);

    this._dtHistory.push(dt);
    if (this._dtHistory.length > 30) this._dtHistory.shift();
    const avgDt = this._dtHistory.reduce((s, v) => s + v, 0) / this._dtHistory.length;
    const fps   = Math.round(60 / avgDt);
    const ms    = (avgDt * (1000 / 60)).toFixed(1);

    const lines = [];
    lines.push(`<b>PERF &nbsp;</b> ` + val('fps', fps) + ' &nbsp; ' + val('ms', ms));

    if (gameState) {
      const stateName = STATE_NAMES[gameState.currentState] ?? gameState.currentState;
      lines.push(
        `<b>GAME</b> &nbsp; ` +
        val('state', stateName) + ' &nbsp; ' +
        val('level', gameState.currentLevel + 1) + ' &nbsp; ' +
        val('lives', gameState.lives) + ' &nbsp; ' +
        val('score', gameState.score)
      );
      const enemyIds = engine.query(ENEMY);
      const aliveEnemies = [...enemyIds].filter(id => engine.getComponent(id, DESTROYABLE)?.destroyState === null).length;
      lines.push(
        `<b>MAP &nbsp;</b> ` +
        val('enemies', `${aliveEnemies}/${enemyIds.size}`) + ' &nbsp; ' +
        val('bombs', engine.query(BOMB).size) + ' &nbsp; ' +
        val('flames', engine.query(FLAME).size) + ' &nbsp; ' +
        val('softblocks', engine.query(SOFT_BLOCK).size) + ' &nbsp; ' +
        val('powerup', engine.getComponent('powerup', DESTROYABLE) ? 1 : 0) + ' &nbsp; ' +
        flag('door', !!engine.getComponent('door', DESTROYABLE))
      );
    }

    if (player) {
      lines.push(
        `<b>PLAYER</b> &nbsp; ` +
        val('pos', transform ? `${Math.round(transform.x)},${Math.round(transform.y)}` : '?') + ' &nbsp; ' +
        val('bombs', `${player.activeBombs}/${player.maxBombs}`) + ' &nbsp; ' +
        val('yield', player.bombYield) + ' &nbsp; ' +
        val('invincible', player ? Math.round(player.invincibilityTimer) : 0) + ' &nbsp; ' +
        val('anim', anim ? anim.animationKey : '?') + ' &nbsp; ' +
        val('frame', anim ? anim.frame : '?')
      );
      lines.push(
        `<b>FLAGS &nbsp;</b> ` +
        val('destroyState', destroyable?.destroyState ?? 'null') + ' &nbsp; ' +
        flag('canDetonate', player?.canDetonate) + ' &nbsp; ' +
        flag('canPassBomb', collision?.canPass & TYPE.BOMB) + ' &nbsp; ' +
        flag('canPassWall', collision?.canPass & TYPE.SOFT_BLOCK) + ' &nbsp; ' +
        flag('fireproof', player?.fireproof)
      );
    }

    // Decay existing log entries
    for (const [key, entry] of this._eventLog) {
      entry.ttl -= dt;
      if (entry.ttl <= 0) this._eventLog.delete(key);
    }

    // Refresh/add events seen this frame
    for (const id of engine.entities) {
      const ec = engine.getComponent(id, EVENTS);
      if (!ec || !ec.queue.length) continue;
      const shortId = abbreviateId(id);
      for (const event of ec.queue) {
        this._eventLog.set(`${shortId}:${event.type}`, { shortId, type: event.type, ttl: EVENT_TTL });
      }
    }

    if (this._eventLog.size) {
      const parts = [...this._eventLog.values()].map(({ shortId, type, ttl }) => {
        const alpha = (ttl / EVENT_TTL).toFixed(2);
        return `<span style="color:rgba(0,255,255,${alpha})">${shortId}</span>` +
               `:<span style="color:rgba(255,255,255,${alpha})">${type}</span>`;
      });
      lines.push(`<b>EVT &nbsp;</b> ` + parts.join(' &nbsp; '));
    }

    this.el.innerHTML = lines.join('<br>');
  }
}
