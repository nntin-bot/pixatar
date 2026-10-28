import { fnv1a32 } from './bytes.js';
import { normalizeSeed, seedFromProfile } from './seed.js';
import type { CharacterProfile } from './vendor.js';

const hex2 = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');

function hslHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${hex2(f(0))}${hex2(f(8))}${hex2(f(4))}`;
}

/**
 * The background a character's avatar sits on: a soft colour hashed from its seed code, so
 * it is the same wherever the character is drawn and changes whenever the character does.
 * Takes a seed (code or text) or a profile.
 */
export function backgroundColor(seedOrProfile: string | CharacterProfile): string {
  const code =
    typeof seedOrProfile === 'string' ? normalizeSeed(seedOrProfile) : seedFromProfile(seedOrProfile);
  const h = fnv1a32(`${code}#background`);
  return hslHex(h % 360, 0.45 + ((h >>> 9) % 20) / 100, 0.72 + ((h >>> 17) % 10) / 100);
}
