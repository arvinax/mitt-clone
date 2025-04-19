import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  root: '',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.ts',
      name: 'MittClone',
      fileName: 'mitt-clone',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [],
    },
  },
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
    }),
  ],
});
