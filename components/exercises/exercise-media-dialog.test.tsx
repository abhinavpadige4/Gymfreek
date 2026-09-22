import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ExerciseMediaDialog } from './exercise-media-dialog';

describe('ExerciseMediaDialog', () => {
  it('shows the local start and finish frames with source information', async () => {
    const user = userEvent.setup();
    render(
      <ExerciseMediaDialog
        exerciseName="Barbell bench press"
        displayName="Barbell bench press"
        equipmentType="BARBELL"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'View technique for Barbell bench press' }),
    );
    expect(screen.getByAltText('Barbell bench press starting position')).toBeInTheDocument();
    expect(screen.getByAltText('Barbell bench press finishing position')).toBeInTheDocument();
    expect(screen.getByText(/public domain/i)).toBeInTheDocument();
    expect(screen.getByText(/required equipment: barbell/i)).toBeInTheDocument();
  });

  it('marks a close visual substitute as a similar variant', async () => {
    const user = userEvent.setup();
    render(
      <ExerciseMediaDialog
        exerciseName="Bulgarian split squat"
        displayName="Bulgarian split squat"
        equipmentType="DUMBBELL"
      />,
    );
    await user.click(
      screen.getByRole('button', { name: 'View technique for Bulgarian split squat' }),
    );
    expect(screen.getByText('Similar variant')).toBeInTheDocument();
  });

  it('offers a Commons search for an unknown custom exercise', async () => {    const user = userEvent.setup();
    render(
      <ExerciseMediaDialog
        exerciseName="Future custom movement"
        displayName="Future custom movement"
        equipmentType="OTHER"
      />,
    );
    await user.click(
      screen.getByRole('button', { name: 'View technique for Future custom movement' }),
    );
    expect(screen.getByRole('link', { name: /search wikimedia commons/i })).toHaveAttribute(
      'href',
      expect.stringContaining('title=Special:MediaSearch'),
    );
  });

  it('searches the movement family for a mapped variation', async () => {
    // Exact variation names find nothing on Commons; the family term does.
    const user = userEvent.setup();
    render(
      <ExerciseMediaDialog
        exerciseName="Dual dumbbell front squats"
        displayName="Dual dumbbell front squats"
        equipmentType="DUMBBELL"
      />,
    );
    await user.click(
      screen.getByRole('button', { name: 'View technique for Dual dumbbell front squats' }),
    );
    expect(screen.getByRole('link', { name: /search wikimedia commons/i })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('Barbell squat')),
    );
  });

  it('shows the technique cue card for a movement without frames', async () => {
    const user = userEvent.setup();
    render(
      <ExerciseMediaDialog
        exerciseName="Full chest-to-deck burpees"
        displayName="Full chest-to-deck burpees"
        equipmentType="BODYWEIGHT"
        notes="Chest and thighs touch deck, snap feet forward wide, vertical jump with clap. Load: Bodyweight."
      />,
    );
    await user.click(
      screen.getByRole('button', { name: 'View technique for Full chest-to-deck burpees' }),
    );
    expect(screen.getByText('How to perform')).toBeInTheDocument();
    expect(screen.getByText(/snap feet forward wide/)).toBeInTheDocument();
  });
});
