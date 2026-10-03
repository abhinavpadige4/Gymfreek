import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
const mockUserId = vi.mocked(getCurrentUserId);

import { DELETE as deleteExercise } from '@/app/api/exercises/[id]/route';
import { GET as listExercises, POST as createExercise } from '@/app/api/exercises/route';

function actAs(userId: string) {
  mockUserId.mockResolvedValue(userId);
}

function jsonReq(method: string, body: unknown): Request {
  return new Request('http://test.local/api', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function idParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const EXERCISE = { name: 'Bench', muscleGroup: 'CHEST', category: 'COMPOUND' } as const;

async function seedUser(email: string) {
  return db.user.create({ data: { email, passwordHash: 'x' } });
}

describe('exercise archive on delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hard-deletes an unused exercise', async () => {
    const user = await seedUser('owner@test.dev');
    const exercise = await db.exercise.create({ data: { userId: user.id, ...EXERCISE } });
    actAs(user.id);

    const res = await deleteExercise(new Request('http://t/api', { method: 'DELETE' }), idParams(exercise.id));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, archived: false });
    expect(await db.exercise.findUnique({ where: { id: exercise.id } })).toBeNull();
  });

  it('archives (not deletes) an exercise with logged sets, keeping history intact', async () => {
    const user = await seedUser('owner@test.dev');
    const exercise = await db.exercise.create({ data: { userId: user.id, ...EXERCISE } });
    const session = await db.session.create({ data: { userId: user.id, finishedAt: new Date() } });
    await db.set.create({
      data: { sessionId: session.id, exerciseId: exercise.id, setNumber: 1, weight: 60, reps: 10 },
    });
    actAs(user.id);

    const res = await deleteExercise(new Request('http://t/api', { method: 'DELETE' }), idParams(exercise.id));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, archived: true });
    const row = await db.exercise.findUniqueOrThrow({ where: { id: exercise.id } });
    expect(row.archivedAt).toBeInstanceOf(Date);
    expect(await db.set.count({ where: { exerciseId: exercise.id } })).toBe(1);
  });

  it('hides archived exercises from the catalog list', async () => {
    const user = await seedUser('owner@test.dev');
    const exercise = await db.exercise.create({ data: { userId: user.id, ...EXERCISE } });
    const session = await db.session.create({ data: { userId: user.id, finishedAt: new Date() } });
    await db.set.create({
      data: { sessionId: session.id, exerciseId: exercise.id, setNumber: 1, weight: 60, reps: 10 },
    });
    actAs(user.id);
    await deleteExercise(new Request('http://t/api', { method: 'DELETE' }), idParams(exercise.id));

    const list = await listExercises();
    const names = ((await list.json()) as { name: string }[]).map((e) => e.name);
    expect(names).not.toContain('Bench');
  });

  it('revives an archived name on create instead of colliding', async () => {
    const user = await seedUser('owner@test.dev');
    const exercise = await db.exercise.create({
      data: { userId: user.id, ...EXERCISE, archivedAt: new Date() },
    });
    actAs(user.id);

    const res = await createExercise(
      jsonReq('POST', { ...EXERCISE, muscleGroup: 'CHEST', category: 'COMPOUND' }),
    );
    expect(res.status).toBe(200);
    const row = await db.exercise.findUniqueOrThrow({ where: { id: exercise.id } });
    expect(row.archivedAt).toBeNull();
  });

  it('still returns 404 to a stranger deleting an archived exercise', async () => {
    const owner = await seedUser('owner@test.dev');
    const stranger = await seedUser('stranger@test.dev');
    const exercise = await db.exercise.create({
      data: { userId: owner.id, ...EXERCISE, archivedAt: new Date() },
    });
    actAs(stranger.id);

    const res = await deleteExercise(new Request('http://t/api', { method: 'DELETE' }), idParams(exercise.id));
    expect(res.status).toBe(404);
  });
});
