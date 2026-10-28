/**
 * The page's side of upstream's cast store: the Characters view edits the cast, and the
 * page reads the selected character back out of it, or puts a seed's character into it.
 */

import { type CharacterProfile, profileFromSeed, randomSeed } from 'pixatar';

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

/** The seed in the page's address (#<seed>), if any. */
export function seedFromLocation(): string | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  try {
    return decodeURIComponent(hash);
  } catch {
    return null;
  }
}

/** The seed the page starts on: the address's, else a new random one. */
export function startingSeed(): { seed: string; profile: CharacterProfile } {
  const seed = seedFromLocation();
  if (seed) {
    try {
      return { seed, profile: profileFromSeed(seed) };
    } catch {
      // not a seed we can read: start on a random one
    }
  }
  const random = randomSeed();
  return { seed: random, profile: profileFromSeed(random) };
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
