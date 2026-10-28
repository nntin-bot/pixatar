# pixatar

Deterministic [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents) characters. A seed makes a character, the same seed always makes the same character, and pixatar draws it as:

- **a sprite sheet**: Pixel Agents' 128×96 character sheet (rows down, up, right; 8 frames each: walk ×3, type ×2, read ×2, seated)
- **an avatar**: Pixel Agents' own mug shot (the 20×20 head square of the front-facing sprite, centred on it) on a **background colour derived from the seed**

The wardrobe, the profile format, the randomizer and the renderer are Pixel Agents' own, bundled from a pinned checkout. When Pixel Agents adds parts (a seasonal theme, say), pixatar picks them up through a vendor bump and a version change.

Works in Node 22+ and in browsers. No canvas, no native code, one small dependency ([fflate](https://github.com/101arrowz/fflate)).

```js
import { pixatar } from 'pixatar';

const character = pixatar('octocat');
character.seed;         // 'px.ASMByrGtA8Oa…': this exact character, forever
character.background;   // '#d897a4'
character.avatarPng({ scale: 8 });  // Uint8Array, a 160×160 PNG
character.sheetPng();               // Uint8Array, the 128×96 sprite sheet
character.profile;                  // the Pixel Agents character profile
```

## Seeds

A seed is either **any text** or a **seed code** (`px.` followed by base64url).

- **A seed code is the character profile itself**, written compactly. Decoding it gives back exactly that profile, and any change to the character changes its code. A seed code never depends on chance, so it keeps its character across pixatar versions for as long as Pixel Agents keeps the parts it names.
- **Text** is hashed (FNV-1a) into a seeded run of Pixel Agents' own randomizer (the Characters view's 🎲). The same text gives the same character for a given wardrobe. A vendor bump that adds parts may deal text seeds differently; their codes stay put.

`normalizeSeed(text)` turns any seed into its seed code, so you can store the code and keep the character.

## API

| | |
| --- | --- |
| `pixatar(seedOrProfile)` | `{ seed, profile, background, sheet(), frame(), avatar(), sheetPng(), avatarPng(), sprites() }` |
| `profileFromSeed(seed)` | the character profile a seed stands for |
| `seedFromProfile(profile)` | its seed code (customise a profile, get its new seed) |
| `normalizeSeed(seed)` / `isSeedCode(seed)` / `randomSeed()` | |
| `backgroundColor(seedOrProfile)` | the avatar's background, `#rrggbb` |
| `renderSheet(profile, { scale, background })` | the sprite sheet, as RGBA |
| `renderFrame(profile, { direction, frame, scale, background })` | one 16×32 frame; `direction` is `down`, `up`, `right` or `left` (mirrored) |
| `renderAvatar(profile, { scale, background })` | the avatar, as RGBA; `background: null` for a transparent one |
| `renderSprites(profile)` | the sheet as Pixel Agents' office takes a character (hex pixel grids) |
| `encodePng(image)` | any of the above as PNG bytes |
| `SHEET_FRAMES`, `WALK_FRAME_DURATION_SEC`, `TYPE_FRAME_DURATION_SEC` | Pixel Agents' animation timings, to animate frames as the office does |
| `VENDOR` | the Pixel Agents version and commit this build draws with |

Images are `{ width, height, data }` with straight 8-bit RGBA (the shape of an `ImageData`), so in a browser `ctx.putImageData(new ImageData(image.data, image.width, image.height), 0, 0)` draws one.

A profile is Pixel Agents' character config: add a `name` and its Characters view loads it with **Load config**.

## Credits

Characters, wardrobe and renderer: [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents) (MIT). Its character art is based on [JIK-A-4's Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack) pack.
