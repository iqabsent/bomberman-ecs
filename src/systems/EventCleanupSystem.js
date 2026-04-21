import { EVENTS } from '../components';

// Runs first each tick. Clears all event queues so events live for exactly one
// frame. Add new event types to events.js; no changes needed here.
export class EventCleanupSystem {
  constructor() {
    this.name = 'event-cleanup';
    this.runsWhenPaused = true;
  }

  apply(engine) {
    for (const id of engine.entities) {
      const ec = engine.getComponent(id, EVENTS);
      if (ec) ec.queue.length = 0;
    }
  }
}
