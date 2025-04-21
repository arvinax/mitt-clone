export type EventType = string | symbol;

export type Handler<T = unknown> = (event: T) => void | Promise<void>;
export type WildcardHandler<T = Record<string, unknown>> = (
  type: keyof T,
  event: T[keyof T]
) => void | Promise<void>;

// Options for the mitt instance
export interface MittOptions {
  /**
   * Enable debug logging for events
   */
  debug?: boolean;
}

// Store for tracking one-time handlers
export type EventHandlerSet<T = unknown> = Set<Handler<T>>;
export type WildcardEventHandlerSet<T = Record<string, unknown>> = Set<
  WildcardHandler<T>
>;

// Track one-time handlers
export type OneTimeHandlerMap<Events extends Record<EventType, unknown>> = Map<
  Handler<Events[keyof Events]> | WildcardHandler<Events>,
  boolean
>;

// Handler map using Set instead of Array for better performance
export type EventHandlerMap<Events extends Record<EventType, unknown>> = Map<
  keyof Events | '*',
  EventHandlerSet<Events[keyof Events]> | WildcardEventHandlerSet<Events>
>;

// Middleware type
export type Middleware<Events extends Record<EventType, unknown>> = <
  K extends keyof Events
>(
  type: K,
  event?: Events[K]
) =>
  | [K, Events[K] | undefined]
  | false
  | void
  | Promise<[K, Events[K] | undefined] | false | void>;

export interface Emitter<Events extends Record<EventType, unknown>> {
  /**
   * Map of event handlers
   */
  all: EventHandlerMap<Events>;

  /**
   * Map of one-time handlers
   */
  _oneTimeHandlers: OneTimeHandlerMap<Events>;

  /**
   * List of middleware functions
   */
  _middleware: Array<Middleware<Events>>;

  /**
   * Debug mode flag
   */
  _debug: boolean;

  /**
   * Register an event handler for a specific type
   */
  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;

  /**
   * Register a wildcard event handler
   */
  on(type: '*', handler: WildcardHandler<Events>): void;

  /**
   * Register a one-time event handler for a specific type
   */
  once<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>
  ): void;

  /**
   * Register a one-time wildcard event handler
   */
  once(type: '*', handler: WildcardHandler<Events>): void;

  /**
   * Remove an event handler for a specific type
   */
  off<Key extends keyof Events>(
    type: Key,
    handler?: Handler<Events[Key]>
  ): void;

  /**
   * Remove a wildcard event handler
   */
  off(type: '*', handler: WildcardHandler<Events>): void;

  /**
   * Emit an event for a specific type with payload
   */
  emit<Key extends keyof Events>(type: Key, event: Events[Key]): Promise<void>;

  /**
   * Emit an event for a specific type without payload (only for optional payload types)
   */
  emit<Key extends keyof Events>(
    type: undefined extends Events[Key] ? Key : never
  ): Promise<void>;

  /**
   * Clear all event handlers
   */
  clear(): void;

  /**
   * Clear all event handlers for a specific type
   */
  clear<Key extends keyof Events>(type: Key | '*'): void;

  /**
   * Add middleware to process events before they are emitted
   */
  use(middleware: Middleware<Events>): () => void;
}

export default function mitt<Events extends Record<EventType, unknown>>(
  options?: MittOptions | EventHandlerMap<Events>
): Emitter<Events> {
  // Handle different constructor signatures
  let all: EventHandlerMap<Events>;
  let debug = false;

  if (options instanceof Map) {
    all = options;
  } else {
    all = new Map();
    debug = options?.debug || false;
  }

  const oneTimeHandlers: OneTimeHandlerMap<Events> = new Map();
  const middleware: Array<Middleware<Events>> = [];

  return {
    all,
    _oneTimeHandlers: oneTimeHandlers,
    _middleware: middleware,
    _debug: debug,

    on<Key extends keyof Events>(
      type: Key | '*',
      handler: Handler<Events[Key]> | WildcardHandler<Events>
    ) {
      const handlers = all.get(type as string | symbol);

      if (handlers) {
        (handlers as Set<any>).add(handler);
      } else {
        all.set(type as string | symbol, new Set([handler]) as any);
      }
    },

    once<Key extends keyof Events>(
      type: Key | '*',
      handler: Handler<Events[Key]> | WildcardHandler<Events>
    ) {
      // Mark this handler as one-time
      oneTimeHandlers.set(handler as any, true);
      this.on(type as any, handler as any);
    },

    off<Key extends keyof Events>(
      type: Key | '*',
      handler?: Handler<Events[Key]> | WildcardHandler<Events>
    ) {
      const handlers = all.get(type as string | symbol);

      if (handlers) {
        if (handler) {
          (handlers as Set<any>).delete(handler);
          // Also clean up one-time handler reference
          oneTimeHandlers.delete(handler as any);
        } else {
          // Remove all handlers for this type
          all.set(type as string | symbol, new Set() as any);
          // Clean up one-time handlers for this type
          // (would need to iterate through all handlers, which we no longer have)
        }
      }
    },

    async emit<Key extends keyof Events>(type: Key, evt?: Events[Key]) {
      if (this._debug) {
        console.log(`[mitt] Emit "${String(type)}"`, evt);
      }

      // Apply middleware
      if (middleware.length) {
        let currentEvt = evt;
        let currentType = type;

        // Process through middleware chain
        for (const fn of middleware) {
          const result = await fn(currentType, currentEvt);
          if (result === false) {
            // Event cancelled by middleware
            return;
          } else if (Array.isArray(result)) {
            // Middleware modified the event
            [currentType, currentEvt] = result as [Key, Events[Key]];
          }
        }

        // Use the potentially modified values
        type = currentType;
        evt = currentEvt;
      }

      // Get handlers for this specific event type
      let handlers = all.get(type as string | symbol);
      if (handlers) {
        const handlerArray = [...(handlers as Set<any>)];

        // Execute all handlers
        const promises = handlerArray.map(async (handler) => {
          const result = handler(evt!);

          // If it's a one-time handler, remove it after execution
          if (oneTimeHandlers.has(handler)) {
            oneTimeHandlers.delete(handler);
            (handlers as Set<any>).delete(handler);
          }

          return result;
        });

        // Wait for all promises to resolve
        await Promise.all(promises);
      }

      // Process wildcard handlers
      handlers = all.get('*');
      if (handlers) {
        const handlerArray = [...(handlers as Set<WildcardHandler<Events>>)];

        const promises = handlerArray.map(async (handler) => {
          const result = handler(type, evt!);

          // If it's a one-time handler, remove it after execution
          if (oneTimeHandlers.has(handler)) {
            oneTimeHandlers.delete(handler);
            (handlers as Set<any>).delete(handler);
          }

          return result;
        });

        // Wait for all promises to resolve
        await Promise.all(promises);
      }
    },

    clear<Key extends keyof Events>(type?: Key | '*') {
      if (type) {
        // Clear specific event type
        all.set(type as string | symbol, new Set() as any);
      } else {
        // Clear all events
        all.clear();
      }

      // Clean up one-time handlers as appropriate
      if (!type) {
        oneTimeHandlers.clear();
      }
    },

    use(fn: Middleware<Events>) {
      middleware.push(fn);

      // Return a function to remove this middleware
      return () => {
        const index = middleware.indexOf(fn);
        if (index !== -1) middleware.splice(index, 1);
      };
    },
  };
}
