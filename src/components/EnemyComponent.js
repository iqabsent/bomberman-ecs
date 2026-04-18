export class EnemyComponent {
  constructor({ type, stats }) {
    this.type = type;
    this.points = stats.points;
    this.speed = 0;
    this.actionFrequency = stats.action_frequency;
    this.framesBetweenActions = stats.frames_between_actions;
    this.recentlyActed = false;
    this.debounceLeft = 0;
  }
}
