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
