import { STATE } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { EnemyComponent } from '../components/EnemyComponent.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';

const STATE_NAMES = Object.fromEntries(Object.entries(STATE).map(([k, v]) => [v, k]));

const flag = (label, val) => `<span style="color:${val ? '#0f0' : '#888'}">${label}</span>`;
const val  = (label, v)   => `<span style="color:#ff0">${label}:<b>${v}</b></span>`;

export class DebugSystem {
  constructor() {
    this.name = 'debug';
    this.runsWhenPaused = true;
    this.el = document.getElementById('debug');
  }

  apply(engine) {
    if (!this.el) return;

    const gameState = engine.getSingleton(GameStateComponent);

    let player = null;
    let health = null;
    let transform = null;
    let anim = null;
    for (const [id] of engine.entities.entries()) {
      player = engine.getComponent(id, PlayerComponent);
      if (!player) continue;
      health    = engine.getComponent(id, HealthComponent);
      transform = engine.getComponent(id, TransformComponent);
      anim      = engine.getComponent(id, AnimationComponent);
      break;
    }

    const lines = [];

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
        val('enemies', `${gameState.enemies.filter(id => engine.getComponent(id, EnemyComponent)?.alive).length}/${gameState.enemies.length}`) + ' &nbsp; ' +
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
        flag('canPassBomb', player?.canPassBomb) + ' &nbsp; ' +
        flag('canPassWall', player?.canPassWall) + ' &nbsp; ' +
        flag('fireproof', player?.fireproof)
      );
    }

    this.el.innerHTML = lines.join('<br>');
  }
}
