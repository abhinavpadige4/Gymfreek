import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { getCurrentUserId, getCurrentSession } from '@/lib/auth';

// Admin console routes: enrollment management, challenge tasks, challenge
// patch, and the enrolled-only challenge detail gate.
vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn(), getCurrentSession: vi.fn() }));
const mockUserId = vi.mocked(getCurrentUserId);
const mockSession = vi.mocked(getCurrentSession);

import { PUT as putEnrollments } from '@/app/api/admin/enrollments/route';
import {
  DELETE as deleteTask,
  POST as postTask,
} from '@/app/api/admin/challenge-tasks/route';
import { PATCH as patchChallenge } from '@/app/api/admin/challenges/route';
import { GET as getChallenge } from '@/app/api/challenges/[id]/route';

function jsonReq(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function adminUser(email: string) {
  const user = await db.user.create({
    data: { email, passwordHash: 'x', role: 'ADMIN' },
  });
  mockUserId.mockResolvedValue(user.id);
  mockSession.mockResolvedValue({ userId: user.id, email });
  return user;
}

async function seedChallengeWithDay() {
  const challenge = await db.challenge.create({
    data: { slug: `adm-${Date.now()}`, title: 'Adm', pricePaise: 0 },
  });
  const day = await db.challengeDay.create({
    data: { challengeId: challenge.id, dayNumber: 1, title: 'Day 1' },
  });
  return { challenge, day };
}

beforeEach(() => {
  mockUserId.mockReset();
  mockSession.mockReset();
});

describe('admin console routes', () => {
  it('rejects non-admins with 403', async () => {
    const user = await db.user.create({ data: { email: 'plain@test.dev', passwordHash: 'x' } });
    mockUserId.mockResolvedValue(user.id);
    mockSession.mockResolvedValue({ userId: user.id, email: user.email });
    const res = await putEnrollments(
      jsonReq('http://test.local/api/admin/enrollments', 'PUT', {
        enrollmentId: 'nope',
        status: 'CANCELLED',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('cancels, reactivates and resets enrollments', async () => {
    await adminUser('root@test.dev');
    const member = await db.user.create({ data: { email: 'member@test.dev', passwordHash: 'x' } });
    const { challenge } = await seedChallengeWithDay();
    const enrollment = await db.enrollment.create({
      data: { userId: member.id, challengeId: challenge.id, status: 'ACTIVE', currentDay: 3 },
    });

    const cancel = await putEnrollments(
      jsonReq('http://test.local/api/admin/enrollments', 'PUT', {
        enrollmentId: enrollment.id,
        status: 'CANCELLED',
      }),
    );
    expect(cancel.status).toBe(200);
    expect(((await cancel.json()) as { status: string }).status).toBe('CANCELLED');

    const reset = await putEnrollments(
      jsonReq('http://test.local/api/admin/enrollments', 'PUT', {
        enrollmentId: enrollment.id,
        status: 'ACTIVE',
        currentDay: 1,
      }),
    );
    expect(reset.status).toBe(200);
    expect(await resJson(reset)).toEqual(
      expect.objectContaining({ status: 'ACTIVE', currentDay: 1 }),
    );

    const missing = await putEnrollments(
      jsonReq('http://test.local/api/admin/enrollments', 'PUT', {
        enrollmentId: '00000000-0000-0000-0000-000000000000',
        status: 'CANCELLED',
      }),
    );
    expect(missing.status).toBe(404);

    async function resJson(r: Response) {
      return (await r.json()) as { status: string; currentDay: number };
    }
  });

  it('appends and deletes challenge tasks in order', async () => {
    await adminUser('builder@test.dev');
    const { day } = await seedChallengeWithDay();

    const first = await postTask(
      jsonReq('http://test.local/api/admin/challenge-tasks', 'POST', {
        dayId: day.id,
        exerciseName: 'Goblet squats',
        targetReps: 10,
        rounds: 10,
      }),
    );
    expect(first.status).toBe(201);
    expect(((await first.json()) as { order: number }).order).toBe(0);

    const second = await postTask(
      jsonReq('http://test.local/api/admin/challenge-tasks', 'POST', {
        dayId: day.id,
        exerciseName: 'Push-ups',
        targetReps: 10,
        rounds: 10,
      }),
    );
    expect(((await second.json()) as { order: number }).order).toBe(1);

    const gone = await deleteTask(
      jsonReq(
        `http://test.local/api/admin/challenge-tasks?taskId=${((await first.json()) as { id: string }).id}`,
        'DELETE',
      ),
    );
    expect(gone.status).toBe(200);

    const missingDay = await postTask(
      jsonReq('http://test.local/api/admin/challenge-tasks', 'POST', {
        dayId: '00000000-0000-0000-0000-000000000000',
        exerciseName: 'x',
      }),
    );
    expect(missingDay.status).toBe(404);
  });

  it('renames and toggles challenges', async () => {
    await adminUser('curator@test.dev');
    const { challenge } = await seedChallengeWithDay();
    const res = await fetchPatch(challenge.id, { title: 'Renamed', isActive: false });
    expect(res.status).toBe(200);
    const row = await db.challenge.findUniqueOrThrow({ where: { id: challenge.id } });
    expect(row.title).toBe('Renamed');
    expect(row.isActive).toBe(false);

    async function fetchPatch(id: string, body: Record<string, unknown>) {
      return patchChallenge(
        jsonReq('http://test.local/api/admin/challenges', 'PATCH', {
          challengeId: id,
          ...body,
        }),
      );
    }
  });

  it('shows 3-day preview unenrolled and full circuits enrolled', async () => {
    const { challenge } = await seedChallengeWithDay();
    for (let n = 2; n <= 5; n++) {
      await db.challengeDay.create({
        data: { challengeId: challenge.id, dayNumber: n, title: `Day ${n}` },
      });
    }
    const outsider = await db.user.create({
      data: { email: 'outsider2@test.dev', passwordHash: 'x' },
    });
    mockUserId.mockResolvedValue(outsider.id);
    mockSession.mockResolvedValue({ userId: outsider.id, email: outsider.email });
    const preview = await getChallenge(
      new Request('http://test.local/x', { method: 'GET' }),
      { params: Promise.resolve({ id: challenge.slug }) },
    );
    expect(preview.status).toBe(200);
    expect(((await preview.json()) as { days: unknown[] }).days).toHaveLength(3);

    await db.enrollment.create({
      data: { userId: outsider.id, challengeId: challenge.id, status: 'ACTIVE', currentDay: 1 },
    });
    const full = await getChallenge(new Request('http://test.local/x', { method: 'GET' }), {
      params: Promise.resolve({ id: challenge.slug }),
    });
    expect(((await full.json()) as { days: unknown[] }).days).toHaveLength(5);
  });
});
