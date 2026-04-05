// Enemy AI state — movement intent and decision-making parameters
export class AIComponent {
  constructor(stats) {
    this.dirX = 0;
    this.dirY = 0;
    this.speed = 0;
    this.canPass = stats.can_pass;
    this.actionFrequency = stats.action_frequency;
    this.framesBetweenActions = stats.frames_between_actions;
    this.recentlyActed = false;
    this.debounceLeft = 0;
  }
}
