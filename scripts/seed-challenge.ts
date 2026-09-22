import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
import { PrismaClient } from '@/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizeDatabaseUrl } from '../lib/db-url';
import {
  R10,
  RECOVERY,
  TRIAL_BLOCK,
  BLOCKS,
  type Block,
} from '../lib/challenge-blueprint';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL) }),
});

// 100XU Athletic Performance System: 100-day century blueprint.
// 10 blocks x 10 days. Every day runs the block's full V1..V10 circuit:
// 10 reps x 10 rounds = 1,000 reps/day, 100,000 total.
// The movement data lives in lib/challenge-blueprint.ts (unit-tested shape).
// Run: npm run db:seed:challenge

async function seedChallengeDays(challengeId: string, blocks: Block[], daysPerBlock: number) {
  // Replace placeholder days (cascade wipes old tasks); enrollments untouched.
  await db.challengeDay.deleteMany({ where: { challengeId } });
  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b];
    if (!block) continue;
    for (let d = 1; d <= daysPerBlock; d++) {
      const dayNumber = b * daysPerBlock + d;
      const recovery = d === 5 || d === 10 ? ` ${RECOVERY}` : '';
      await db.challengeDay.create({
        data: {
          challengeId,
          dayNumber,
          title: `Day ${dayNumber}: ${block.title}`,
          focus: `${block.focus}${recovery}`,
          tasks: {
            create: block.tasks.map((t, i) => ({
              exerciseName: t.name,
              targetReps: 10,
              rounds: 10,
              loadLabel: t.load,
              instructions: `${t.format ?? R10}. ${t.cue}`,
              order: i,
            })),
          },
        },
      });
    }
  }
  const days = await db.challengeDay.count({ where: { challengeId } });
  const tasks = await db.challengeTask.count({ where: { day: { challengeId } } });
  return { days, tasks };
}

async function main() {
  const challenge = await db.challenge.upsert({
    where: { slug: '100xu' },
    create: {
      slug: '100xu',
      title: '100XU - 100 Day Century Challenge',
      description:
        '10 blocks x 10 days. Daily circuit V1..V10, 10 reps x 10 rounds = 1,000 reps/day, 100,000 total. Rest 60-90s between rounds.',
      pricePaise: 299900,
      currency: 'INR',
      isActive: true,
    },
    update: {
      title: '100XU - 100 Day Century Challenge',
      description:
        '10 blocks x 10 days. Daily circuit V1..V10, 10 reps x 10 rounds = 1,000 reps/day, 100,000 total. Rest 60-90s between rounds.',
      pricePaise: 299900,
    },
  });
  const full = await seedChallengeDays(challenge.id, BLOCKS, 10);
  console.log(`Seeded 100XU: ${full.days} days, ${full.tasks} tasks`);

  const trial = await db.challenge.upsert({
    where: { slug: '100xu-trial' },
    create: {
      slug: '100xu-trial',
      title: '100XU Free Trial',
      description:
        'Try the 100XU circuit free: 5 movements, 10 reps x 10 rounds. No payment needed.',
      pricePaise: 0,
      currency: 'INR',
      isActive: true,
    },
    update: {
      title: '100XU Free Trial',
      description:
        'Try the 100XU circuit free: 5 movements, 10 reps x 10 rounds. No payment needed.',
      pricePaise: 0,
    },
  });
  const trialSeeded = await seedChallengeDays(trial.id, [TRIAL_BLOCK], 1);
  console.log(`Seeded trial: ${trialSeeded.days} days, ${trialSeeded.tasks} tasks`);
  await db.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
