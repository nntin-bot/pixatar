import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  // the vendor sources and the baked wardrobe are bundled in: the package depends on
  // nothing of Pixel Agents at runtime
  dts: { resolve: true },
  sourcemap: true,
  clean: true,
  target: 'es2022',
  platform: 'neutral',
});
