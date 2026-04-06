export class RenderComponent {
  constructor({ sprite = null, width = 32, height = 32, layer = 0, spriteKey = null } = {}) {
    this.sprite = sprite;
    this.width = width;
    this.height = height;
    this.layer = layer;
    this.spriteKey = spriteKey; // static sprite lookup key (no animation)
  }
}
