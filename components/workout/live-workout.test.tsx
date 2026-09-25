import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
