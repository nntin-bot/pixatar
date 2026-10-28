# pixatar

Deterministic [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents) character avatars, like identicons: a seed always makes the same character, as a sprite sheet and as an avatar on a background colour derived from the seed.

- [`packages/pixatar`](packages/pixatar): the npm package (seed → profile → sprite sheet / avatar), and its `pixatar` command. See its [README](packages/pixatar/README.md).
- [`python`](python): the Python client. It makes the same PNGs from Python by running the `pixatar` command (needs Node 22+). See its [README](python/README.md) for requirements, installation and usage.
- [`apps/web`](apps/web): the web app, deployed to GitHub Pages. Type free text (or paste a seed code) and watch the character animate, then customise it in Pixel Agents' own Characters view. Every change makes a new seed, and the address bar always holds the current one. **Transparent avatar** switches the avatar PNG's background, and the choice is saved in the seed code. The sprite sheet is always transparent.

### Web app addresses

- `#px.<code>`: a seed code, decoded exactly as it always was.
- `#t.<text>`: a free-text seed (URL-encoded, so `#t.px.hello` is the text `px.hello`, not a code). The app uses this form while the box's text makes the character and the avatar has its background colour. Otherwise the address is the code.
- `#<anything else>`: read as free text, as before.
- [`vendor/pixel-agents`](https://github.com/pixel-agents-hq/pixel-agents): the pinned upstream (git submodule). The wardrobe, renderer and randomizer come from here.

## Development

```sh
git submodule update --init
npm ci
npm test          # the package's tests
npm run dev       # the web app on http://localhost:5173
npm run build     # the package (packages/pixatar/dist) and the web app (apps/web/dist)

# the Python client's tests, against the built CLI
pip install './python[test]'
cd python && PIXATAR_CLI="node $PWD/../packages/pixatar/dist/cli.js" pytest
```

The package bakes the pinned wardrobe into `packages/pixatar/src/generated/` (not committed) before every build, test and typecheck.

## Moving the Pixel Agents pin

```sh
git -C vendor/pixel-agents fetch && git -C vendor/pixel-agents checkout <commit>
npm test
```

Snapshot tests pin what a few text seeds deal and draw, and `test/fixtures/legacy-seeds.json` pins what existing seed codes decode to (that one must never change). If a bump changes them on purpose (new parts, redrawn art), update the snapshots with `npx vitest run -u` in `packages/pixatar` and say so in the release notes. Seed codes don't change with a bump. The tests also check that the compact seed tables still cover every slot and colour key upstream has, and say what to append if not.

## Publishing the package

See [PUBLISHING.md](PUBLISHING.md).
