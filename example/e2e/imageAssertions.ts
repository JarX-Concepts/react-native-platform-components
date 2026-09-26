import { readFile } from 'node:fs/promises';
import { expect as jestExpect } from '@jest/globals';
import { PNG } from 'pngjs';
import { imageColors } from './imageServer';
import { pause } from './testHelpers';

type Color = keyof typeof imageColors;

/** Check rendered pixels, not a callback or accessibility label for the image. */
export async function expectImageColors(
  screenshot: () => Promise<string>,
  present: Color[],
  absent: Color[] = []
) {
  let counts: Record<Color, number>;
  const deadline = Date.now() + 5000;
  do {
    const image = PNG.sync.read(await readFile(await screenshot()));
    counts = { blue: 0, orange: 0, green: 0, purple: 0 };
    for (let pixel = 0; pixel < image.data.length; pixel += 4) {
      for (const name of [...present, ...absent]) {
        if (
          imageColors[name].every(
            (channel, index) =>
              Math.abs(image.data[pixel + index]! - channel) <= 3
          )
        ) {
          counts[name] += 1;
        }
      }
    }
    if (
      present.every((name) => counts[name] > 100) &&
      absent.every((name) => counts[name] === 0)
    ) {
      return;
    }
    await pause(100);
  } while (Date.now() < deadline);
  for (const name of present) jestExpect(counts[name]).toBeGreaterThan(100);
  for (const name of absent) jestExpect(counts[name]).toBe(0);
}
