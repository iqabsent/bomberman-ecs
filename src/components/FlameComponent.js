// Flame (explosion tile) — tracks grid position and remaining life
export class FlameComponent {
  constructor(gridX, gridY, type, fuseTicks) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;    // C | T | B | L | R | H | V
    this.fuseTicks = fuseTicks;
  }
}
