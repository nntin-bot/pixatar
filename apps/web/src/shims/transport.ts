/**
 * Stands in for upstream's transport (see vite.config.ts). The Characters view saves the
 * cast to a Pixel Agents server and waits for its answer; here the page is the server: a
 * save is answered at once with the list as saved. Nothing else upstream sends needs one.
 */

import type { ClientMessage } from '../../../../vendor/pixel-agents/core/src/messages.js';
import type { MessageTransport } from '../../../../vendor/pixel-agents/core/src/transport.js';

type Handler = (message: ClientMessage) => void;

class PageTransport implements MessageTransport {
  readonly state = 'connected' as const;
  readonly ready = Promise.resolve();
  private handler: Handler | null = null;

  /** Who answers what upstream sends. */
  setSendHandler(handler: Handler | null): void {
    this.handler = handler;
  }

  send(message: ClientMessage): void {
    this.handler?.(message);
  }

  onMessage(): () => void {
    return () => {};
  }

  onStateChange(): () => void {
    return () => {};
  }

  dispose(): void {}
}

export const transport = new PageTransport();
