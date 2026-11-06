import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import UserActivities from './UserActivities';

const data = vi.hoisted(() => ({
  user: { id: '1' },
  activities: [
    { id: 'other', assignedActivityId: 11, title: 'Otra actividad', status: 'pendiente', category: 'higiene', steps: [], type: 'juego', difficulty: 'fácil' },
    { id: 'target', assignedActivityId: 22, title: 'Actividad elegida', status: 'pendiente', category: 'higiene', steps: [], type: 'juego', difficulty: 'fácil' },
  ],
  complete: vi.fn(),
}));
vi.mock('@/data/api', () => ({ fetchActivitiesForUser: async () => data.activities, completeAssignedActivity: data.complete }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: data.user }) }));
vi.mock('@/contexts/CustomActivitiesContext', () => ({ useCustomActivities: () => ({ forUser: () => [], complete: vi.fn() }) }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissionContext: () => ({}), isPermissionEnabled: () => true, PERTENECIENTE_PERMISSIONS: {} }));
vi.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('./ActivityExecution', () => ({ default: ({ activity, onBack, onComplete }: { activity: { id: string; title: string }; onBack: () => void; onComplete: (id: string, score: number) => void }) => (
  <div>
    <h1>Jugando: {activity.title}</h1>
    <button onClick={() => onComplete(activity.id, 85)}>Finalizar juego</button>
    <button onClick={onBack}>Volver al catálogo</button>
  </div>
) }));

describe('Ejecución desde la recomendación de Inicio', () => {
  it('espera los datos y abre la asignación correcta, registra solo al finalizar y permite volver', async () => {
    data.complete.mockClear();
    render(<UserActivities initialAssignedActivityId="22" startActivity onHome={vi.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Jugando: Actividad elegida' })).toBeInTheDocument();
    expect(data.complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar juego' }));
    await waitFor(() => expect(data.complete).toHaveBeenCalledWith(data.activities[1], '1', 85));
    fireEvent.click(screen.getByRole('button', { name: 'Volver al catálogo' }));
    expect(screen.queryByRole('heading', { name: /Jugando:/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver actividades anteriores \(1\)/ })).toBeInTheDocument();
  });
});
