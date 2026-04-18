import { STATE, TYPE } from '../ecs/config.js';
import { GAME_STATE, ENEMY, TRANSFORM, ANIMATION, PLAYER, HEALTH, COLLISION } from '../components';

const STATE_NAMES = Object.fromEntries(Object.entries(STATE).map(([k, v]) => [v, k]));

const flag = (label, val) => `<span style="color:${val ? '#0f0' : '#888'}">${label}</span>`;
const val  = (label, v)   => `<span style="color:#ff0">${label}:<b>${v}</b></span>`;

export class DebugSystem {
  constructor() {
    this.name = 'debug';
    this.runsWhenPaused = true;
    this.el = document.getElementById('debug');
    this._dtHistory = [];
  }

  apply(engine, dt) {
    if (!this.el) return;

    const gameState = engine.getSingleton(GAME_STATE);

    const playerId  = gameState?.players[0];
    const player    = playerId ? engine.getComponent(playerId, PLAYER)    : null;
    const health    = playerId ? engine.getComponent(playerId, HEALTH)    : null;
    const transform = playerId ? engine.getComponent(playerId, TRANSFORM) : null;
    const anim      = playerId ? engine.getComponent(playerId, ANIMATION) : null;
    const collision = playerId ? engine.getComponent(playerId, COLLISION) : null;

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
      lines.push(
        `<b>MAP &nbsp;</b> ` +
        val('enemies', `${gameState.enemies.filter(id => engine.getComponent(id, ENEMY)?.alive).length}/${gameState.enemies.length}`) + ' &nbsp; ' +
        val('bombs', gameState.bombs.length) + ' &nbsp; ' +
        val('flames', gameState.flames.length) + ' &nbsp; ' +
        val('softblocks', gameState.softBlocks.length) + ' &nbsp; ' +
        val('powerups', gameState.powerups.length) + ' &nbsp; ' +
        flag('door', !!gameState.door)
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
        flag('isDying', health?.isDying) + ' &nbsp; ' +
        flag('deathAnimStarted', health?.deathAnimStarted) + ' &nbsp; ' +
        flag('canDetonate', player?.canDetonate) + ' &nbsp; ' +
        flag('canPassBomb', collision?.canPass & TYPE.BOMB) + ' &nbsp; ' +
        flag('canPassWall', collision?.canPass & TYPE.SOFT_BLOCK) + ' &nbsp; ' +
        flag('fireproof', player?.fireproof)
      );
    }

    this.el.innerHTML = lines.join('<br>');
  }
}
