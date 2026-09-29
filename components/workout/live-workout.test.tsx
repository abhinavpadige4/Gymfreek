import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LiveWorkout } from './live-workout';

describe('LiveWorkout voice toggle', () => {
  it('shows a mute button that persists the preference', async () => {
    const user = userEvent.setup({ delay: null });
    window.localStorage.clear();
    render(<LiveWorkout exercise="squat" />);

    const mute = screen.getByRole('button', { name: 'Mute voice cues' });
    await user.click(mute);
    expect(screen.getByRole('button', { name: 'Unmute voice cues' })).toBeInTheDocument();
    expect(window.localStorage.getItem('100xu-voice')).toBe('off');

    await user.click(screen.getByRole('button', { name: 'Unmute voice cues' }));
    expect(window.localStorage.getItem('100xu-voice')).toBe('on');
  });

  it('explains clearly when camera counting is unavailable', () => {
    render(<LiveWorkout exercise="box jumps" />);
    const start = screen.getByRole('button', {
      name: 'Camera counting is not available for box jumps yet',
    });
    expect(start).toBeDisabled();
  });

  it('auto-starts with a 5-4-3-2-1 countdown and no start tap', () => {
    vi.useFakeTimers();
    try {
      render(<LiveWorkout exercise="squat" autoStart />);
      // No Start button: the countdown takes its place.
      expect(screen.queryByRole('button', { name: 'Start camera' })).not.toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText('3')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
