import { describe, expect, it } from 'vitest';
import { BLOCKS, TRIAL_BLOCK } from './challenge-blueprint';

describe('challenge blueprint', () => {
  it('has 10 blocks with 10 tasks each (100 days, 1,000 tasks)', () => {
    expect(BLOCKS).toHaveLength(10);
    for (const block of BLOCKS) {
      expect(block.title.trim().length).toBeGreaterThan(0);
      expect(block.focus.trim().length).toBeGreaterThan(0);
      expect(block.tasks).toHaveLength(10);
    }
  });

  it('gives every task a name, a load, and a cue', () => {
    for (const block of BLOCKS) {
      for (const task of block.tasks) {
        expect(task.name.trim().length).toBeGreaterThan(0);
        expect(task.load.trim().length).toBeGreaterThan(0);
        expect(task.cue.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps task names unique within each block', () => {
    for (const block of BLOCKS) {
      const names = block.tasks.map((t) => t.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('builds the free trial from the first 5 movements of Block 01', () => {
    expect(TRIAL_BLOCK.tasks).toHaveLength(5);
    expect(TRIAL_BLOCK.tasks.map((t) => t.name)).toEqual(
      BLOCKS[0]!.tasks.slice(0, 5).map((t) => t.name),
    );
  });
});
