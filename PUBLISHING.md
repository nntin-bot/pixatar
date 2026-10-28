# Publishing the npm package

`packages/pixatar` is ready to publish except for its name, which is still to be decided. Until then `"private": true` in its `package.json` stops an accidental `npm publish`.

To publish:

1. In `packages/pixatar/package.json`, set `"name"` (for example `pixatar`, which is free on npm as of 2026-10-28, or a scoped `@<scope>/pixatar`), set `"version"`, and remove `"private": true`. For a scoped public package, add `"publishConfig": { "access": "public" }`.
2. Update the import in `apps/web` if the name changed: the `pixatar` alias in `apps/web/vite.config.ts` and `apps/web/tsconfig.json`, and the dependency in `apps/web/package.json`.
3. Check what will ship: `npm pack --dry-run --workspace packages/pixatar` (CI runs this too). It should list `dist/index.js`, `dist/index.d.ts`, the source map, `README.md`, `LICENSE`, `LICENSE-pixel-agents` (the bundled upstream's notice) and `package.json`.
4. `npm publish --workspace packages/pixatar`. `prepack` builds it, baking the pinned wardrobe in first.

The published package has no runtime dependency on Pixel Agents: its sources and wardrobe art are bundled into `dist/index.js`. Its only dependency is `fflate`.
