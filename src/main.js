import { DEBUG_MODE } from './ecs/config.js';
import { Engine } from './ecs/engine.js';
import { createPlayer } from './entities/Player.js';
import { GAME_STATE_ENTITY } from './components/index.js';
import { GameStateComponent } from './components/GameStateComponent.js';
import { SoundComponent } from './components/SoundComponent.js';
import { AnimationSystem } from './systems/AnimationSystem.js';
import { BombSystem } from './systems/BombSystem.js';
import { CameraSystem } from './systems/CameraSystem.js';
import { CollectibleSystem } from './systems/CollectibleSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { DebugSystem } from './systems/DebugSystem.js';
import { DestroyableSystem } from './systems/DestroyableSystem.js';
import { EnemySystem } from './systems/EnemySystem.js';
import { ExplosionSystem } from './systems/ExplosionSystem.js';
import { InputSystem } from './systems/InputSystem.js';
import { TouchInputSystem, TouchRenderSystem } from './systems/TouchControlSystem.js';
import { LevelSystem } from './systems/LevelSystem.js';
import { MapSystem } from './systems/MapSystem.js';
import { MovementSystem } from './systems/MovementSystem.js';
import { MusicSystem } from './systems/MusicSystem.js';
import { PlayerSystem } from './systems/PlayerSystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { SoundSystem } from './systems/SoundSystem.js';
import { TimerSystem } from './systems/TimerSystem.js';
import { assetManager } from './utils/AssetManager.js';
import { MUSIC } from './utils/MUSIC.js';
import { SFX } from './utils/SFX.js';
import { soundManager } from './utils/SoundManager.js';

const init = async () => {
  await assetManager.loadAssets();
  soundManager.load(SFX);
  soundManager.loadMusic(MUSIC);

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const engine = new Engine();
  const touchInput = new TouchInputSystem(ctx);

  // Register systems in order of execution
  engine.registerSystem('level',         new LevelSystem());
  engine.registerSystem('timer',         new TimerSystem());
  engine.registerSystem('input',         new InputSystem());
  engine.registerSystem('touch-input',   touchInput);
  engine.registerSystem('bomb',          new BombSystem());
  engine.registerSystem('explosion',     new ExplosionSystem());
  engine.registerSystem('movement',      new MovementSystem());
  engine.registerSystem('collision',     new CollisionSystem());
  engine.registerSystem('animation',     new AnimationSystem());
  engine.registerSystem('destroyable',   new DestroyableSystem());
  engine.registerSystem('map',           new MapSystem());
  engine.registerSystem('player',        new PlayerSystem());
  engine.registerSystem('collectible',   new CollectibleSystem());
  engine.registerSystem('enemy',         new EnemySystem());
  engine.registerSystem('sound',         new SoundSystem());
  engine.registerSystem('music',         new MusicSystem());
  engine.registerSystem('camera',        new CameraSystem());
  engine.registerSystem('render',        new RenderSystem(ctx));
  engine.registerSystem('touch-render',  new TouchRenderSystem(touchInput));

  if (DEBUG_MODE) engine.registerSystem('debug', new DebugSystem());

  // Create game state entity — starts in STATE.LOADING, handled on first tick
  const gameState = new GameStateComponent();
  engine.addComponent(GAME_STATE_ENTITY, gameState);
  engine.registerSingleton(gameState);

  const sound = new SoundComponent();
  engine.registerSingleton(sound);

  // Create and register the player entity
  gameState.players.push(createPlayer(engine));

  // Retry music on any user interaction — unlocks autoplay after page load
  const onInteraction = () => soundManager.retryMusic();
  window.addEventListener('keydown',    onInteraction, { once: false });
  window.addEventListener('pointerdown', onInteraction, { once: false });

  engine.start();
};

window.addEventListener('DOMContentLoaded', init);
