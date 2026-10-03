import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayRunner } from './day-runner';

// Unsupported by the camera registry on purpose: exercises use Log +10.
const TASKS = [
  { exerciseName: 'Box Step-Overs', loadLabel: '20 inch Box', instructions: null, demoVideoUrl: null, best: null },
  { exerciseName: 'Wall March', loadLabel: null, instructions: null, demoVideoUrl: null, best: { reps: 100, averageScore: 80 } },
];

function renderRunner(requiredTasks = 2, restSec = 20, practice = false) {
  return render(
    <DayRunner
      challengeId="c1"
      challengeDayId="d1"
      dayNumber={1}
      tasks={TASKS}
      restSec={restSec}
      requiredTasks={requiredTasks}
      practice={practice}
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

  async function logFullMove(user: ReturnType<typeof setupUser>) {
    // One tap logs one round (+10): ten deliberate taps finish a move.
    for (let i = 0; i < 10; i++) {
      await user.click(screen.getByRole('button', { name: 'Log +10' }));
    }
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
    expect(screen.getByRole('button', { name: 'Log +10' })).toBeInTheDocument();
    // Present vs best tiles.
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Best')).toBeInTheDocument();
  });

  it('one tap logs +10 and never completes the move', async () => {
    const user = setupUser();
    renderRunner();

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await user.click(screen.getByRole('button', { name: 'Log +10' }));
    // Still on move 1, no DONE, nothing posted.
    expect(screen.getByText('Move 1 of 2')).toBeInTheDocument();
    expect(screen.queryByText(/DONE /)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('ten taps finish the move and auto-advance with DONE', async () => {
    const user = setupUser();
    renderRunner(2, 1);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await logFullMove(user);
    expect(await screen.findByText('DONE Box Step-Overs')).toBeInTheDocument();
    expect(await screen.findByText('Move 2 of 2', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('auto-finishes the day once every move hits 10x10', async () => {
    const user = setupUser();
    renderRunner(2, 1);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await logFullMove(user);
    expect(await screen.findByText('Move 2 of 2', {}, { timeout: 5000 })).toBeInTheDocument();
    await logFullMove(user);

    expect(fetch).toHaveBeenCalledWith(
      '/api/ai/results',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(await screen.findByText(/VALID\. Next opens 00:00 UTC/)).toBeInTheDocument();
    // Temp session cleared after the day is stored.
    expect(sessionStorage.getItem('100xu-sess-d1')).toBeNull();
  });

  it('redos a finished move without touching the best', async () => {
    const user = setupUser();
    renderRunner(2, 1);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await logFullMove(user);
    expect(await screen.findByText('DONE Box Step-Overs')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Redo' }));
    // Back to zero on the same move, best chip unchanged.
    expect(screen.getByText('Move 1 of 2')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps in-day progress in session storage across remounts', async () => {
    const user = setupUser();
    const { unmount } = renderRunner(2, 20);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await user.click(screen.getByRole('button', { name: 'Log +10' }));
    expect(sessionStorage.getItem('100xu-sess-d1')).not.toBeNull();
    unmount();

    renderRunner(2, 20);
    expect(await screen.findByText('Move 1 of 2', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('lets recovery days finish early', async () => {
    const user = setupUser();
    renderRunner(1);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await logFullMove(user);
    expect(fetch).toHaveBeenCalledWith(
      '/api/ai/results',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('keeps local progress and offers retry when the save is rejected', async () => {
    const user = setupUser();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Day is locked.' }),
    } as Response);
    renderRunner(1, 20);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await logFullMove(user);
    expect(await screen.findByText('Day is locked.')).toBeInTheDocument();
    // Progress kept for retry, not wiped.
    expect(sessionStorage.getItem('100xu-sess-d1')).not.toBeNull();
    const retry = await screen.findByRole('button', { name: 'Retry save' });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ valid: true }),
    } as Response);
    await user.click(retry);
    expect(await screen.findByText(/VALID\. Next opens 00:00 UTC/)).toBeInTheDocument();
    expect(sessionStorage.getItem('100xu-sess-d1')).toBeNull();
  });

  it('shows a rest overlay on move completion and skips into the next move', async () => {
    const user = setupUser();
    renderRunner(2, 60);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await logFullMove(user);
    expect(await screen.findByRole('dialog', { name: 'Rest' })).toBeInTheDocument();
    expect(screen.getByText('DONE Box Step-Overs')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip rest' }));
    expect(await screen.findByText('Move 2 of 2', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('caps rest extensions at two per rest', async () => {
    const user = setupUser();
    renderRunner(2, 60);

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    await logFullMove(user);
    const extend = await screen.findByRole('button', { name: '+30s' });
    await user.click(extend);
    await user.click(screen.getByRole('button', { name: '+30s (1 left)' }));
    const capped = screen.getByRole('button', { name: '+30s (0 left)' });
    expect(capped).toBeDisabled();
  });

  it('labels tap-counted moves so camera expectations stay honest', async () => {
    const user = setupUser();
    renderRunner();

    await user.click(screen.getByRole('button', { name: 'Start Day 1' }));
    expect(
      screen.getByText('Tap counting for this move - each tap logs 10 reps (1 of 10 rounds).'),
    ).toBeInTheDocument();
  });

  it('saves practice replays as free workouts without the challenge', async () => {
    const user = setupUser();
    renderRunner(1, 20, true);

    await user.click(screen.getByRole('button', { name: /Practice Day 1/ }));
    await logFullMove(user);
    expect(fetch).toHaveBeenCalledWith(
      '/api/ai/results',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0]?.[1] as { body: string }).body,
    ) as { challengeId?: string; challengeDayId?: string };
    expect(body.challengeId).toBeUndefined();
    expect(body.challengeDayId).toBeUndefined();
    expect(await screen.findByText('Practice saved.')).toBeInTheDocument();
  });
});
