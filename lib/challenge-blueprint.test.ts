import { describe, expect, it } from 'vitest';
import { BLOCKS, TRIAL_BLOCK, blockNameForDay } from './challenge-blueprint';

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

  it('maps day numbers to block names across all 100 days', () => {
    expect(blockNameForDay(1, 100)).toBe('IRON WILL');
    expect(blockNameForDay(10, 100)).toBe('IRON WILL');
    expect(blockNameForDay(11, 100)).toBe('BLOCK OUT');
    expect(blockNameForDay(21, 100)).toBe('PAIN TO POWER');
    expect(blockNameForDay(31, 100)).toBe('ALPHA MODE');
    expect(blockNameForDay(41, 100)).toBe('WILD CORE');
    expect(blockNameForDay(51, 100)).toBe('AFTER BURN');
    expect(blockNameForDay(61, 100)).toBe('NO SURRENDER');
    expect(blockNameForDay(71, 100)).toBe('MISSION IMPOSSIBLE');
    expect(blockNameForDay(81, 100)).toBe('THE FINAL SHOWDOWN');
    expect(blockNameForDay(91, 100)).toBe('100XU');
    expect(blockNameForDay(100, 100)).toBe('100XU');
    expect(blockNameForDay(101, 110)).toBeUndefined();
    expect(blockNameForDay(0, 100)).toBeUndefined();
    expect(blockNameForDay(1, 1)).toBeUndefined();
    expect(blockNameForDay(5, 10)).toBeUndefined();
  });
});
