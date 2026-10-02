import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GROUP_FILL, MuscleMapCard } from './muscle-map-card';
import { BODY_FILL } from './body-paths';
import { buildMuscleMap } from '@/lib/muscle-map';

const WEEK = 'W33 2026';

describe('MuscleMapCard', () => {
  it('renders the front figure by default with a region per front area', () => {
    render(<MuscleMapCard regions={buildMuscleMap({})} weekLabel={WEEK} />);

    expect(screen.getByRole('group', { name: 'Front' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Back' })).not.toBeInTheDocument();
    // 13 paintable front regions.
    expect(document.querySelectorAll('svg path[aria-label]')).toHaveLength(13);
  });

  it('switches to the back figure with its regions on tab tap', async () => {
    const user = userEvent.setup();
    render(<MuscleMapCard regions={buildMuscleMap({})} weekLabel={WEEK} />);

    await user.click(screen.getByRole('tab', { name: 'Back' }));
    expect(screen.getByRole('group', { name: 'Back' })).toBeInTheDocument();
    // 14 paintable back regions.
    expect(document.querySelectorAll('svg path[aria-label]')).toHaveLength(14);
  });

  it('paints each muscle in its identity hue with the set count in the label', () => {
    // 14 sets sit inside the default 10-20 band; 25 sits above it.
    render(
      <MuscleMapCard regions={buildMuscleMap({ CHEST: 14, QUADS: 25 })} weekLabel={WEEK} />,
    );

    const chest = screen.getAllByLabelText('Chest: 14 sets this week, within range');
    expect(chest).toHaveLength(2);
    expect(chest[0]).toHaveStyle({ fill: GROUP_FILL.CHEST });
    expect(chest[0]!.style.filter).toContain('drop-shadow');

    const quads = screen.getAllByLabelText('Quads: 25 sets this week, above MRV');
    expect(quads[0]).toHaveStyle({ fill: GROUP_FILL.QUADS });

    const untouched = screen.getAllByLabelText('Abs: 0 sets this week, untrained');
    expect(untouched[0]).toHaveStyle({ fill: BODY_FILL });
    expect(untouched[0]!.style.filter).toBe('');
  });

  it('shows the tapped region detail below the figure', async () => {
    const user = userEvent.setup();
    render(<MuscleMapCard regions={buildMuscleMap({ CHEST: 14 })} weekLabel={WEEK} />);

    await user.click(screen.getAllByLabelText('Chest: 14 sets this week, within range')[0]!);
    expect(screen.getByTestId('muscle-map-detail')).toHaveTextContent(
      'Chest: 14 sets this week, within range',
    );
  });

  it('renders an empty state when no muscle was trained that week', () => {
    render(<MuscleMapCard regions={buildMuscleMap({})} weekLabel={WEEK} />);
    expect(screen.getByTestId('muscle-map-detail')).toHaveTextContent(
      /no working sets that week/i,
    );
  });

  it('keeps regions focusable by keyboard', () => {
    render(<MuscleMapCard regions={buildMuscleMap({})} weekLabel={WEEK} />);
    const figure = screen.getByRole('group', { name: 'Front' });
    const firstRegion = within(figure).getAllByRole('img')[0]!;
    firstRegion.focus();
    expect(firstRegion).toHaveFocus();
  });
});
