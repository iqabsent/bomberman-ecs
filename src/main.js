import { Engine } from './ecs/engine.js';
import { createPlayer } from './entities/Player.js';
import { GameStateComponent } from './components/GameStateComponent.js';
import { SoundComponent } from './components/SoundComponent.js';
import { BombSystem } from './systems/BombSystem.js';
import { ExplosionSystem } from './systems/ExplosionSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { AnimationSystem } from './systems/AnimationSystem.js';
import { EnemySystem } from './systems/EnemySystem.js';
import { PlayerSystem } from './systems/PlayerSystem.js';
import { LevelSystem } from './systems/LevelSystem.js';
import { MapSystem } from './systems/MapSystem.js';
import { MusicSystem } from './systems/MusicSystem.js';
import { CollectibleSystem } from './systems/CollectibleSystem.js';
import { DestroyableSystem } from './systems/DestroyableSystem.js';
import { CameraSystem } from './systems/CameraSystem.js';
import { DebugSystem } from './systems/DebugSystem.js';
import { SoundSystem } from './systems/SoundSystem.js';
import { TimerSystem } from './systems/TimerSystem.js';
import { InputSystem } from './systems/InputSystem.js';
import { MovementSystem } from './systems/MovementSystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { assetManager } from './utils/AssetManager.js';
import { soundManager } from './utils/SoundManager.js';
import { SFX } from './utils/SFX.js';
import { MUSIC } from './utils/MUSIC.js';

const init = async () => {
  await assetManager.loadAssets();
  soundManager.load(SFX);
  soundManager.loadMusic(MUSIC);

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const engine = new Engine();

  // Register systems in order of execution
  engine.registerSystem('level',       new LevelSystem());
  engine.registerSystem('map',         new MapSystem());
  engine.registerSystem('enemy',       new EnemySystem());
  engine.registerSystem('timer',       new TimerSystem());
  engine.registerSystem('input',       new InputSystem());
  engine.registerSystem('collision',   new CollisionSystem());
  engine.registerSystem('collectible', new CollectibleSystem());
  engine.registerSystem('bomb',        new BombSystem());
  engine.registerSystem('explosion',   new ExplosionSystem());
  engine.registerSystem('movement',    new MovementSystem());
  engine.registerSystem('animation',   new AnimationSystem());
  engine.registerSystem('destroyable', new DestroyableSystem());
  engine.registerSystem('player',      new PlayerSystem());
  engine.registerSystem('sound',       new SoundSystem());
  engine.registerSystem('music',       new MusicSystem());
  engine.registerSystem('camera',      new CameraSystem());
  engine.registerSystem('render',      new RenderSystem(ctx));
  engine.registerSystem('debug',       new DebugSystem());

  // Create game state entity — starts in STATE.LOADING, handled on first tick
  const gameEntity = { id: 'game-state' };
  engine.addEntity(gameEntity);
  const gameState = new GameStateComponent();
  engine.addComponent(gameEntity.id, gameState);
  engine.registerSingleton(gameState);
  engine.addComponent(gameEntity.id, new SoundComponent());

  // Create and register the player entity
  const player = createPlayer();
  engine.addEntity(player);
  engine.addComponent(player.id, player.transform);
  engine.addComponent(player.id, player.render);
  engine.addComponent(player.id, player.velocity);
  engine.addComponent(player.id, player.animation);
  engine.addComponent(player.id, player.player);
  engine.addComponent(player.id, player.health);
  engine.addComponent(player.id, player.collision);
  engine.addComponent(player.id, player.destroyable);
  engine.addComponent(player.id, player.sound);

  // Retry music on any user interaction — unlocks autoplay after page load
  const onInteraction = () => soundManager.retryMusic();
  window.addEventListener('keydown',    onInteraction, { once: false });
  window.addEventListener('pointerdown', onInteraction, { once: false });

  engine.start();
};

window.addEventListener('DOMContentLoaded', init);
