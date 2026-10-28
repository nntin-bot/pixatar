/**
 * pixatar: deterministic Pixel Agents characters. A seed (any text, or a seed code) makes a
 * character profile; the profile is drawn by Pixel Agents' own renderer as a sprite sheet
 * and as an avatar on a background colour derived from the seed.
 */

import { backgroundColor } from './background.js';
import { canonicalProfile } from './canonical.js';
import type { RgbaImage } from './image.js';
import { encodePng } from './png.js';
import {
  type AvatarOptions,
  type FrameOptions,
  renderAvatar,
  renderFrame,
  renderSheet,
  renderSprites,
  type SheetOptions,
} from './render.js';
import { profileFromSeed, seedFromProfile } from './seed.js';
import type { CharacterDirectionSprites, CharacterProfile } from './vendor.js';

export { backgroundColor } from './background.js';
export { canonicalProfile } from './canonical.js';
export { PixatarError, type PixatarErrorCode } from './errors.js';
export type { RgbaImage } from './image.js';
export { encodePng } from './png.js';
export {
  AVATAR_SIZE,
  type AvatarOptions,
  type Direction,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  type FrameOptions,
  renderAvatar,
  renderFrame,
  renderSheet,
  renderSprites,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  type SheetOptions,
} from './render.js';
export {
  isSeedCode,
  normalizeSeed,
  profileFromCode,
  profileFromSeed,
  profileFromText,
  randomSeed,
  SEED_PREFIX,
  seedFromProfile,
} from './seed.js';
export {
  CHARACTER_PROFILE_VERSION,
  type CharacterColor,
  type CharacterDirectionSprites,
  type CharacterProfile,
  SHEET_FRAMES,
  TYPE_FRAME_DURATION_SEC,
  WALK_FRAME_DURATION_SEC,
} from './vendor.js';
export { VENDOR } from './generated/wardrobe.js';
/** The decoded wardrobe pixatar draws with (upstream's Wardrobe): for tools that drive upstream's own editor. */
export { getWardrobe } from './wardrobe.js';

/** A character, everything about it derived from its seed. */
export interface Pixatar {
  /** Its seed code: give it back to pixatar() for this exact character. */
  seed: string;
  /** Its Pixel Agents character profile (what the Characters view's "Load config" reads). */
  profile: CharacterProfile;
  /** Its avatar's background, #rrggbb. */
  background: string;
  sheet(options?: SheetOptions): RgbaImage;
  frame(options?: FrameOptions): RgbaImage;
  avatar(options?: AvatarOptions): RgbaImage;
  sheetPng(options?: SheetOptions): Uint8Array;
  avatarPng(options?: AvatarOptions): Uint8Array;
  sprites(): CharacterDirectionSprites;
}

/** The character a seed (any text, or a seed code) or a profile stands for. */
export function pixatar(seedOrProfile: string | CharacterProfile): Pixatar {
  const profile =
    typeof seedOrProfile === 'string' ? profileFromSeed(seedOrProfile) : canonicalProfile(seedOrProfile);
  const seed = seedFromProfile(profile);
  const background = backgroundColor(profile);
  const avatarOptions = (options: AvatarOptions = {}): AvatarOptions => ({ background, ...options });
  return {
    seed,
    profile,
    background,
    sheet: (options) => renderSheet(profile, options),
    frame: (options) => renderFrame(profile, options),
    avatar: (options) => renderAvatar(profile, avatarOptions(options)),
    sheetPng: (options) => encodePng(renderSheet(profile, options)),
    avatarPng: (options) => encodePng(renderAvatar(profile, avatarOptions(options))),
    sprites: () => renderSprites(profile),
  };
}
