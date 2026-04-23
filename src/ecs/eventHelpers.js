import { EVENTS } from '../components';
import { EventComponent } from '../components/EventComponent.js';

export function emitEvent(engine, id, event) {
  let ec = engine.getComponent(id, EVENTS);
  if (!ec) { ec = new EventComponent(); engine.addComponent(id, ec); }
  ec.queue.push(event);
}

export function getEvent(engine, id, type) {
  return engine.getComponent(id, EVENTS)?.queue.find(e => e.type === type) ?? null;
}

// Called at the start of each emitting system's apply(). Clears all events of
// the given type so consumers see at most one tick's worth of events.
export function clearEventsByType(engine, type) {
  for (const id of engine.entities) {
    const ec = engine.getComponent(id, EVENTS);
    if (!ec) continue;
    for (let i = ec.queue.length - 1; i >= 0; i--) {
      if (ec.queue[i].type === type) ec.queue.splice(i, 1);
    }
  }
}
