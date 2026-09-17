import { describe, expect, it } from 'vitest';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { toPoints } from './pose';

// toPoints() is the only unit-testable seam: the loader needs a browser
// (wasm + GPU) and is covered by driving the live page, not jsdom.
describe('toPoints', () => {
  it('maps landmarks to engine points, missing visibility reads as 0', () => {
    const raw = [
      { x: 0.1, y: 0.2, z: 0, visibility: 0.9 },
      // Runtime payloads sometimes omit visibility; the cast models that.
      { x: 0.3, y: 0.4, z: 0 },
    ] as unknown as NormalizedLandmark[];
    expect(toPoints(raw)).toEqual([
      { x: 0.1, y: 0.2, visibility: 0.9 },
      { x: 0.3, y: 0.4, visibility: 0 },
    ]);
  });
});
