import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgramDetailView, type ProgramFull } from './program-detail-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

function templateProgram(): ProgramFull {
  return {
    id: 'p1',
    userId: 'u1',
    name: 'Starting Strength',
    description: null,
    phase: 'Strength',
    isActive: true,
    sourceTemplateSlug: 'starting-strength-3day',
    startDate: new Date(),
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    workouts: [
      {
        id: 'w1',
        programId: 'p1',
        name: 'Workout A',
        dayOfWeek: 1,
        order: 0,
        exercises: [
          {
            id: 'pe1',
            workoutId: 'w1',
            exerciseId: 'e1',
            order: 0,
            targetSets: 3,
            targetRepsMin: 5,
            targetRepsMax: 5,
            targetRIR: 1,
            restSec: 180,
            tempo: null,
            notes: null,
            supersetGroup: null,
            autoregulationMode: 'PRESERVE_RIR',
            fatigueRate: null,
            loadAdjustmentPct: null,
            exercise: {
              id: 'e1',
              userId: 'u1',
              name: 'Barbell squat',
              muscleGroup: 'QUADS',
              category: 'COMPOUND',
              defaultRestSec: 180,
              notes: null,
              usesBodyweight: false,
              equipmentType: 'BARBELL',
              createdAt: new Date(),
            },
          },
        ],
      },
    ],
  } as unknown as ProgramFull;
}

describe('ProgramDetailView template branch', () => {
  it('shows technique trigger and best chip per exercise', () => {
    render(
      <ProgramDetailView program={templateProgram()} catalog={[]} bests={{ e1: '100 kg' }} />,
    );
    expect(
      screen.getByRole('button', { name: 'View technique for Barbell squat' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Best 100 kg/)).toBeInTheDocument();
    expect(screen.getByText(/3 x 5-5/)).toBeInTheDocument();
  });
});
