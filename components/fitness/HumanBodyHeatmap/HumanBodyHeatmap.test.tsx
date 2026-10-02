import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HumanBodyHeatmap } from './HumanBodyHeatmap';
import type { HeatmapData, HeatPeriodData } from './muscleData';

function periodWith(chestIntensity: number): HeatPeriodData {
  return {
    groups: {
      CHEST: { intensity: chestIntensity, reps: 340, sets: 12, volume: 4200 },
      QUADS: { intensity: 92, reps: 368, sets: 14, volume: 5100 },
    },
    exercises: {
      CHEST: [
        { name: 'Push Ups', reps: 120 },
        { name: 'Bench Press', reps: 80 },
      ],
    },
  };
}

function mockData(chest7d = 85): HeatmapData {
  const empty: HeatPeriodData = { groups: {}, exercises: {} };
  return { TODAY: empty, '7D': periodWith(chest7d), '30D': periodWith(40), ALL: periodWith(70) };
}

describe('HumanBodyHeatmap', () => {
  it('renders the front figure, periods, legend and summary', () => {
    render(<HumanBodyHeatmap data={mockData()} />);
    expect(screen.getByRole('group', { name: 'Front body heatmap' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /left chest muscle, 85 percent/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Time range' })).toBeInTheDocument();
    expect(screen.getByText('Overall')).toBeInTheDocument();
  });

  it('switches between front and back bodies', () => {
    render(<HumanBodyHeatmap data={mockData()} />);
    fireEvent.click(screen.getByRole('button', { name: 'BACK' }));
    expect(screen.getByRole('group', { name: 'Back body heatmap' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /chest muscle/i })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /trapezius muscle/i })).toBeInTheDocument();
  });

  it('selects a muscle on click and shows its details', () => {
    render(<HumanBodyHeatmap data={mockData()} />);
    fireEvent.click(screen.getByRole('img', { name: /left chest muscle/i }));
    expect(screen.getByRole('heading', { name: 'Left Chest' })).toBeInTheDocument();
    expect(screen.getByText('Push Ups')).toBeInTheDocument();
    expect(screen.getByText('HIGH LOAD')).toBeInTheDocument();
  });

  it('dims muscles outside the active filter', () => {
    render(<HumanBodyHeatmap data={mockData()} />);
    fireEvent.click(screen.getByRole('button', { name: 'LOWER' }));
    const chest = screen.getByRole('img', { name: /left chest muscle/i });
    expect(chest.getAttribute('fill-opacity')).toBe('0.22');
    const quad = screen.getByRole('img', { name: /left quadriceps muscle/i });
    expect(quad.getAttribute('fill-opacity')).toBe('1');
  });

  it('updates intensities when the period changes', () => {
    render(<HumanBodyHeatmap data={mockData(85)} />);
    fireEvent.click(screen.getByRole('button', { name: '30D' }));
    expect(
      screen.getByRole('img', { name: /left chest muscle, 40 percent/i }),
    ).toBeInTheDocument();
  });

  it('shows a hover tooltip with reps and sets', () => {
    render(<HumanBodyHeatmap data={mockData()} />);
    const chest = screen.getByRole('img', { name: /left chest muscle/i });
    fireEvent.mouseEnter(chest, { clientX: 100, clientY: 120 });
    expect(screen.getByRole('status')).toHaveTextContent('LEFT CHEST');
    expect(screen.getByRole('status')).toHaveTextContent('340');
    fireEvent.mouseLeave(chest);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the empty state with a workout CTA when untrained', () => {
    const empty: HeatPeriodData = { groups: {}, exercises: {} };
    render(<HumanBodyHeatmap data={{ TODAY: empty, '7D': empty, '30D': empty, ALL: empty }} />);
    const cta = screen.getByRole('link', { name: 'START WORKOUT' });
    expect(cta).toHaveAttribute('href', '/session/new');
  });
});
