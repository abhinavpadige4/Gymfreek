import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { getCurrentUserId, getCurrentSession } from '@/lib/auth';

// Admin console routes: enrollment management, challenge tasks, challenge
// patch, and the enrolled-only challenge detail gate.
vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn(), getCurrentSession: vi.fn() }));
const mockUserId = vi.mocked(getCurrentUserId);
const mockSession = vi.mocked(getCurrentSession);

import { PUT as putEnrollments } from '@/app/api/admin/enrollments/route';
import { PUT as putAdminUsers, DELETE as deleteAdminUser } from '@/app/api/admin/users/route';
import { PUT as putAdminPayments } from '@/app/api/admin/payments/route';
import { GET as getAdminSettings, PUT as putAdminSettings } from '@/app/api/admin/settings/route';
import { POST as postLogin } from '@/app/api/auth/login/route';
import { requireApiUserId } from '@/lib/api';
import {
  DELETE as deleteTask,
  PATCH as patchTask,
  POST as postTask,
} from '@/app/api/admin/challenge-tasks/route';
import { DELETE as deleteChallengeRoute, PATCH as patchChallenge } from '@/app/api/admin/challenges/route';
import { GET as getChallenge } from '@/app/api/challenges/[id]/route';
import { POST as postCreateOrder } from '@/app/api/payments/create-order/route';

async function deleteChallenge(challengeId: string) {
  return deleteChallengeRoute(
    jsonReq(
      `http://test.local/api/admin/challenges?challengeId=${encodeURIComponent(challengeId)}`,
      'DELETE',
    ),
  );
}

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

  it('edits task fields without touching the rest', async () => {
    await adminUser('editor@test.dev');
    const { day } = await seedChallengeWithDay();
    const created = await postTask(
      jsonReq('http://test.local/api/admin/challenge-tasks', 'POST', {
        dayId: day.id,
        exerciseName: 'Goblet squats',
        targetReps: 10,
        rounds: 10,
      }),
    );
    const { id } = (await created.json()) as { id: string };
    const patched = await patchTask(
      jsonReq('http://test.local/api/admin/challenge-tasks', 'PATCH', {
        taskId: id,
        loadLabel: '16-24 kg KB',
        instructions: 'Sit deep.',
      }),
    );
    expect(patched.status).toBe(200);
    const row = await db.challengeTask.findUniqueOrThrow({ where: { id } });
    expect(row.loadLabel).toBe('16-24 kg KB');
    expect(row.instructions).toBe('Sit deep.');
    expect(row.exerciseName).toBe('Goblet squats');
    expect(row.targetReps).toBe(10);
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

  it('activates admin enrollments with no order and no charge', async () => {    const admin = await adminUser('freepass@test.dev');
    const { challenge } = await seedChallengeWithDay();
    const enrollment = await db.enrollment.create({
      data: { userId: admin.id, challengeId: challenge.id, status: 'PENDING', currentDay: 1 },
    });
    const res = await postCreateOrder(
      jsonReq('http://test.local/api/payments/create-order', 'POST', {
        enrollmentId: enrollment.id,
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({ enrollmentId: enrollment.id, free: true }),
    );
    const row = await db.enrollment.findUniqueOrThrow({ where: { id: enrollment.id } });
    expect(row.status).toBe('ACTIVE');
    expect(await db.payment.count({ where: { enrollmentId: enrollment.id } })).toBe(0);
  });

  it('deletes empty challenges with their days and tasks', async () => {
    await adminUser('deleter@test.dev');
    const { challenge, day } = await seedChallengeWithDay();
    await db.challengeTask.create({
      data: { dayId: day.id, exerciseName: 'Goblet squats', targetReps: 10, rounds: 10, order: 0 },
    });
    const res = await deleteChallenge(challenge.id);
    expect(res.status).toBe(200);
    expect(await db.challenge.findUnique({ where: { id: challenge.id } })).toBeNull();
    expect(await db.challengeDay.count({ where: { challengeId: challenge.id } })).toBe(0);
  });

  it('refuses to delete challenges with enrolled members', async () => {
    await adminUser('keeper@test.dev');
    const member = await db.user.create({ data: { email: 'locked@test.dev', passwordHash: 'x' } });
    const { challenge } = await seedChallengeWithDay();
    await db.enrollment.create({
      data: { userId: member.id, challengeId: challenge.id, status: 'ACTIVE', currentDay: 1 },
    });
    const res = await deleteChallenge(challenge.id);
    expect(res.status).toBe(409);
    expect(await db.challenge.findUnique({ where: { id: challenge.id } })).not.toBeNull();
  });

  it('blocks and unblocks members end to end', async () => {
    const admin = await adminUser('sheriff@test.dev');
    const member = await db.user.create({ data: { email: 'rowdy@test.dev', passwordHash: 'x' } });

    const block = await putAdminUsers(
      jsonReq('http://test.local/api/admin/users', 'PUT', { userId: member.id, status: 'BLOCKED' }),
    );
    expect(block.status).toBe(200);

    // Blocked: login rejected and API choke point throws 403.
    const login = await postLogin(
      jsonReq('http://test.local/api/auth/login', 'POST', {
        email: 'rowdy@test.dev',
        password: 'whatever-long-enough',
      }),
    );
    expect(login.status).toBe(403);
    mockUserId.mockResolvedValue(member.id);
    await expect(requireApiUserId()).rejects.toMatchObject({ status: 403 });

    // Unblock restores access.
    mockUserId.mockResolvedValue(admin.id);
    const unblock = await putAdminUsers(
      jsonReq('http://test.local/api/admin/users', 'PUT', { userId: member.id, status: 'ACTIVE' }),
    );
    expect(unblock.status).toBe(200);
    mockUserId.mockResolvedValue(member.id);
    await expect(requireApiUserId()).resolves.toBe(member.id);
  });

  it('refuses self-block, self-delete, and last-admin removal', async () => {
    const admin = await adminUser('only@test.dev');

    const selfBlock = await putAdminUsers(
      jsonReq('http://test.local/api/admin/users', 'PUT', { userId: admin.id, status: 'BLOCKED' }),
    );
    expect(selfBlock.status).toBe(400);

    const selfDelete = await deleteAdminUser(
      jsonReq('http://test.local/api/admin/users', 'DELETE', { userId: admin.id }),
    );
    expect(selfDelete.status).toBe(400);

    const selfDemote = await putAdminUsers(
      jsonReq('http://test.local/api/admin/users', 'PUT', { userId: admin.id, role: 'USER' }),
    );
    expect(selfDemote.status).toBe(400);
  });

  it('deletes a member with all their data', async () => {
    await adminUser('janitor@test.dev');
    const member = await db.user.create({ data: { email: 'gone@test.dev', passwordHash: 'x' } });
    const session = await db.session.create({ data: { userId: member.id } });
    await db.program.create({ data: { userId: member.id, name: 'P', phase: 'x' } });

    const res = await deleteAdminUser(
      jsonReq('http://test.local/api/admin/users', 'DELETE', { userId: member.id }),
    );
    expect(res.status).toBe(200);
    expect(await db.user.findUnique({ where: { id: member.id } })).toBeNull();
    expect(await db.session.findUnique({ where: { id: session.id } })).toBeNull();
  });

  it('records refunds and cancels the subscription', async () => {
    await adminUser('support@test.dev');
    const member = await db.user.create({ data: { email: 'refund@test.dev', passwordHash: 'x' } });
    const { challenge } = await seedChallengeWithDay();
    const enrollment = await db.enrollment.create({
      data: { userId: member.id, challengeId: challenge.id, status: 'ACTIVE', currentDay: 5 },
    });
    const payment = await db.payment.create({
      data: {
        userId: member.id,
        enrollmentId: enrollment.id,
        amountPaise: 299900,
        currency: 'INR',
        razorpayOrderId: `order_test_${Date.now()}`,
        status: 'CAPTURED',
      },
    });

    const res = await putAdminPayments(
      jsonReq('http://test.local/api/admin/payments', 'PUT', {
        paymentId: payment.id,
        refundId: 'rfnd_test_123',
        refundNote: 'requested within window',
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({ status: 'REFUNDED', refundId: 'rfnd_test_123' }),
    );
    expect(
      (await db.enrollment.findUniqueOrThrow({ where: { id: enrollment.id } })).status,
    ).toBe('CANCELLED');

    // One-way: a refunded payment cannot be marked again.
    const again = await putAdminPayments(
      jsonReq('http://test.local/api/admin/payments', 'PUT', {
        paymentId: payment.id,
        refundId: 'rfnd_test_456',
      }),
    );
    expect(again.status).toBe(400);
  });

  it('reads and writes site settings with validation', async () => {
    await adminUser('editor2@test.dev');
    const get = await getAdminSettings();
    expect(get.status).toBe(200);

    const bad = await putAdminSettings(
      jsonReq('http://test.local/api/admin/settings', 'PUT', { contactEmail: 'not-an-email' }),
    );
    expect(bad.status).toBe(400);

    const ok = await putAdminSettings(
      jsonReq('http://test.local/api/admin/settings', 'PUT', {
        businessName: 'Test Gym',
        contactEmail: 'help@test.dev',
      }),
    );
    expect(ok.status).toBe(200);
    expect(await db.siteSetting.findUniqueOrThrow({ where: { key: 'businessName' } })).toEqual(
      expect.objectContaining({ value: 'Test Gym' }),
    );
  });
});
