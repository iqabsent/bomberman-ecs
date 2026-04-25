// Flame (explosion tile) — tracks grid position and remaining life
export class FlameComponent {
  static type = 'FlameComponent';
  constructor({ type }) {
    this.type = type;    // C | T | B | L | R | H | V
  }
}
