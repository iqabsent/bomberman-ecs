export class VelocityComponent {
  static type = 'VelocityComponent';
  constructor({ vx = 0, vy = 0 } = {}) {
    this.vx = vx;
    this.vy = vy;
  }
}
