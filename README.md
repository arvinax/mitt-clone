# mitt-clone

[![npm version](https://img.shields.io/npm/v/mitt-clone.svg)](https://www.npmjs.com/package/mitt-clone)
[![bundle size](https://img.shields.io/bundlephobia/minzip/mitt-clone)](https://bundlephobia.com/package/mitt-clone)
[![license](https://img.shields.io/npm/l/mitt-clone)](https://github.com/yourusername/mitt-clone/blob/main/LICENSE)

> Tiny (~200B) functional event emitter / pubsub.

- **Tiny**: Just ~200 bytes minzipped
- **Fast**: Ultra-high performance
- **TypeScript**: Written in TypeScript, with complete type definitions
- **Zero Dependencies**: No external dependencies
- **Modern**: ES modules & CommonJS builds
- **Familiar API**: Same API as Node's EventEmitter

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

const emitter = mitt();

// Listen to an event
emitter.on('foo', (e) => console.log('foo', e));

// Listen to all events
emitter.on('*', (type, e) => console.log(type, e));

// Fire an event
emitter.emit('foo', { a: 'b' });

// Clear all events
emitter.all.clear();

// Working with handler references:
function onFoo() {}
emitter.on('foo', onFoo); // Register a handler
emitter.off('foo', onFoo); // Remove specific handler
```

## API

### mitt()

Creates a new event emitter and returns it.

```js
import mitt from 'mitt-clone';

const emitter = mitt(all?: Map);
```

### emitter.on(type, handler)

Register an event handler for the given type.

```js
emitter.on('foo', (e) => console.log('foo', e));

// Listen to all events
emitter.on('*', (type, e) => console.log(type, e));
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

Invoke all handlers for the given type, with the given event.

```js
emitter.emit('foo', { a: 'b' });
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

```typescript
import mitt, { Emitter, EventType } from 'mitt-clone';

// Define events
type Events = {
  foo: string;
  bar?: number;
};

const emitter: Emitter<Events> = mitt();

emitter.on('foo', (e) => {
  console.log(e.toUpperCase());
});
emitter.on('bar', (e) => {
  if (e) console.log(e * 2);
});
```

## License

MIT © Arvin Nazeri

## Credits

Inspired by [mitt](https://github.com/developit/mitt) by Jason Miller.
