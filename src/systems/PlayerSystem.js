import { BLOCK_WIDTH, BLOCK_HEIGHT, STATE } from '../ecs/config.js';
import { GameStateComponent } from '../components/GameStateComponent.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { AnimationComponent } from '../components/AnimationComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { DestroyableComponent } from '../components/DestroyableComponent.js';
import { SoundComponent } from '../components/SoundComponent.js';

export class PlayerSystem {
  constructor() {
    this.name = 'player';
    this.lastTime = null;
  }

  apply(engine, time) {
    if (!this.lastTime) this.lastTime = time;
    const rawDt = (time - this.lastTime) / (1000 / 60);
    const dt = Math.min(rawDt, 3);
    this.lastTime = time;

    const gameState = engine.getSingleton(GameStateComponent);
    if (!gameState) return; // TODO: is this needed?
    if (gameState.currentState === STATE.LEVEL_CLEAR || gameState.currentState === STATE.PLAYER_DIED) {
      for (const [id] of engine.entities.entries()) {
        const player = engine.getComponent(id, PlayerComponent);
        if (!player) continue;
        const velocity = engine.getComponent(id, VelocityComponent);
        const anim     = engine.getComponent(id, AnimationComponent);
        if (velocity) { velocity.vx = 0; velocity.vy = 0; }
        if (anim)     anim.shouldAnimate = false;
      }
      return;
    }

    if (gameState.currentState !== STATE.PLAYING) return;

    for (const [id] of engine.entities.entries()) {
      const player = engine.getComponent(id, PlayerComponent);
      if (!player) continue;

      const health    = engine.getComponent(id, HealthComponent);
      const anim      = engine.getComponent(id, AnimationComponent);
      const transform = engine.getComponent(id, TransformComponent);
      const velocity  = engine.getComponent(id, VelocityComponent);
      if (!health || !anim || !transform || !velocity) continue;

      // Tick invincibility down every frame regardless of explosions
      if (player.invincibilityTimer > 0) {
        player.invincibilityTimer -= dt * (1000 / 60);
        if (player.invincibilityTimer < 0) player.invincibilityTimer = 0;
      }

      // Translate destroyable.burning → health.isDying
      const destroyable = engine.getComponent(id, DestroyableComponent);
      if (destroyable && destroyable.burning && !health.isDying) {
        health.isDying = true;
        destroyable.burning = false;
      }

      if (!health.isDying) continue;

      // First frame of death — kick off the animation
      if (!health.deathAnimStarted) {
        health.deathAnimStarted = true;
        velocity.vx = 0;
        velocity.vy = 0;
        anim.setAnimation('MAN_DEATH', false);
        anim.shouldAnimate = true;
        const sound = engine.getComponent(id, SoundComponent);
        if (sound) sound.request('burn');
        continue;
      }

      // Still playing — wait
      if (anim.shouldAnimate) continue;

      // Animation complete — handle death
      gameState.lives--;
      if (gameState.lives > 0) {
        // Zero velocity so player doesn't slide during miss screen
        velocity.vx = 0;
        velocity.vy = 0;
        // Leave health.isDying = true — LevelSystem clears it when LEVEL_START begins
        gameState.toPlayerDiedState();
      } else {
        // Game over — leave isDying true so input/collision stay disabled
        gameState.toGameOverState();
      }
    }
  }
}
