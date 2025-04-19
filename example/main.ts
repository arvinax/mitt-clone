import mitt from '../src';

type Events = {
  greet: string;
};

const emitter = mitt<Events>();

emitter.on('greet', (msg) => {
  console.log(`Greet received: ${msg}`);
});

document.getElementById('emit')?.addEventListener('click', () => {
  emitter.emit('greet', 'Hello from mitt clone!');
});
