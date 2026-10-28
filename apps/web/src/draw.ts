import type { RgbaImage } from 'pixatar';

/** Paint an image onto a canvas, sizing the canvas to it. */
export function paint(canvas: HTMLCanvasElement | null, image: RgbaImage): void {
  if (!canvas) return;
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx?.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
}

/** Offer bytes as a file download. */
export function download(filename: string, data: Uint8Array | string, type: string): void {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
