export class BombComponent {
  static type = 'BombComponent';
  constructor({ bombYield, ownerId }) {
    this.yield = bombYield;
    this.ownerId = ownerId;
    this.chained = false;
  }
}
