import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayRunner } from './day-runner';

// Unsupported by the camera registry on purpose: exercises use Log 10x10.
const TASKS = [
  { exerciseName: 'Box Step-Overs', loadLabel: '20 inch Box', instructions: null, demoVideoUrl: null, best: null },
  { exerciseName: 'Wall March', loadLabel: null, instructions: null, demoVideoUrl: null, best: { reps: 100, averageScore: 80 } },
];

function renderRunner(requiredTasks = 2, restSec = 20) {
  return render(
    <DayRunner
      challengeId="c1"
      challengeDayId="d1"
      dayNumber={1}
      tasks={TASKS}
      restSec={restSec}
      requiredTasks={requiredTasks}
    />,
  );
}

describe('DayRunner guided flow', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ valid: true }) })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function setupUser() {
    return userEvent.setup({ delay: null });
  }

  it('shows two actions per move plus present and best', async () => {
    const user = setupUser();
    renderRunner();

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    expect(screen.getByText('Move 1 of 2')).toBeInTheDocument();
    // Two actions only: technique dialog trigger + record fallback log.
    expect(
      screen.getByRole('button', { name: 'View technique for Box Step-Overs' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log 10x10' })).toBeInTheDocument();
    // Present vs best tiles.
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Best')).toBeInTheDocument();
  });

  it('auto-advances with DONE and auto-finishes the day', async () => {
    const user = setupUser();
    renderRunner(2, 1);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await user.click(screen.getByRole('button', { name: 'Log 10x10' }));
    expect(await screen.findByText('DONE Box Step-Overs')).toBeInTheDocument();
    expect(await screen.findByText('Move 2 of 2', {}, { timeout: 5000 })).toBeInTheDocument();

    await screen.findByRole('button', { name: 'Log 10x10' });
    await user.click(screen.getByRole('button', { name: 'Log 10x10' }));

    expect(fetch).toHaveBeenCalledWith(
      '/api/ai/results',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(await screen.findByText(/VALID\. Next opens 00:00 UTC/)).toBeInTheDocument();
    // Temp session cleared after the day is stored.
    expect(sessionStorage.getItem('100xu-sess-d1')).toBeNull();
  });

  it('keeps in-day progress in session storage across remounts', async () => {
    const user = setupUser();
    const { unmount } = renderRunner(2, 20);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await user.click(screen.getByRole('button', { name: 'Log 10x10' }));
    expect(await screen.findByText('DONE Box Step-Overs')).toBeInTheDocument();
    unmount();

    renderRunner(2, 20);
    expect(await screen.findByText('Move 2 of 2', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('lets recovery days finish early', async () => {
    const user = setupUser();
    renderRunner(1);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await user.click(screen.getByRole('button', { name: 'Log 10x10' }));
    expect(fetch).toHaveBeenCalledWith(
      '/api/ai/results',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
