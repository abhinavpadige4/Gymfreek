/**
 * Demo seed for 100XU.
 *
 * Loads a neutral dataset to help you explore the application:
 * - A demo account (email/password configurable via .env)
 * - The 100XU blueprint exercise catalog (see lib/exercise-catalog.ts)
 * - A starter program "100XU Starter - Block 01 Taster" (Block 01 Day 1)
 * No sample sessions: charts start empty until the user trains.
 *
 * No personal data here: feel free to adapt the catalog and the program.
 *
 * Usage: npm run db:seed
 */

import { PrismaClient, Sex, TrainingGoal } from '@/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { seedExerciseCatalog } from '../lib/exercise-catalog';
import { normalizeDatabaseUrl } from '../lib/db-url';

// Prisma 7 requires a driver adapter to connect (the Rust engine was removed).
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL) }),
});

async function main() {
  console.log('Seed: starting...');

  // ============================================================
  // 1. DEMO ACCOUNT
  // ============================================================
  const passwordHash = await bcrypt.hash(
    process.env.USER_PASSWORD || 'change-me-immediately',
    10,
  );

  const user = await prisma.user.upsert({
    where: { email: process.env.USER_EMAIL || 'you@example.com' },
    update: {},
    create: {
      email: process.env.USER_EMAIL || 'you@example.com',
      passwordHash,
      displayName: 'Demo',
      bodyweight: 75,
      sex: Sex.MALE,
      heightCm: 178,
      goal: TrainingGoal.HYPERTROPHY,
      weeklyFrequency: 3,
    },
  });

  console.log(`Seed: demo account -> ${user.email}`);

  // ============================================================
  // 2. EXERCISE CATALOG (100XU blueprint movements)
  // ============================================================
  const exerciseMap = await seedExerciseCatalog(prisma, user.id);
  console.log(`Seed: ${exerciseMap.size} exercises`);

  // ============================================================
  // 3. STARTER PROGRAM (Block 01 Day 1 taster)
  // ============================================================
  await prisma.program.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });

  const program = await prisma.program.create({
    data: {
      userId: user.id,
      name: '100XU Starter - Block 01 Taster',
      description:
        'First 5 movements of Block 01 Day 1: swings, box jumps, front squats, push-ups, farmer carry. 10 reps x 10 rounds.',
      phase: 'Foundation',
      isActive: true,
      startDate: new Date('2026-01-06'),
    },
  });
  console.log(`Seed: program -> ${program.name}`);

  // Block 01 Day 1 taster: the same 5 movements as the free trial.
  const exercises: Array<{
    name: string;
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
    targetRIR: number;
    restSec: number;
  }> = [
    { name: 'Russian kettlebell swings', targetSets: 10, targetRepsMin: 10, targetRepsMax: 10, targetRIR: 2, restSec: 90 },
    { name: 'Plyo box jumps with step down', targetSets: 10, targetRepsMin: 10, targetRepsMax: 10, targetRIR: 2, restSec: 90 },
    { name: 'Dual dumbbell front squats', targetSets: 10, targetRepsMin: 10, targetRepsMax: 10, targetRIR: 2, restSec: 90 },
    { name: 'Strict hand-release push-ups', targetSets: 10, targetRepsMin: 10, targetRepsMax: 10, targetRIR: 2, restSec: 75 },
    { name: 'Heavy kettlebell carry paces', targetSets: 10, targetRepsMin: 10, targetRepsMax: 10, targetRIR: 2, restSec: 90 },
  ];

  const workout = await prisma.workout.create({
    data: { programId: program.id, name: 'Block 01 - Day 1 Taster', dayOfWeek: 1, order: 1 },
  });
  let order = 1;
  for (const ex of exercises) {
    const exerciseId = exerciseMap.get(ex.name);
    if (!exerciseId) throw new Error(`Exercise not found: ${ex.name}`);
    await prisma.programExercise.create({
      data: {
        workoutId: workout.id,
        exerciseId,
        order: order++,
        targetSets: ex.targetSets,
        targetRepsMin: ex.targetRepsMin,
        targetRepsMax: ex.targetRepsMax,
        targetRIR: ex.targetRIR,
        restSec: ex.restSec,
        tempo: null,
      },
    });
  }
  console.log(`Seed: workout "${workout.name}" (${exercises.length} exercises)`);

  console.log('Seed: done.');
}

main()
  .catch((e) => {
    console.error('Seed: error', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
