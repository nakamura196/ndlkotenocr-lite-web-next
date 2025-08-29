import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true, // Enable TypeScript declarations
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'es2020',
  external: ['onnxruntime-web'],
  esbuildOptions(options) {
    options.platform = 'browser';
  }
});