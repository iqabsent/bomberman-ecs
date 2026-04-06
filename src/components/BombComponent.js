export class BombComponent {
  constructor({ bombYield, ownerId }) {
    this.yield = bombYield;
    this.ownerId = ownerId;
    this.chained = false; // true when triggered by another explosion — bypasses canDetonate
  }
}
