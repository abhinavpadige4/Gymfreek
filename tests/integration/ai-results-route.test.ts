import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

// Day-completion writer: POST /api/ai/results advances the enrollment when
// the workout belongs to a challenge day (route-ownership style auth mock).
vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
const mockUserId = vi.mocked(getCurrentUserId);

import { POST as postResults } from '@/app/api/ai/results/route';

function jsonReq(body: unknown): Request {
  return new Request('http://test.local/api/ai/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function resultBody(dayId: string, challengeId: string) {
  return {
    challengeId,
    challengeDayId: dayId,
    results: [
      {
        exerciseName: 'squat',
        reps: 10,
        goodReps: 9,
        badReps: 1,
        averageScore: 88,
        issues: [{ issueType: 'forward_lean', count: 1 }],
      },
    ],
  };
}

async function seedChallenge(days = 3) {
  const user = await db.user.create({ data: { email: 'athlete@test.dev', passwordHash: 'x' } });
  const challenge = await db.challenge.create({
    data: { slug: `c-${Date.now()}`, title: 'Mini', pricePaise: 0 },
  });
  for (let n = 1; n <= days; n++) {
    await db.challengeDay.create({
      data: { challengeId: challenge.id, dayNumber: n, title: `Day ${n}` },
    });
  }
  const enrollment = await db.enrollment.create({
    data: { userId: user.id, challengeId: challenge.id, status: 'ACTIVE', currentDay: 1 },
  });
  const day1 = await db.challengeDay.findFirstOrThrow({
    where: { challengeId: challenge.id, dayNumber: 1 },
  });
  return { user, challenge, enrollment, day1 };
}

beforeEach(() => {
  mockUserId.mockReset();
});

describe('POST /api/ai/results - challenge advancement', () => {
  it('advances currentDay 1 -> 2 when day 1 completes', async () => {
    const { user, challenge, day1 } = await seedChallenge();
    mockUserId.mockResolvedValue(user.id);
    const res = await postResults(jsonReq(resultBody(day1.id, challenge.id)));
    expect(res.status).toBe(201);
    expect((await res.json()).enrollment).toEqual({ status: 'ACTIVE', currentDay: 2 });
    const row = await db.enrollment.findFirstOrThrow({ where: { userId: user.id } });
    expect(row.currentDay).toBe(2);
  });

  it('completes the enrollment on the last day', async () => {
    const { user, challenge } = await seedChallenge(2);
    await db.enrollment.updateMany({
      where: { userId: user.id },
      data: { currentDay: 2 },
    });
    const day2 = await db.challengeDay.findFirstOrThrow({
      where: { challengeId: challenge.id, dayNumber: 2 },
    });
    mockUserId.mockResolvedValue(user.id);
    const res = await postResults(jsonReq(resultBody(day2.id, challenge.id)));
    expect(res.status).toBe(201);
    expect((await res.json()).enrollment).toEqual({ status: 'COMPLETED', currentDay: 2 });
  });

  it('stores free workouts without touching any enrollment', async () => {
    const user = await db.user.create({ data: { email: 'free@test.dev', passwordHash: 'x' } });
    mockUserId.mockResolvedValue(user.id);
    const res = await postResults(
      jsonReq({
        results: [
          { exerciseName: 'squat', reps: 5, goodReps: 5, badReps: 0, averageScore: 95 },
        ],
      }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).enrollment).toBeUndefined();
  });
});
