# Publishing the npm package

`packages/pixatar` is ready to publish except for its name, which is still to be decided. Until then `"private": true` in its `package.json` stops an accidental `npm publish`.

To publish:

1. In `packages/pixatar/package.json`, set `"name"` (for example `pixatar`, which is free on npm as of 2026-10-28, or a scoped `@<scope>/pixatar`), set `"version"`, and remove `"private": true`. For a scoped public package, add `"publishConfig": { "access": "public" }`.
2. Update the import in `apps/web` if the name changed: the `pixatar` alias in `apps/web/vite.config.ts` and `apps/web/tsconfig.json`, and the dependency in `apps/web/package.json`.
3. Check what will ship: `npm pack --dry-run --workspace packages/pixatar` (CI runs this too). It should list `dist/index.js`, `dist/index.d.ts`, `dist/cli.js` (the `pixatar` command), the source maps, `README.md`, `LICENSE`, `LICENSE-pixel-agents` (the bundled upstream's notice) and `package.json`.
4. `npm publish --workspace packages/pixatar`. `prepack` builds it, baking the pinned wardrobe in first.

The published package has no runtime dependency on Pixel Agents: its sources and wardrobe art are bundled into `dist/index.js`. Its only dependency is `fflate`.

## The Python client

`python/` isn't on PyPI yet. Projects install it from this repository (see [python/README.md](python/README.md)). To publish it:

1. Publish the npm package first. The Python client runs its `pixatar` command, so the install instructions should name a version that exists.
2. In `python/pyproject.toml`, set `"name"` (`pixatar` on PyPI, or another) and `"version"`. Keep it in step with the npm package, so a Python release names the CLI it was tested with.
3. In `python/README.md`, change the install steps to `npm install --global <name>` and `pip install <name>`.
4. `python -m build python` and `twine upload python/dist/*`.
