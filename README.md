# mitt-clone

[![npm version](https://img.shields.io/npm/v/mitt-clone.svg)](https://www.npmjs.com/package/mitt-clone)
[![bundle size](https://img.shields.io/bundlephobia/minzip/mitt-clone)](https://bundlephobia.com/package/mitt-clone)
[![license](https://img.shields.io/npm/l/mitt-clone)](https://github.com/yourusername/mitt-clone/blob/main/LICENSE)

> Enhanced event emitter library with powerful features while maintaining small size.

- **TypeSafe**: Fully typed with TypeScript with excellent type inference
- **Async Support**: Handle async event handlers and await events
- **Middleware**: Transform, filter, or log events through middleware
- **Performance**: Uses Map + Set for increased performance
- **Zero Dependencies**: No external dependencies
- **Modern**: ES modules & CommonJS builds
- **Once**: Support for one-time event handlers

## Installation

```bash
npm install mitt-clone
# or
yarn add mitt-clone
# or
pnpm add mitt-clone
```

## Usage

```js
import mitt from 'mitt-clone';

// Create a new emitter
const emitter = mitt();

// Listen to an event
emitter.on('foo', (e) => console.log('foo', e));

// Listen to an event once (auto-removes after first trigger)
emitter.once('bar', (e) => console.log('This triggers only once', e));

// Listen to all events
emitter.on('*', (type, e) => console.log(type, e));

// Fire an event
await emitter.emit('foo', { a: 'b' });

// Remove a specific handler
emitter.off('foo', onFoo);

// Remove all handlers for an event
emitter.off('foo');

// Clear all handlers for all events
emitter.clear();

// Clear all handlers for a specific event
emitter.clear('foo');

// Using async handlers
emitter.on('async', async (data) => {
  await someAsyncOperation(data);
  console.log('Async operation complete');
});

// Emit waits for all handlers to complete
await emitter.emit('async', { id: 1 });
console.log('All handlers have completed');

// Using middleware
const removeMiddleware = emitter.use((type, event) => {
  console.log(`Processing event: ${String(type)}`);

  // You can transform the event
  if (type === 'foo') {
    return [type, { ...event, processed: true }];
  }

  // Return nothing to pass the event through unchanged
  // Return false to cancel the event
});

// Remove middleware when done
removeMiddleware();

// Enable debug mode
const debugEmitter = mitt({ debug: true });
```

## API

### mitt(options?)

Creates a new event emitter and returns it.

```js
import mitt from 'mitt-clone';

// Create an emitter with default settings
const emitter = mitt();

// Create an emitter with debug mode enabled
const debugEmitter = mitt({ debug: true });
```

### emitter.on(type, handler)

Register an event handler for the given type.

```js
// Regular event
emitter.on('foo', (e) => console.log('foo', e));

// Listen to all events
emitter.on('*', (type, e) => console.log(type, e));
```

### emitter.once(type, handler)

Register a one-time event handler for the given type. The handler will be automatically removed after being called once.

```js
// Will only be triggered once
emitter.once('foo', (e) => console.log('foo', e));
```

### emitter.off(type, handler?)

Remove an event handler for the given type.

```js
// Remove a specific handler from 'foo'
emitter.off('foo', handler);

// Remove all handlers from 'foo'
emitter.off('foo');
```

### emitter.emit(type, event?)

Invoke all handlers for the given type with the given event. Returns a Promise that resolves when all handlers have completed.

```js
// With regular handlers
await emitter.emit('foo', { a: 'b' });

// With async handlers
emitter.on('process', async (data) => {
  await processData(data);
});

await emitter.emit('process', myData);
console.log('Processing complete');
```

### emitter.clear(type?)

Clear all event handlers or handlers for a specific type.

```js
// Clear all handlers
emitter.clear();

// Clear handlers for a specific event type
emitter.clear('foo');
```

### emitter.use(middleware)

Add middleware to process events before they are emitted. Returns a function to remove the middleware.

```js
const removeMiddleware = emitter.use((type, event) => {
  // Log the event
  console.log(`Event: ${String(type)}`, event);

  // Transform the event
  if (type === 'user') {
    return [type, { ...event, timestamp: Date.now() }];
  }

  // Cancel the event
  if (type === 'forbidden') {
    return false;
  }

  // Pass through unchanged (return nothing)
});

// Later, remove the middleware
removeMiddleware();
```

### emitter.all

A Map of all registered event handlers.

```js
// Clear all handlers
emitter.all.clear();

// Get all handlers for a type
const handlers = emitter.all.get('foo');
```

## TypeScript Usage

The library provides excellent type inference:

```typescript
import mitt, { Emitter } from 'mitt-clone';

// Define your event types
type Events = {
  foo: string;
  bar?: number; // Optional event parameter
  user: { id: string; name: string };
};

// Create a typed emitter
const emitter: Emitter<Events> = mitt();

// Correct usage - TypeScript knows the payload types
emitter.on('foo', (message) => {
  console.log(message.toUpperCase()); // TypeScript knows message is a string
});

emitter.on('user', (user) => {
  console.log(user.id, user.name); // TypeScript knows the user shape
});

// TypeScript will error on incorrect types
emitter.emit('foo', 123); // Error: number is not assignable to string
emitter.emit('user', { wrong: 'shape' }); // Error: missing required properties

// Async handlers with correct types
emitter.on('user', async (user) => {
  const userData = await fetchUserData(user.id);
  console.log(userData);
});

// TypeScript correctly handles wildcards
emitter.on('*', (type, event) => {
  // TypeScript knows that:
  // - if type is 'foo', then event is a string
  // - if type is 'user', then event has id and name properties
  if (type === 'foo') {
    console.log(event.toUpperCase()); // TypeScript knows event is a string
  }
  if (type === 'user') {
    console.log(event.id); // TypeScript knows event has an id property
  }
});
```

## Performance

mitt-clone uses Set instead of Array for handler storage, resulting in improved performance for adding and removing handlers.

You can run the benchmarks to compare performance with the original mitt and EventEmitter3:

```bash
npm run benchmark
```

## License

MIT © Arvin Nazeri

## Credits

Inspired by [mitt](https://github.com/developit/mitt) by Jason Miller.
