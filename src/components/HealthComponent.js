export class HealthComponent {
  static type = 'HealthComponent';
  constructor() {
    this.isDying = false;
    this.deathAnimStarted = false;
    this.immune = false;
  }
}
