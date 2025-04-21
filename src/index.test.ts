import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mitt, { Emitter } from './index';

describe('mitt-clone', () => {
  let events: Emitter<{
    foo: string;
    bar?: number;
    baz: { a: string };
    empty: undefined;
  }>;

  beforeEach(() => {
    events = mitt();
  });

  afterEach(() => {
    events.clear();
  });

  describe('basic functionality', () => {
    it('should register handlers and emit events', async () => {
      const fn = vi.fn();
      events.on('foo', fn);
      await events.emit('foo', 'test');
      expect(fn).toHaveBeenCalledWith('test');
    });

    it('should support multiple handlers', async () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      events.on('foo', fn1);
      events.on('foo', fn2);
      await events.emit('foo', 'test');
      expect(fn1).toHaveBeenCalledWith('test');
      expect(fn2).toHaveBeenCalledWith('test');
    });

    it('should support optional event parameters', async () => {
      const fn = vi.fn();
      events.on('bar', fn);
      await events.emit('bar');
      expect(fn).toHaveBeenCalledWith(undefined);
    });

    it('should remove specific handlers', async () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      events.on('foo', fn1);
      events.on('foo', fn2);
      events.off('foo', fn1);
      await events.emit('foo', 'test');
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledWith('test');
    });

    it('should remove all handlers for a type when no handler is specified', async () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      events.on('foo', fn1);
      events.on('foo', fn2);
      events.off('foo');
      await events.emit('foo', 'test');
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
    });

    it('should handle wildcard events', async () => {
      const wildcard = vi.fn();
      events.on('*', wildcard);
      await events.emit('foo', 'test');
      await events.emit('bar', 42);
      expect(wildcard).toHaveBeenCalledTimes(2);
      expect(wildcard).toHaveBeenCalledWith('foo', 'test');
      expect(wildcard).toHaveBeenCalledWith('bar', 42);
    });
  });

  describe('once', () => {
    it('should handle one-time event handlers', async () => {
      const fn = vi.fn();
      events.once('foo', fn);
      await events.emit('foo', 'test');
      await events.emit('foo', 'test2');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('test');
    });

    it('should handle one-time wildcard handlers', async () => {
      const wildcard = vi.fn();
      events.once('*', wildcard);
      await events.emit('foo', 'test');
      await events.emit('bar', 42);
      expect(wildcard).toHaveBeenCalledTimes(1);
      expect(wildcard).toHaveBeenCalledWith('foo', 'test');
    });

    it('should properly clean up one-time handlers when removed with off', async () => {
      const fn = vi.fn();
      events.once('foo', fn);
      events.off('foo', fn);
      await events.emit('foo', 'test');
      expect(fn).not.toHaveBeenCalled();
      expect(events._oneTimeHandlers.size).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all event handlers', async () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const wildcard = vi.fn();
      events.on('foo', fn1);
      events.on('bar', fn2);
      events.on('*', wildcard);
      events.clear();
      await events.emit('foo', 'test');
      await events.emit('bar', 42);
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
      expect(wildcard).not.toHaveBeenCalled();
    });

    it('should clear handlers for a specific event type', async () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const wildcard = vi.fn();
      events.on('foo', fn1);
      events.on('bar', fn2);
      events.on('*', wildcard);
      events.clear('foo');
      await events.emit('foo', 'test');
      await events.emit('bar', 42);
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledWith(42);
      expect(wildcard).toHaveBeenCalledTimes(2);
    });
  });

  describe('async handlers', () => {
    it('should support async handlers', async () => {
      const result: string[] = [];
      events.on('foo', async (event) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        result.push(event);
      });
      await events.emit('foo', 'test');
      expect(result).toEqual(['test']);
    });

    it('should wait for all handlers to complete', async () => {
      const result: string[] = [];
      events.on('foo', async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        result.push('first');
      });
      events.on('foo', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        result.push('second');
      });
      await events.emit('foo', 'test');
      expect(result).toContain('first');
      expect(result).toContain('second');
      expect(result.length).toBe(2);
    });
  });

  describe('middleware', () => {
    it('should support middleware for transforming events', async () => {
      const fn = vi.fn();
      events.on('foo', fn);

      events.use((type, event) => {
        if (type === 'foo') {
          return [type, (event + '!') as any];
        }
      });

      await events.emit('foo', 'test');
      expect(fn).toHaveBeenCalledWith('test!');
    });

    it('should allow middleware to cancel events', async () => {
      const fn = vi.fn();
      events.on('foo', fn);

      events.use(() => false);

      await events.emit('foo', 'test');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should allow removing middleware', async () => {
      const fn = vi.fn();
      events.on('foo', fn);

      const cancel = events.use(() => false);
      await events.emit('foo', 'test');
      expect(fn).not.toHaveBeenCalled();

      cancel(); // Remove the middleware
      await events.emit('foo', 'test');
      expect(fn).toHaveBeenCalledWith('test');
    });

    it('should support async middleware', async () => {
      const fn = vi.fn();
      events.on('foo', fn);

      events.use(async (type, event) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (type === 'foo') {
          return [type, (event + ' processed') as any];
        }
      });

      await events.emit('foo', 'test');
      expect(fn).toHaveBeenCalledWith('test processed');
    });
  });

  describe('debug mode', () => {
    it('should log events in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const debugEvents = mitt<{ test: string }>({ debug: true });

      await debugEvents.emit('test', 'value');

      expect(consoleSpy).toHaveBeenCalledWith('[mitt] Emit "test"', 'value');
      consoleSpy.mockRestore();
    });
  });

  describe('type safety', () => {
    it('should enforce correct event types', () => {
      // These lines should typecheck correctly
      events.on('foo', (_: string) => {});
      events.on('bar', (_?: number) => {});
      events.on('baz', (_: { a: string }) => {});

      // The following would cause compile-time errors:
      // @ts-expect-error - incorrect event type
      events.emit('foo', 123);

      // @ts-expect-error - incorrect event type
      events.emit('bar', 'string');

      // @ts-expect-error - incorrect event type
      events.emit('baz', { b: 5 });
    });
  });
});
