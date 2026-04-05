export class EnemyComponent {
  constructor(type, stats) {
    this.type = type;
    this.points = stats.points;
    this.alive = true;
    this.deathPhase = 0;    // 0=alive, 1=freeze, 2=death-anim
    this.deathWaitLeft = 0;
  }
}
