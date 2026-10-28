/**
 * Stands in for upstream's characters/loadWardrobe.ts (see vite.config.ts): the same three
 * exports, with the wardrobe pixatar baked instead of a second decode of the art.
 * decodePng and decodeItemPng are upstream's, for the PNGs a person loads into the editor.
 */

import { getWardrobe } from 'pixatar';

import { decodeSheet } from '../../../../vendor/pixel-agents/webview-ui/src/characters/sheet.js';
import type { Rgba, Wardrobe } from '../../../../vendor/pixel-agents/webview-ui/src/characters/wardrobe.js';

export async function decodePng(url: string): Promise<Rgba> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

export const loadWardrobe = (): Promise<Wardrobe> => Promise.resolve(getWardrobe());

export async function decodeItemPng(png: string): Promise<Uint8ClampedArray | null> {
  try {
    return decodeSheet(await decodePng(`data:image/png;base64,${png}`));
  } catch {
    return null;
  }
}
