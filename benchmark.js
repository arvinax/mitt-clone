const Benchmark = require('benchmark');
const originalMitt = require('mitt');
const EventEmitter3 = require('eventemitter3');
const mittClone = require('./dist/mitt-clone.umd.js');

const suite = new Benchmark.Suite();

// Setup
const setupOriginalMitt = () => {
  const emitter = originalMitt();
  const handler = () => {};
  return { emitter, handler };
};

const setupMittClone = () => {
  const emitter = mittClone();
  const handler = () => {};
  return { emitter, handler };
};

const setupEE3 = () => {
  const emitter = new EventEmitter3();
  const handler = () => {};
  return { emitter, handler };
};

// Adding/removing a single handler
suite
  .add('mitt (original) - on/off', function () {
    const { emitter, handler } = setupOriginalMitt();
    emitter.on('event', handler);
    emitter.off('event', handler);
  })
  .add('mitt-clone - on/off', function () {
    const { emitter, handler } = setupMittClone();
    emitter.on('event', handler);
    emitter.off('event', handler);
  })
  .add('EventEmitter3 - on/off', function () {
    const { emitter, handler } = setupEE3();
    emitter.on('event', handler);
    emitter.off('event', handler);
  });

// Emitting events
suite
  .add('mitt (original) - emit', function () {
    const { emitter, handler } = setupOriginalMitt();
    emitter.on('event', handler);
    emitter.emit('event', { data: 'test' });
  })
  .add('mitt-clone - emit', function () {
    const { emitter, handler } = setupMittClone();
    emitter.on('event', handler);
    // Since our emit is async, we need to handle it differently in the benchmark
    emitter.emit('event', { data: 'test' });
  })
  .add('EventEmitter3 - emit', function () {
    const { emitter, handler } = setupEE3();
    emitter.on('event', handler);
    emitter.emit('event', { data: 'test' });
  });

// Wildcard handling
suite
  .add('mitt (original) - wildcard', function () {
    const { emitter } = setupOriginalMitt();
    emitter.on('*', (type, e) => {});
    emitter.emit('event1', { data: 'test1' });
    emitter.emit('event2', { data: 'test2' });
  })
  .add('mitt-clone - wildcard', function () {
    const { emitter } = setupMittClone();
    emitter.on('*', (type, e) => {});
    emitter.emit('event1', { data: 'test1' });
    emitter.emit('event2', { data: 'test2' });
  })
  .add('EventEmitter3 - wildcard', function () {
    const { emitter } = setupEE3();
    // EE3 uses a different wildcard syntax
    emitter.on('*', () => {});
    emitter.emit('event1', { data: 'test1' });
    emitter.emit('event2', { data: 'test2' });
  });

// Run the benchmarks
suite
  .on('cycle', function (event) {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
