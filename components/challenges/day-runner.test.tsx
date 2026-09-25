import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayRunner } from './day-runner';

const TASKS = [
  { exerciseName: 'Goblet squats', loadLabel: '16 kg KB', instructions: 'Sit deep.', demoVideoUrl: null },
  { exerciseName: 'Push-ups', loadLabel: null, instructions: null, demoVideoUrl: null },
];

function renderRunner(requiredTasks = 2, restSec = 20) {
  return render(
    <DayRunner
      challengeId="c1"
      challengeDayId="d1"
      tasks={TASKS}
      restSec={restSec}
      requiredTasks={requiredTasks}
    />,
  );
}

describe('DayRunner guided flow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ valid: true }) })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function setupUser() {
    return userEvent.setup({ delay: null });
  }

  it('unlocks movements one by one and counts reps per task', async () => {
    const user = setupUser();
    renderRunner();

    await user.click(screen.getByRole('button', { name: 'Start day timer' }));
    expect(screen.getByText('Movement 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /log 100 without camera/i }));
    expect(screen.getByText('Movement 2 of 2')).toBeInTheDocument();
    expect(screen.queryByText('Locked')).not.toBeInTheDocument();
  });

  it('enables finish only when the required tasks are done', async () => {
    const user = setupUser();
    renderRunner(2, 1);

    await user.click(screen.getByRole('button', { name: 'Start day timer' }));
    const finish = screen.getByRole('button', { name: /complete 2 more|finish day/i });
    expect(finish).toBeDisabled();

    const logs = screen.getAllByRole('button', { name: /log 100 without camera/i });
    await user.click(logs[0]!);
    expect(screen.getByRole('button', { name: /complete 1 more/i })).toBeDisabled();

    // Let the 1s inter-task rest elapse, then finish the second movement.
    await screen.findByRole('button', { name: /log 100 without camera/i });
    await waitForElementToBeRemoved(() => screen.queryByText(/Rest \ds/), { timeout: 5000 });
    const enabledLogs = screen
      .getAllByRole('button', { name: /log 100 without camera/i })
      .filter((b) => !(b as HTMLButtonElement).disabled);
    expect(enabledLogs).toHaveLength(1);
    await user.click(enabledLogs[0]!);
    await user.click(screen.getByRole('button', { name: 'Finish day' }));
    expect(fetch).toHaveBeenCalledWith(
      '/api/ai/results',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(await screen.findByText(/VALID\. Next day unlocked/)).toBeInTheDocument();
  });

  it('lets recovery days finish early', async () => {
    const user = setupUser();
    renderRunner(1);

    await user.click(screen.getByRole('button', { name: 'Start day timer' }));
    await user.click(screen.getAllByRole('button', { name: /log 100 without camera/i })[0]!);
    expect(screen.getByRole('button', { name: 'Finish day' })).toBeEnabled();
  });
});
