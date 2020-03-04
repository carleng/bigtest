import { Operation } from 'effection';
import { EventEmitter } from 'events';

import { compile } from './pattern';
export { any } from './pattern';
import { suspend } from './suspend';
import { ensure } from './ensure';

function isEventTarget(target): target is EventTarget { return typeof target.addEventListener === 'function'; }

export class Mailbox {
  private subscriptions = new EventEmitter();
  private messages = new Set();

  static *subscribe(
    emitter: EventEmitter | EventTarget,
    events: string | string[],
    prepare: (event: { event: string; args: unknown[] }) => unknown = x => x
  ): Operation {
    let mailbox = new Mailbox();

    yield suspend(mailbox.subscribe(emitter, events, prepare));

    return mailbox;
  }

  send(message: unknown) {
    this.messages.add(message);
    this.subscriptions.emit('message', message);
  }

  receive(pattern: unknown = undefined): Operation {
    let match = compile(pattern);

    return ({ resume, ensure }) => {
      let dispatch = (message: unknown) => {
        if (this.messages.has(message) && match(message)) {
          this.messages.delete(message);
          resume(message);
          return true;
        }
      }

      for (let message of this.messages) {
        if (dispatch(message)) {
          return;
        };
      }

      this.subscriptions.on('message', dispatch);
      ensure(() => this.subscriptions.off('message', dispatch));
    };
  }

  *subscribe(
    emitter: EventEmitter | EventTarget,
    events: string | string[],
    prepare: (event: { event: string; args: unknown[] }) => unknown = x => x
  ): Operation {
    for (let name of [].concat(events)) {
      let listener = (...args) => {
        this.send(prepare({ event: name, args }));
      }

      if(isEventTarget(emitter)) {
        emitter.addEventListener(name, listener);
        yield suspend(ensure(() => emitter.removeEventListener(name, listener)));
      } else {
        emitter.on(name, listener);
        yield suspend(ensure(() => emitter.off(name, listener)));
      }
    }
  }
}
