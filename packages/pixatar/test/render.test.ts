import { createHash } from 'node:crypto';

import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import {
  AVATAR_SIZE,
  backgroundColor,
  encodePng,
  normalizeSeed,
  pixatar,
  profileFromText,
  renderAvatar,
  renderFrame,
  renderSheet,
  type RgbaImage,
  SHEET_HEIGHT,
  SHEET_WIDTH,
} from '../src/index.js';

const md5 = (image: RgbaImage) => createHash('md5').update(image.data).digest('hex');
const pixel = (image: RgbaImage, x: number, y: number) => {
  const i = (y * image.width + x) * 4;
  return Array.from(image.data.subarray(i, i + 4));
};
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

describe('the sprite sheet', () => {
  it('is upstream’s 128x96 sheet, the same every time', () => {
    const sheet = renderSheet(profileFromText('octocat'));
    expect([sheet.width, sheet.height]).toEqual([SHEET_WIDTH, SHEET_HEIGHT]);
    expect(md5(renderSheet(profileFromText('octocat')))).toBe(md5(sheet));
    expect(sheet.data.some((v, i) => i % 4 === 3 && v > 0)).toBe(true);
  });

  it('is pinned for this wardrobe (a vendor bump that redraws it shows here)', () => {
    expect(['octocat', 'nntin', 'pixel agents'].map((s) => md5(renderSheet(profileFromText(s))))).toMatchSnapshot();
  });

  it('scales by whole pixels and can sit on a colour', () => {
    const one = renderSheet(profileFromText('octocat'));
    const big = renderSheet(profileFromText('octocat'), { scale: 3, background: '#102030' });
    expect([big.width, big.height]).toEqual([SHEET_WIDTH * 3, SHEET_HEIGHT * 3]);
    expect(pixel(big, 0, 0)).toEqual([16, 32, 48, 255]);
    for (const [x, y] of [[5, 6], [40, 50], [100, 80]] as const) {
      if (pixel(one, x, y)[3] === 255) expect(pixel(big, x * 3 + 2, y * 3 + 1)).toEqual(pixel(one, x, y));
    }
    expect(() => renderSheet(profileFromText('x'), { scale: 1.5 })).toThrow(RangeError);
  });
});

describe('frames', () => {
  it('face left as the right row mirrored', () => {
    const p = profileFromText('nntin');
    const right = renderFrame(p, { direction: 'right', frame: 1 });
    const left = renderFrame(p, { direction: 'left', frame: 1 });
    for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) expect(pixel(left, x, y)).toEqual(pixel(right, 15 - x, y));
  });
});

describe('the avatar', () => {
  it('is the mug shot on the character’s background colour', () => {
    const p = profileFromText('octocat');
    const avatar = renderAvatar(p, { scale: 4 });
    expect([avatar.width, avatar.height]).toEqual([AVATAR_SIZE * 4, AVATAR_SIZE * 4]);
    const bg = backgroundColor(p);
    expect(pixel(avatar, 0, 0)).toEqual([...rgb(bg), 255]);
    expect(pixel(avatar, avatar.width - 1, avatar.height - 1)[3]).toBe(255);
    // the head: some pixel isn't background
    expect(avatar.data.some((v, i) => i % 4 < 3 && v !== rgb(bg)[i % 4])).toBe(true);
    const clear = renderAvatar(p, { background: null });
    expect(pixel(clear, 0, 0)[3]).toBe(0);
  });
});

describe('the background colour', () => {
  it('follows the character, whichever way it is named', () => {
    const p = profileFromText('octocat');
    const bg = backgroundColor(p);
    expect(bg).toMatch(/^#[0-9a-f]{6}$/);
    expect(backgroundColor('octocat')).toBe(bg);
    expect(backgroundColor(normalizeSeed('octocat'))).toBe(bg);
    const others = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((s) => backgroundColor(s)));
    expect(others.size).toBeGreaterThan(5);
  });
});

describe('PNG output', () => {
  it('decodes back to the same pixels', () => {
    const avatar = renderAvatar(profileFromText('octocat'), { scale: 2 });
    const png = PNG.sync.read(Buffer.from(encodePng(avatar)));
    expect([png.width, png.height]).toEqual([avatar.width, avatar.height]);
    expect(Buffer.compare(png.data, Buffer.from(avatar.data))).toBe(0);
  });
});

describe('pixatar()', () => {
  it('is one character from a seed, a code or a profile', () => {
    const a = pixatar('octocat');
    expect(pixatar(a.seed).profile).toEqual(a.profile);
    expect(pixatar(a.profile).seed).toBe(a.seed);
    expect(a.background).toBe(backgroundColor('octocat'));
    expect(md5(a.avatar())).toBe(md5(renderAvatar(a.profile)));
    expect(a.sheetPng().subarray(1, 4)).toEqual(Uint8Array.of(80, 78, 71));
    expect(a.sprites().down).toHaveLength(8);
  });
});
