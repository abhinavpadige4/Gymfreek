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

function resultBody(dayId: string, challengeId: string, reps = 10) {
  return {
    challengeId,
    challengeDayId: dayId,
    durationSec: 1200,
    results: [
      {
        exerciseName: 'squat',
        reps,
        goodReps: reps,
        badReps: 0,
        averageScore: 88,
        issues: [],
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
        durationSec: 600,
        results: [
          { exerciseName: 'squat', reps: 5, goodReps: 5, badReps: 0, averageScore: 95 },
        ],
      }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).enrollment).toBeUndefined();
  });

  it('rejects future locked days with 403 and stores nothing', async () => {
    const { user, challenge } = await seedChallenge(1);
    mockUserId.mockResolvedValue(user.id);
    const day2 = await db.challengeDay.create({
      data: { challengeId: challenge.id, dayNumber: 2, title: 'Day 2' },
    });
    const res = await postResults(jsonReq(resultBody(day2.id, challenge.id)));
    expect(res.status).toBe(403);
    const sessions = await db.workoutSession.count({ where: { userId: user.id } });
    expect(sessions).toBe(0);
  });

  it('rejects challenge posts without an enrollment with 403', async () => {
    const { challenge, day1 } = await seedChallenge();
    const outsider = await db.user.create({
      data: { email: 'outsider@test.dev', passwordHash: 'x' },
    });
    mockUserId.mockResolvedValue(outsider.id);
    const res = await postResults(jsonReq(resultBody(day1.id, challenge.id)));
    expect(res.status).toBe(403);
  });

  it('stores short attempts without advancing', async () => {
    const { user, challenge } = await seedChallenge(1);
    const day = await db.challengeDay.findFirstOrThrow({
      where: { challengeId: challenge.id, dayNumber: 1 },
    });
    for (let i = 0; i < 10; i++) {
      await db.challengeTask.create({
        data: { dayId: day.id, exerciseName: `move-${i}`, targetReps: 10, rounds: 10, order: i },
      });
    }
    mockUserId.mockResolvedValue(user.id);
    // 300 reported reps against a 1000-rep day: stored, not valid, no advance.
    const res = await postResults(
      jsonReq({
        challengeId: challenge.id,
        challengeDayId: day.id,
        durationSec: 1200,
        results: [
          { exerciseName: 'squat', reps: 300, goodReps: 300, badReps: 0, averageScore: 80 },
        ],
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { valid?: boolean; enrollment?: unknown };
    expect(body.valid).toBe(false);
    expect(body.enrollment).toBeUndefined();
    const row = await db.enrollment.findFirstOrThrow({ where: { userId: user.id } });
    expect(row.currentDay).toBe(1);
  });

  it('advances a recovery day on 600 reported reps', async () => {
    const { user, challenge } = await seedChallenge(7);
    const day5 = await db.challengeDay.findFirstOrThrow({
      where: { challengeId: challenge.id, dayNumber: 5 },
    });
    for (let i = 0; i < 10; i++) {
      await db.challengeTask.create({
        data: { dayId: day5.id, exerciseName: `move-${i}`, targetReps: 10, rounds: 10, order: i },
      });
    }
    await db.enrollment.updateMany({ where: { userId: user.id }, data: { currentDay: 5 } });
    mockUserId.mockResolvedValue(user.id);
    const res = await postResults(
      jsonReq({
        challengeId: challenge.id,
        challengeDayId: day5.id,
        durationSec: 1800,
        results: [
          { exerciseName: 'squat', reps: 600, goodReps: 600, badReps: 0, averageScore: 80 },
        ],
      }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).enrollment).toEqual({ status: 'ACTIVE', currentDay: 6 });
  });
});
