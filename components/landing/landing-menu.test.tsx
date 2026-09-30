import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingMenu } from './landing-menu';

describe('LandingMenu', () => {
  it('opens a vertical panel with login actions on tap', async () => {
    const user = userEvent.setup({ delay: null });
    render(<LandingMenu />);

    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();

    await user.click(button);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Join the challenge' })).toHaveAttribute(
      'href',
      '/signup',
    );
  });

  it('closes on Escape and returns focus to the button', async () => {
    const user = userEvent.setup({ delay: null });
    render(<LandingMenu />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
  });
});
