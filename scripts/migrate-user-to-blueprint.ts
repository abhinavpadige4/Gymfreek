import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
import { PrismaClient } from '@/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizeDatabaseUrl } from '../lib/db-url';
import { seedExerciseCatalog } from '../lib/exercise-catalog';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL) }),
});

// One-shot migration: move one account from the legacy catalog to the 100XU
// blueprint. History is never deleted: sessions keep their sets and are
// detached from programs (they read as free sessions afterwards). Exercises
// that still back logged sets are kept; everything else is replaced.
// Usage: tsx scripts/migrate-user-to-blueprint.ts [email]
const STARTER = [
  { name: 'Russian kettlebell swings', targetSets: 10, targetRepsMin: 10, targetRepsMax: 10, targetRIR: 2, restSec: 90 },
  { name: 'Plyo box jumps with step down', targetSets: 10, targetRepsMin: 10, targetRepsMax: 10, targetRIR: 2, restSec: 90 },
  { name: 'Dual dumbbell front squats', targetSets: 10, targetRepsMin: 10, targetRepsMax: 10, targetRIR: 2, restSec: 90 },
  { name: 'Strict hand-release push-ups', targetSets: 10, targetRepsMin: 10, targetRepsMax: 10, targetRIR: 2, restSec: 75 },
  { name: 'Heavy kettlebell carry paces', targetSets: 10, targetRepsMin: 10, targetRepsMax: 10, targetRIR: 2, restSec: 90 },
];

async function main() {
  const email = process.argv[2] || process.env.USER_EMAIL || 'you@example.com';
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No account found for ${email}`);
  console.log(`Migrating ${email} ...`);

  const detached = await db.session.updateMany({
    where: { userId: user.id, OR: [{ programId: { not: null } }, { workoutId: { not: null } }] },
    data: { programId: null, workoutId: null },
  });
  console.log(`Detached ${detached.count} sessions (history preserved).`);

  const programs = await db.program.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  await db.workout.deleteMany({ where: { programId: { in: programs.map((p) => p.id) } } });
  const removedPrograms = await db.program.deleteMany({ where: { userId: user.id } });
  console.log(`Deleted ${removedPrograms.count} programs and their workouts.`);

  const removedExercises = await db.exercise.deleteMany({
    where: {
      userId: user.id,
      programExercises: { none: {} },
      sets: { none: {} },
      goals: { none: {} },
      gymConfigs: { none: {} },
      gymEquipmentLinks: { none: {} },
    },
  });
  console.log(`Deleted ${removedExercises.count} unreferenced exercises (history-backed lifts kept).`);

  const exerciseMap = await seedExerciseCatalog(db, user.id);
  console.log(`Catalog now holds ${exerciseMap.size} blueprint exercises.`);

  const program = await db.program.create({
    data: {
      userId: user.id,
      name: '100XU Starter - Block 01 Taster',
      description:
        'First 5 movements of Block 01 Day 1: swings, box jumps, front squats, push-ups, farmer carry. 10 reps x 10 rounds.',
      phase: 'Foundation',
      isActive: true,
      startDate: new Date(),
    },
  });
  const workout = await db.workout.create({
    data: { programId: program.id, name: 'Block 01 - Day 1 Taster', dayOfWeek: 1, order: 1 },
  });
  let order = 1;
  for (const ex of STARTER) {
    const exerciseId = exerciseMap.get(ex.name);
    if (!exerciseId) throw new Error(`Exercise not found: ${ex.name}`);
    await db.programExercise.create({
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
  console.log(`Starter program ready: "${program.name}" (${STARTER.length} exercises).`);
  await db.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
