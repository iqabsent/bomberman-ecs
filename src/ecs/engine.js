export class Engine {
  constructor() {
    this.entities = new Set();
    this.components = new Map();
    this.systems = new Map();
    this.singletons = new Map();
    this._index = new Map();
    this.tick = this.tick.bind(this);
    this.running = false;
    this.paused = false;
  }

  addComponent(entityId, component) {
    if (!this.components.has(entityId)) {
      this.components.set(entityId, new Map());
      this.entities.add(entityId);
    }
    const type = component.constructor.type;
    this.components.get(entityId).set(type, component);
    if (!this._index.has(type)) this._index.set(type, new Set());
    this._index.get(type).add(entityId);
  }

  removeComponent(entityId, componentName) {
    const map = this.components.get(entityId);
    if (map) map.delete(componentName);
    this._index.get(componentName)?.delete(entityId);
  }

  getComponent(entityId, componentName) {
    const components = this.components.get(entityId);
    return components ? components.get(componentName) : undefined;
  }

  removeEntity(entityId) {
    const map = this.components.get(entityId);
    if (map) {
      for (const type of map.keys()) this._index.get(type)?.delete(entityId);
    }
    this.entities.delete(entityId);
    this.components.delete(entityId);
  }

  query(componentType) {
    return this._index.get(componentType) ?? new Set();
  }


  registerSingleton(component) {
    this.singletons.set(component.constructor.type, component);
  }

  getSingleton(componentName) {
    return this.singletons.get(componentName);
  }

  registerSystem(name, system) {
    this.systems.set(name, system);
  }

  start() {
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this.tick);
    }
  }

  stop() {
    this.running = false;
  }

  tick(time) {
    const rawDt = this._lastTime ? (time - this._lastTime) / (1000 / 60) : 0;
    const dt = Math.min(rawDt, 3);
    this._lastTime = time;

    for (const system of this.systems.values()) {
      if (this.paused && !system.runsWhenPaused) continue;
      system.apply(this, dt);
    }
    if (this.running) requestAnimationFrame(this.tick);
  }
}
