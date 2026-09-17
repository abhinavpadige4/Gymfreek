import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  isAiServiceConfigured,
  summarizeWorkoutViaService,
  AiServiceError,
} from '@/lib/ai-service';
import { workoutResultsSchema } from '@/lib/schemas/ai';

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('ai-service client', () => {
  it('is unconfigured without AI_SERVICE_URL', () => {
    vi.stubEnv('AI_SERVICE_URL', '');
    expect(isAiServiceConfigured()).toBe(false);
  });

  it('maps service coaching through the contract', async () => {
    vi.stubEnv('AI_SERVICE_URL', 'http://ai:8000');
    vi.stubEnv('AI_SERVICE_TOKEN', 'tok');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          summary: 'Strong session.',
          strengths: ['a'],
          improvements: ['b'],
          nextWorkoutAdvice: 'c',
          voiceMessage: 'd',
        }),
      }),
    );
    const out = await summarizeWorkoutViaService({
      exercise: 'squat',
      totalReps: 10,
      goodReps: 9,
      badReps: 1,
      averageScore: 88,
      issues: {},
      duration: 60,
    });
    expect(out.summary).toBe('Strong session.');
    expect(out.voiceMessage).toBe('d');
  });

  it('throws AiServiceError when unreachable', async () => {
    vi.stubEnv('AI_SERVICE_URL', 'http://ai:8000');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('down')),
    );
    await expect(
      summarizeWorkoutViaService({
        exercise: 'squat',
        totalReps: 1,
        goodReps: 1,
        badReps: 0,
        averageScore: 90,
        issues: {},
        duration: 10,
      }),
    ).rejects.toBeInstanceOf(AiServiceError);
  });
});

describe('ai results schema', () => {
  it('accepts a full session payload', () => {
    const parsed = workoutResultsSchema.safeParse({
      results: [
        {
          exerciseName: 'squat',
          reps: 100,
          goodReps: 91,
          badReps: 9,
          averageScore: 87,
          issues: [{ issueType: 'forward_lean', count: 7, severity: 'MED' }],
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty results list and bad scores', () => {
    expect(workoutResultsSchema.safeParse({ results: [] }).success).toBe(false);
    expect(
      workoutResultsSchema.safeParse({
        results: [
          {
            exerciseName: 'squat',
            reps: 1,
            goodReps: 1,
            badReps: 0,
            averageScore: 101,
            issues: [],
          },
        ],
      }).success,
    ).toBe(false);
  });
});
