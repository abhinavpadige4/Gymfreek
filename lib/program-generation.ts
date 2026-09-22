import { db } from '@/lib/db';
import { type GeneratedProgram } from '@/lib/schemas/program-generation';
import { defaultIntraSetConfig } from '@/lib/intra-set-autoregulation';

// Persists a (possibly user-edited) template program.
// New exercises are created on the fly; existing ones are reused by name.
// Returns the new program id. The program is created inactive.
//
// Deliberately NOT wrapped in an interactive transaction: those fail on
// pooled Postgres (PgBouncer transaction mode, e.g. the Neon pooled URL)
// with P2028 "unable to start a transaction". Instead the program row is
// created first and deleted as compensation if a later write fails, so a
// failed build never leaves a half-written program behind. Newly upserted
// catalog rows are kept on failure - they are ordinary catalog entries.
export async function buildProgramFromGenerated(
  userId: string,
  program: GeneratedProgram,
): Promise<string> {
  const created = await db.program.create({
    data: {
      userId,
      name: program.name,
      description: program.description ?? null,
      phase: program.phase,
      isActive: false,
    },
  });

  try {
    let workoutOrder = 1;
    for (const w of program.workouts) {
      const workout = await db.workout.create({
        data: {
          programId: created.id,
          name: w.name,
          dayOfWeek: w.dayOfWeek ?? null,
          order: workoutOrder++,
        },
      });

      let exerciseOrder = 1;
      for (const ex of w.exercises) {
        const exercise = await db.exercise.upsert({
          where: { userId_name: { userId, name: ex.name } },
          update: {},
          create: {
            userId,
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            // A CARDIO machine is always logged as cardio (duration/distance),
            // whatever category the model picked.
            category: ex.equipmentType === 'CARDIO' ? 'CARDIO' : ex.category,
            equipmentType: ex.equipmentType ?? 'OTHER',
            defaultRestSec: ex.restSec,
          },
        });

        const autoregDefaults = defaultIntraSetConfig(exercise);
        await db.programExercise.create({
          data: {
            workoutId: workout.id,
            exerciseId: exercise.id,
            order: exerciseOrder++,
            targetSets: ex.targetSets,
            targetRepsMin: ex.targetRepsMin,
            targetRepsMax: Math.max(ex.targetRepsMax, ex.targetRepsMin),
            targetRIR: ex.targetRIR,
            restSec: ex.restSec,
            autoregulationMode: ex.autoregulationMode ?? 'PRESERVE_RIR',
            fatigueRate: ex.fatigueRate ?? autoregDefaults.fatigueRate,
            loadAdjustmentPct: ex.loadAdjustmentPct ?? autoregDefaults.loadAdjustmentPct,
            tempo: ex.tempo ?? null,
            notes: ex.notes ?? null,
            supersetGroup: ex.supersetGroup ?? null,
          },
        });
      }
    }
  } catch (err) {
    // Deleting the program cascades its workouts and program exercises.
    await db.program.delete({ where: { id: created.id } }).catch(() => {});
    throw err;
  }

  return created.id;
}
