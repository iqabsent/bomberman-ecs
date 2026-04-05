export class Engine {
  constructor() {
    this.entities = new Map();
    this.components = new Map();
    this.systems = new Map();
    this.singletons = new Map();
    this.tick = this.tick.bind(this);
    this.running = false;
    this.paused = false;
  }

  addEntity(entity) {
    this.entities.set(entity.id, entity);
  }

  removeEntity(entityId) {
    this.entities.delete(entityId);
    this.components.delete(entityId);
  }

  addComponent(entityId, component) {
    if (!this.components.has(entityId)) this.components.set(entityId, new Map());
    this.components.get(entityId).set(component.constructor.name, component);
  }

  getComponent(entityId, componentClass) {
    const components = this.components.get(entityId);
    return components ? components.get(componentClass.name) : undefined;
  }

  registerSingleton(component) {
    this.singletons.set(component.constructor.name, component);
  }

  getSingleton(componentClass) {
    return this.singletons.get(componentClass.name);
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
    for (const system of this.systems.values()) {
      if (this.paused && !system.runsWhenPaused) continue;
      system.apply(this, time);
    }
    if (this.running) requestAnimationFrame(this.tick);
  }
}
