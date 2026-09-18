import { beforeEach, afterAll } from 'vitest';
import { db } from '@/lib/db';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must point to a test database for integration tests ' +
      '(Neon branch or any Postgres on :5434) and run `npm run test:integration`.',
  );
}

// Truncates every table between tests so each starts from a clean slate.
export async function resetDb(): Promise<void> {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "Message","Conversation","ReadinessCheckin","ExerciseGoal","BodyweightEntry","Set","Session","ProgramExercise","Workout","Program","Exercise","CoachSession","FormIssue","ExerciseResult","WorkoutSession","Payment","Enrollment","ChallengeTask","ChallengeDay","Challenge","User" RESTART IDENTITY CASCADE;',
  );
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await db.$disconnect();
});
