/**
 * The page's side of upstream's cast store: the Characters view edits the cast, and the
 * page reads the selected character back out of it, or puts a seed's character into it.
 */

import { type AvatarBackground, type CharacterProfile, decodeSeed, isSeedCode, profileFromText, randomSeed } from 'pixatar';

import { parseCharacterProfiles } from '../../../vendor/pixel-agents/core/src/characterProfiles.js';
import { castStore } from '../../../vendor/pixel-agents/webview-ui/src/characters/castStore.js';
import { transport } from './shims/transport';

export { castStore, useCast } from '../../../vendor/pixel-agents/webview-ui/src/characters/castStore.js';

// A save is answered at once with the list as saved (there is no server to keep it), checked
// the way upstream's server checks one.
transport.setSendHandler((message) => {
  if (message.type !== 'saveCharacterProfiles') return;
  const profiles = parseCharacterProfiles(message.profiles);
  queueMicrotask(() => castStore.receiveProfiles(profiles, message.saveId, message.items ?? []));
});

const FIELDS_KEPT = new Set(['id', 'name']);

/** The two kinds of seed: free text (hashed into a character) and seed codes (px.…). */
export type SeedKind = 'text' | 'code';

export interface TypedSeed {
  kind: SeedKind;
  value: string;
}

/** What #t.<text> starts with: a free-text seed in the address (any text, px. included). */
export const TEXT_HASH_PREFIX = 't.';

/** The address (#<hash>) of a seed: #px.<code> for a code, #t.<text> for text. */
export const hashOf = ({ kind, value }: TypedSeed): string =>
  kind === 'code' ? `#${value}` : `#${TEXT_HASH_PREFIX}${encodeURIComponent(value)}`;

/**
 * The seed in the page's address, if any: #px.<code> is a seed code, #t.<text> free text,
 * and anything else (the address before #t. existed) free text too.
 */
export function seedFromLocation(): TypedSeed | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  try {
    const value = decodeURIComponent(hash);
    if (isSeedCode(value)) return { kind: 'code', value };
    if (hash.startsWith(TEXT_HASH_PREFIX)) return { kind: 'text', value: decodeURIComponent(hash.slice(TEXT_HASH_PREFIX.length)) };
    return { kind: 'text', value };
  } catch {
    return null;
  }
}

/** What a typed seed says: the character, and what its avatar sits on. Throws a PixatarError. */
export function readSeed({ kind, value }: TypedSeed): { profile: CharacterProfile; background: AvatarBackground | null } {
  // text says nothing about the background: the page's toggle stays as it is
  return kind === 'code' ? decodeSeed(value) : { profile: profileFromText(value), background: null };
}

/** The seed the page starts on: the address's, else a new random one. */
export function startingSeed(): TypedSeed & { profile: CharacterProfile; background: AvatarBackground } {
  const seed = seedFromLocation();
  if (seed) {
    try {
      const read = readSeed(seed);
      return { ...seed, profile: read.profile, background: read.background ?? 'color' };
    } catch {
      // not a seed we can read: start on a random one
    }
  }
  const value = randomSeed();
  return { kind: 'code', value, ...decodeSeed(value) };
}

/** Start the cast on one character. */
export function startCast(profile: CharacterProfile): void {
  castStore.receiveProfiles([{ ...profile, id: 'pixatar', name: 'Pixatar' }], undefined, []);
}

/** The character on the Characters view's stage, unsaved edits included. */
export function selectedProfile(state = castStore.getState()): CharacterProfile | undefined {
  return (state.draft ?? state.profiles)[state.current];
}

/** Dress the selected character as `profile` (one undo step; its id and name stay). */
export function wear(profile: CharacterProfile): void {
  castStore.update((draft) => {
    const fields = draft as unknown as Record<string, unknown>;
    for (const key of Object.keys(fields)) if (!FIELDS_KEPT.has(key)) delete fields[key];
    Object.assign(draft, structuredClone(profile));
  });
}
