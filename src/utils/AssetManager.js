import { IMG_DATA, ANI_DATA, ASSET_PATH } from '../ecs/config.js';

export class AssetManager {
  constructor() {
    this.sprites = new Map();
    this.animations = new Map();
    this.loaded = false;
  }

  async loadAssets() {
    const promises = [];

    for (const [key, filename] of Object.entries(IMG_DATA)) {
      promises.push(this.loadSprite(key, ASSET_PATH + filename));
    }

    for (const [key, data] of Object.entries(ANI_DATA)) {
      promises.push(this.loadAnimation(key, data));
    }

    await Promise.all(promises);
    this.loaded = true;
    return this;
  }

  loadSprite(key, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.sprites.set(key, img); resolve(img); };
      img.onerror = () => {
        const ph = this.createPlaceholder(key);
        this.sprites.set(key, ph);
        resolve(ph);
      };
      img.src = src;
    });
  }

  loadAnimation(key, data) {
    const keyLower = key.toLowerCase();
    const framePromises = [];

    for (let i = 0; i < data.frames; i++) {
      framePromises.push(this.loadImage(ASSET_PATH + keyLower + i + '.gif'));
    }

    return Promise.all(framePromises).then((frames) => {
      // Symmetric animations mirror back: 0,1,2,3 → 0,1,2,3,2,1,0
      if (data.symmetric) {
        for (let i = data.frames - 2; i >= 0; i--) {
          frames.push(frames[i]);
        }
      }
      this.animations.set(key, frames);
    });
  }

  // Resolves to an Image (or placeholder canvas) without caching under a key
  loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(this.createPlaceholder(src));
      img.src = src;
    });
  }

  getSprite(key) {
    return this.sprites.get(key) || this.createPlaceholder(key);
  }

  getAnimation(key) {
    return this.animations.get(key);
  }

  createPlaceholder(label) {
    const canvas = document.createElement('canvas');
    canvas.width = 30;
    canvas.height = 26;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f0f';
    ctx.fillRect(0, 0, 30, 26);
    ctx.fillStyle = '#fff';
    ctx.font = '8px Arial';
    ctx.fillText(String(label).slice(-6), 2, 13);
    return canvas;
  }

  isLoaded() {
    return this.loaded;
  }
}

export const assetManager = new AssetManager();
