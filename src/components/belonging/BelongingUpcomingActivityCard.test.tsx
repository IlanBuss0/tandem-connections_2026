import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BelongingUpcomingActivityCard from './BelongingUpcomingActivityCard';

const activity = {
  id: 'assignment-42',
  title: 'Respiración para calmarse con un título suficientemente largo',
  description: 'Respiración guiada 4-4-6 con una explicación más extensa para verificar que el contenido pueda ocupar varias líneas sin perder legibilidad.',
  status: 'Pendiente',
  completed: false,
  assignedAt: '21-may',
};

describe('BelongingUpcomingActivityCard', () => {
  it('keeps the whole card navigable and renders the requested hierarchy', () => {
    const onOpen = vi.fn();
    render(<BelongingUpcomingActivityCard activity={activity} onOpen={onOpen} />);

    expect(screen.getByText(activity.title)).toBeInTheDocument();
    expect(screen.getByText(activity.description)).toBeInTheDocument();
    expect(screen.getByText('21 de mayo')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Actividad')).toBeInTheDocument();
    expect(screen.queryByText(/ver más/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `Abrir actividad: ${activity.title}` }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
