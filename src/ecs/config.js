export const TEST_MODE = true;
export const DEBUG_MODE = false;

// Game Type Enums
export const TYPE = {
  NOTHING: 0,
  PASSABLE: 1,
  SOFT_BLOCK: 2,
  HARD_BLOCK: 4,
  BOMB: 8,
  EXPLOSION: 16,
  POWER: 32,
  DOOR: 64,
  DESTROYABLE: 128
};

export const STATE = {
  ERROR: 0,
  TITLE: 1,
  LOADING: 2,
  LEVEL_START: 4,
  PLAYING: 8,
  PAUSED: 16,
  PLAYER_DIED: 32,
  LEVEL_CLEAR: 64,
  GAME_OVER: 128,
  GAME_WON: 256,
};

export const KEY = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  S: 83,
  D: 68,
  M: 77,
  ENTER: 13
};

export const SPAWN = {
  GAME_SPAWN: 'GAME_SPAWN',   // new game or restart from title
  LEVEL_SPAWN: 'LEVEL_SPAWN', // advancing to a new level
  RESPAWN: 'RESPAWN'          // retry same level after death
};

export const POWER = {
  FLAME: 0,
  BOMB: 1,
  SPEED: 2,
  DETONATE: 4,
  PASS_BOMB: 8,
  PASS_WALL: 16,
  FIREPROOF: 32,
  INVINCIBLE: 64
};

export const SPEED = {
  SLOWEST: 0.5,
  SLOW: 1.0,
  NORMAL: 1.5,
  FAST: 2.0
};

// Canvas and Game Board
export const MAX_CANVAS_HEIGHT = 600;
export const DEFAULT_CANVAS_WIDTH = 600;
export const DEFAULT_CANVAS_HEIGHT = 403;
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 403;
export const BLOCK_WIDTH = 30;
export const BLOCK_HEIGHT = 26;
export const MAP_WIDTH  = TEST_MODE ? 7 : 25;
export const MAP_HEIGHT = TEST_MODE ? 7 : 13;
export const OFFSET_X = 0;
export const OFFSET_Y = 65;
export const DRAG_TOLERANCE = 30;

// Game Mechanics
export const BOMB_FUSE_TIME = 9; // in frames
export const BOMB_FUSE_TICKS = 162;   // BOMB_FUSE_TIME(9) * ticks_per_frame(18)
export const BOMB_CHAIN_FUSE_TICKS = 9; // 0.5 frames * ticks_per_frame(18)
export const MAX_BOMBS = 10;
export const MAX_YIELD = 5;

// Animation frame timing — matches original BombObject/EnemyObject/_ticks_per_frame
export const ANIM_TICKS_PER_FRAME_PLAYER = 6;
export const ANIM_TICKS_PER_FRAME_SOFT_BLOCK = 6;
export const ANIM_TICKS_PER_FRAME_BOMB = 18;
export const ANIM_TICKS_PER_FRAME_ENEMY = 18;
export const ANIM_TICKS_PER_FRAME_EXPLOSION = 6;

// Render layer ordering (higher = drawn on top)
export const RENDER_LAYER_SOFT_BLOCK = 1;
export const RENDER_LAYER_DOOR = 2;
export const RENDER_LAYER_POWER_UP = 2;
export const RENDER_LAYER_BOMB = 3;
export const RENDER_LAYER_EXPLOSION = 4;
export const RENDER_LAYER_ENEMY = 5;
export const RENDER_LAYER_PLAYER = 6;

// Explosion lifetime
export const EXPLOSION_LIFETIME_TICKS = 36; // 6 frames * 6 ticks_per_frame

export const ONE_OVER_BLOCK_WIDTH = 1 / BLOCK_WIDTH;
export const ONE_OVER_BLOCK_HEIGHT = 1 / BLOCK_HEIGHT;
export const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
export const DEFAULT_LIVES = 2;
export const INVINCIBILITY_TIMER = 35000;
export const LEVEL_TIME = 200000;

// Enemy Configuration
export const ENEMY = {
  BALOM: {
    movement_speed: SPEED.SLOW,
    spawn_distance: 8,
    action_frequency: 0.08,
    frames_between_actions: 5,
    can_pass: TYPE.PASSABLE,
    points: 100
  },
  ONIL: {
    movement_speed: SPEED.NORMAL,
    spawn_distance: 16,
    action_frequency: 0.12,
    frames_between_actions: 2,
    can_pass: TYPE.PASSABLE,
    points: 200
  },
  DAHL: {
    movement_speed: SPEED.NORMAL,
    spawn_distance: 16,
    action_frequency: 0.12,
    frames_between_actions: 2,
    can_pass: TYPE.PASSABLE,
    points: 400
  },
  MINVO: {
    movement_speed: SPEED.FAST,
    spawn_distance: 16,
    action_frequency: 0.12,
    frames_between_actions: 2,
    can_pass: TYPE.PASSABLE,
    points: 800
  },
  DORIA: {
    movement_speed: SPEED.SLOWEST,
    spawn_distance: 16,
    action_frequency: 0.12,
    frames_between_actions: 2,
    can_pass: TYPE.PASSABLE | TYPE.SOFT_BLOCK,
    points: 2000
  },
  OVAPE: {
    movement_speed: SPEED.NORMAL,
    spawn_distance: 16,
    action_frequency: 0.12,
    frames_between_actions: 2,
    can_pass: TYPE.PASSABLE | TYPE.SOFT_BLOCK,
    points: 100
  },
  PASS: {
    movement_speed: SPEED.FAST,
    spawn_distance: 16,
    action_frequency: 0.12,
    frames_between_actions: 2,
    can_pass: TYPE.PASSABLE,
    points: 4000
  },
  PONTAN: {
    movement_speed: SPEED.NORMAL,
    spawn_distance: 16,
    action_frequency: 0.12,
    frames_between_actions: 2,
    can_pass: TYPE.PASSABLE | TYPE.SOFT_BLOCK,
    points: 8000
  }
};

// Level Progression
export const LEVEL = [
  { power: 'FLAME', enemies: { BALOM: 6 } },
  { power: 'BOMB', enemies: { BALOM: 3, ONIL: 3 } },
  { power: 'DETONATE', enemies: { BALOM: 2, ONIL: 2, DAHL: 2 } },
  { power: 'SPEED', enemies: { BALOM: 1, ONIL: 2, DAHL: 2, MINVO: 2 } },
  { power: 'BOMB', enemies: { ONIL: 4, DAHL: 3 } },
  { power: 'BOMB', enemies: { ONIL: 2, DAHL: 3, MINVO: 2 } },
  { power: 'FLAME', enemies: { ONIL: 2, DAHL: 3, OVAPE: 2 } },
  { power: 'DETONATE', enemies: { ONIL: 1, DAHL: 2, MINVO: 4 } },
  { power: 'PASS_BOMB', enemies: { ONIL: 1, DAHL: 1, MINVO: 4, DORIA: 1 } },
  { power: 'PASS_WALL', enemies: { ONIL: 1, DAHL: 1, MINVO: 1, OVAPE: 1, DORIA: 3 } },
  { power: 'BOMB', enemies: { ONIL: 1, DAHL: 2, MINVO: 3, OVAPE: 1, DORIA: 1 } },
  { power: 'BOMB', enemies: { ONIL: 1, DAHL: 1, MINVO: 1, OVAPE: 1, DORIA: 4 } },
  { power: 'DETONATE', enemies: { DAHL: 3, MINVO: 3, DORIA: 2 } },
  { power: 'PASS_BOMB', enemies: { OVAPE: 7, PASS: 1 } },
  { power: 'FLAME', enemies: { DAHL: 1, MINVO: 3, DORIA: 3, PASS: 1 } },
  { power: 'PASS_WALL', enemies: { MINVO: 3, DORIA: 4, PASS: 1 } },
  { power: 'BOMB', enemies: { DAHL: 5, DORIA: 2, PASS: 1 } },
  { power: 'PASS_BOMB', enemies: { BALOM: 3, ONIL: 3, PASS: 2 } },
  { power: 'BOMB', enemies: { BALOM: 1, OVAPE: 1, ONIL: 1, DAHL: 3, PASS: 2 } },
  { power: 'DETONATE', enemies: { ONIL: 1, DAHL: 1, MINVO: 1, OVAPE: 1, DORIA: 2, PASS: 2 } },
  { power: 'PASS_BOMB', enemies: { OVAPE: 3, DORIA: 4, PASS: 2 } },
  { power: 'DETONATE', enemies: { DAHL: 4, MINVO: 3, DORIA: 1, PASS: 1 } },
  { power: 'BOMB', enemies: { DAHL: 2, MINVO: 2, OVAPE: 2, DORIA: 2, PASS: 1 } },
  { power: 'DETONATE', enemies: { DAHL: 1, MINVO: 1, OVAPE: 2, DORIA: 4, PASS: 1 } },
  { power: 'PASS_BOMB', enemies: { ONIL: 2, DAHL: 1, MINVO: 1, OVAPE: 2, DORIA: 2, PASS: 1 } },
  { power: 'INVINCIBLE', enemies: { BALOM: 1, ONIL: 1, DAHL: 1, MINVO: 1, OVAPE: 1, DORIA: 2, PASS: 1 } },
  { power: 'FLAME', enemies: { BALOM: 1, ONIL: 1, OVAPE: 1, DORIA: 5, PASS: 1 } },
  { power: 'BOMB', enemies: { ONIL: 1, DAHL: 3, MINVO: 3, DORIA: 1, PASS: 1 } },
  { power: 'DETONATE', enemies: { OVAPE: 5, DORIA: 2, PASS: 2 } },
  { power: 'FIREPROOF', enemies: { DAHL: 3, MINVO: 2, OVAPE: 2, DORIA: 1, PASS: 1 } },
  { power: 'PASS_WALL', enemies: { ONIL: 2, DAHL: 2, MINVO: 2, OVAPE: 2, DORIA: 2 } },
  { power: 'BOMB', enemies: { ONIL: 1, DAHL: 1, MINVO: 3, DORIA: 4, PASS: 1 } },
  { power: 'DETONATE', enemies: { DAHL: 2, MINVO: 2, OVAPE: 1, DORIA: 3, PASS: 2 } },
  { power: 'INVINCIBLE', enemies: { DAHL: 2, MINVO: 3, DORIA: 3, PASS: 2 } },
  { power: 'PASS_BOMB', enemies: { DAHL: 2, MINVO: 1, OVAPE: 1, DORIA: 3, PASS: 2 } },
  { power: 'FIREPROOF', enemies: { DAHL: 2, MINVO: 2, DORIA: 3, PASS: 3 } },
  { power: 'DETONATE', enemies: { DAHL: 2, MINVO: 1, OVAPE: 1, DORIA: 3, PASS: 3 } },
  { power: 'FLAME', enemies: { DAHL: 2, MINVO: 2, DORIA: 3, PASS: 3 } },
  { power: 'PASS_WALL', enemies: { DAHL: 1, MINVO: 1, OVAPE: 2, DORIA: 2, PASS: 4 } },
  { power: 'INVINCIBLE', enemies: { DAHL: 1, MINVO: 2, DORIA: 3, PASS: 4 } },
  { power: 'DETONATE', enemies: { DAHL: 1, MINVO: 1, OVAPE: 1, DORIA: 3, PASS: 4 } },
  { power: 'PASS_WALL', enemies: { MINVO: 1, OVAPE: 1, DORIA: 3, PASS: 5 } },
  { power: 'PASS_BOMB', enemies: { MINVO: 1, OVAPE: 1, DORIA: 2, PASS: 6 } },
  { power: 'DETONATE', enemies: { MINVO: 1, OVAPE: 1, DORIA: 2, PASS: 6 } },
  { power: 'INVINCIBLE', enemies: { OVAPE: 2, DORIA: 2, PASS: 6 } },
  { power: 'PASS_WALL', enemies: { OVAPE: 2, DORIA: 2, PASS: 6 } },
  { power: 'PASS_BOMB', enemies: { OVAPE: 2, DORIA: 2, PASS: 6 } },
  { power: 'DETONATE', enemies: { OVAPE: 1, DORIA: 2, PASS: 6, PONTAN: 1 } },
  { power: 'FIREPROOF', enemies: { OVAPE: 2, DORIA: 1, PASS: 6, PONTAN: 1 } },
  { power: 'INVINCIBLE', enemies: { OVAPE: 2, DORIA: 1, PASS: 5, PONTAN: 2 } }
];

// Animation Data
export const ANI_DATA = {
  SOFT_BLOCK: { frames: 7 },
  MAN_UP: { frames: 3 },
  MAN_DOWN: { frames: 3 },
  MAN_LEFT: { frames: 3 },
  MAN_RIGHT: { frames: 3 },
  MAN_I_UP: { frames: 3 },
  MAN_I_DOWN: { frames: 3 },
  MAN_I_LEFT: { frames: 3 },
  MAN_I_RIGHT: { frames: 3 },
  MAN_DEATH: { frames: 7 },
  BALOM_LD: { frames: 3 },
  BALOM_RU: { frames: 3 },
  ONIL_LD: { frames: 3 },
  ONIL_RU: { frames: 3 },
  DAHL_LD: { frames: 3 },
  DAHL_RU: { frames: 3 },
  MINVO_LD: { frames: 3 },
  MINVO_RU: { frames: 3 },
  DORIA_LD: { frames: 3 },
  DORIA_RU: { frames: 3 },
  OVAPE_LD: { frames: 3 },
  OVAPE_RU: { frames: 3 },
  PASS_LD: { frames: 3 },
  PASS_RU: { frames: 3 },
  PONTAN_LD: { frames: 4 },
  PONTAN_RU: { frames: 4 },
  BOMB: { frames: 4 },
  EXPLO_C: { frames: 4, symmetric: true },
  EXPLO_T: { frames: 4, symmetric: true },
  EXPLO_B: { frames: 4, symmetric: true },
  EXPLO_L: { frames: 4, symmetric: true },
  EXPLO_R: { frames: 4, symmetric: true },
  EXPLO_H: { frames: 4, symmetric: true },
  EXPLO_V: { frames: 4, symmetric: true },
  ENEMY_DEATH: { frames: 4 }
};

// Image Asset Data
export const IMG_DATA = {
  HARD_BLOCK: 'hard_block.jpg',
  BALOM_DEATH: 'balom_death.gif',
  ONIL_DEATH: 'onil_death.gif',
  DAHL_DEATH: 'dahl_death.gif',
  MINVO_DEATH: 'minvo_death.gif',
  DORIA_DEATH: 'doria_death.gif',
  OVAPE_DEATH: 'ovape_death.gif',
  PASS_DEATH: 'pass_death.gif',
  PONTAN_DEATH: 'pontan_death.gif',
  DOOR: 'door.gif',
  POWER_FLAME: 'power_flame.gif',
  POWER_BOMB: 'power_bomb.gif',
  POWER_DETONATE: 'power_detonate.gif',
  POWER_SPEED: 'power_speed.gif',
  POWER_PASS_BOMB: 'power_pass_bomb.gif',
  POWER_PASS_WALL: 'power_pass_wall.gif',
  POWER_FIREPROOF: 'power_fireproof.gif',
  POWER_INVINCIBLE: 'power_invincible.gif'
};

export const ASSET_PATH = 'images/';

// In TEST_MODE, reduce every level to a single BALOM — power-ups unchanged
if (TEST_MODE) {
  for (const lvl of LEVEL) lvl.enemies = { BALOM: 1 };
  LEVEL[4].power = 'INVINCIBLE'; // test power-up animations earlier
}
