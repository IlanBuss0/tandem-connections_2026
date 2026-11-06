import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UserHome from './UserHome';
import { apiRequest, ApiError } from '@/services/api/client';
import { tandemApi } from '@/services/api/tandem-api';
import type { ConfiguracionUsuario } from '@/types/database';

vi.mock('@/services/api/client', async importOriginal => ({ ...await importOriginal<typeof import('@/services/api/client')>(), apiRequest: vi.fn() }));
vi.mock('@/services/api/tandem-api', () => ({ tandemApi: { configuracionesUsuarios: { create: vi.fn(), update: vi.fn() } } }));
const selections = new Map<string, ConfiguracionUsuario>();

const data = vi.hoisted(() => ({
  user: { id: '1', role: 'user', name: 'Ana', username: 'ana' },
  activities: Array.from({ length: 4 }, (_, index) => ({ id: String(index + 1), title: `Actividad ${index + 1}`, description: `Descripción ${index + 1}`, status: 'pendiente', completed: false, assignedAt: '' })),
  routine: null as null | { id: string; items: { id: string; title: string; completed: boolean }[] },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: data.user }) }));
vi.mock('@/contexts/WalletContext', () => ({ useWallet: () => ({ state: { balance: 0, config: {} } }) }));
vi.mock('@/contexts/RoutinesContext', () => ({ useRoutines: () => ({ todayRoutine: data.routine }) }));
vi.mock('@/contexts/CalendarContext', () => ({ useCalendar: () => ({ events: [
  { id: 'e1', title: 'Cierre de año', date: '2026-12-31', time: '18:00' },
  { id: 'e2', title: 'Primer día', date: '2027-01-01', time: '10:00' },
] }) }));
vi.mock('@/data/api', () => ({ fetchPertenecienteHome: async () => ({ activities: data.activities, points: 0, level: 1 }) }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissionContext: () => ({}), isPermissionEnabled: () => true, PERTENECIENTE_PERMISSIONS: {} }));
vi.mock('@/hooks/useCalendarPictograms', () => ({ useCalendarPictograms: () => undefined }));
vi.mock('@/components/AvatarPreview', () => ({ default: () => null }));
vi.mock('@/components/EventPictogram', () => ({ default: () => null }));
vi.mock('@/components/EmotionEntryDialog', () => ({ default: ({ emotion }: { emotion: string | null }) => emotion ? <div role="dialog">{emotion}</div> : null }));

describe('Home del perteneciente', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 11, 31, 12));
    data.routine = null;
    data.user = { id: '1', role: 'user', name: 'Ana', username: 'ana' };
    selections.clear();
    vi.mocked(apiRequest).mockImplementation(async path => {
      const [, userId, key] = path.match(/usuario\/([^/]+)\/(.+)$/)!;
      const selection = selections.get(`${userId}:${decodeURIComponent(key)}`);
      if (!selection) throw new ApiError('No encontrada', 404);
      return selection;
    });
    vi.mocked(tandemApi.configuracionesUsuarios.create).mockImplementation(async payload => {
      const record = { ...payload, id: selections.size + 1 } as ConfiguracionUsuario;
      selections.set(`${record.id_usuario}:${record.clave}`, record);
      return { id: record.id };
    });
    data.activities = Array.from({ length: 4 }, (_, index) => ({ id: String(index + 1), title: `Actividad ${index + 1}`, description: `Descripción ${index + 1}`, status: 'pendiente', completed: false, assignedAt: '' }));
  });
  afterEach(() => vi.useRealTimers());

  it('atraviesa febrero de un año bisiesto sin saltear fechas', async () => {
    vi.setSystemTime(new Date(2028, 1, 28, 12));
    render(<UserHome />);
    await screen.findByText('Actividad 4');
    fireEvent.click(screen.getByRole('button', { name: 'Día siguiente' }));
    expect(screen.getByText(/29 de febrero/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Día siguiente' }));
    expect(screen.getByText(/1 de marzo/)).toBeInTheDocument();
  });

  it('no inventa recomendaciones cuando solo hay actividades completadas', async () => {
    data.activities = data.activities.map(activity => ({ ...activity, completed: true, status: 'completada' }));
    render(<UserHome />);
    expect(await screen.findByRole('heading', { name: '¡Estás al día!' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Comenzar actividad' })).not.toBeInTheDocument();
  });

  it('cambia los eventos al cruzar mes y año y abre el calendario en esa fecha', async () => {
    const navigate = vi.fn();
    render(<UserHome onNavigate={navigate} />);
    await screen.findByText('Actividad 1');
    expect(screen.getByText('Cierre de año')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Día siguiente' }));
    expect(screen.getByText('Primer día')).toBeInTheDocument();
    expect(screen.queryByText('Cierre de año')).not.toBeInTheDocument();
    expect(screen.getByText('2027', { exact: false })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver calendario' }));
    expect(navigate).toHaveBeenLastCalledWith('calendar', { date: '2027-01-01' });
    fireEvent.click(screen.getByRole('button', { name: 'Día anterior' }));
    expect(screen.getByText('Cierre de año')).toBeInTheDocument();
  });

  it('recomienda una pendiente real distinta de las tareas visibles y pide iniciar su ejecución', async () => {
    const navigate = vi.fn();
    render(<UserHome onNavigate={navigate} />);
    await screen.findByText('Actividad 4');
    const section = screen.getByRole('region', { name: 'Actividad del día' });
    expect(within(section).getByText('Actividad 4')).toBeInTheDocument();
    expect(within(section).queryByText('Actividad 1')).not.toBeInTheDocument();
    fireEvent.click(within(section).getByRole('button', { name: 'Comenzar actividad' }));
    expect(navigate).toHaveBeenCalledWith('activities', { activityId: '4', start: 'true' });
    expect(screen.queryByText('Mi día: un paso más cerca')).not.toBeInTheDocument();
  });

  it('abre el paso concreto sin completar ni cambiar el progreso', async () => {
    data.routine = { id: 'r1', items: [{ id: 's1', title: 'Preparar mochila', completed: false }] };
    const navigate = vi.fn();
    render(<UserHome onNavigate={navigate} />);
    fireEvent.click(screen.getByRole('button', { name: /Preparar mochila/ }));
    expect(navigate).toHaveBeenCalledWith('calendar', { routineId: 'r1', itemId: 's1', focus: 'routine' });
    expect(data.routine.items[0].completed).toBe(false);
    await screen.findByText('Actividad 3');
  });

  it('mantiene el modal de emociones y el acceso al traductor', async () => {
    const navigate = vi.fn();
    render(<UserHome onNavigate={navigate} />);
    await screen.findByText('Actividad 4');
    fireEvent.click(screen.getByRole('button', { name: /Feliz/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Feliz');
    fireEvent.click(screen.getByRole('button', { name: /Abrir traductor/ }));
    expect(navigate).toHaveBeenCalledWith('pictograms', { mode: 'traductor' });
  });

  it('mantiene la elección al volver a Home sin terminar y no felicita por completar otra', async () => {
    const first = render(<UserHome />);
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    first.unmount();
    data.activities = data.activities.map(item => item.id === '1' ? { ...item, completed: true, status: 'completada' } : item);
    render(<UserHome />);
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    expect(within(screen.getByRole('region', { name: 'Actividad del día' })).getByText('Actividad 4')).toBeInTheDocument();
    expect(screen.queryByText('¡Completaste tu actividad de hoy!')).not.toBeInTheDocument();
  });

  it('verifica la finalización al volver, conserva la felicitación al recargar y solo explora el catálogo', async () => {
    const navigate = vi.fn();
    const first = render(<UserHome onNavigate={navigate} />);
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    first.unmount();
    data.activities = data.activities.map(item => item.id === '4' ? { ...item, completed: true, status: 'completada' } : item);
    const second = render(<UserHome onNavigate={navigate} />);
    await screen.findByRole('heading', { name: '¡Completaste tu actividad de hoy!' });
    second.unmount();
    render(<UserHome onNavigate={navigate} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Explorar actividades' }));
    expect(navigate).toHaveBeenLastCalledWith('activities');
    expect(screen.queryByRole('button', { name: 'Comenzar actividad' })).not.toBeInTheDocument();
  });

  it('actualiza la finalización con el evento existente y cambia de objetivo al volver después de medianoche', async () => {
    render(<UserHome />);
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    data.activities = data.activities.map(item => item.id === '4' ? { ...item, completed: true } : item);
    act(() => window.dispatchEvent(new CustomEvent('tandem:activity-status-changed')));
    await screen.findByRole('heading', { name: '¡Completaste tu actividad de hoy!' });
    vi.setSystemTime(new Date(2027, 0, 1, 1));
    act(() => window.dispatchEvent(new Event('focus')));
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    expect(screen.queryByText('¡Completaste tu actividad de hoy!')).not.toBeInTheDocument();
    expect(selections.has('1:activities.daily:2027-01-01')).toBe(true);
  });

  it('separa usuarios y recupera la felicitación al volver a iniciar la sesión original', async () => {
    const first = render(<UserHome />);
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    first.unmount();
    data.activities = data.activities.map(item => item.id === '4' ? { ...item, completed: true } : item);
    data.user = { ...data.user, id: '2', name: 'Bruno' };
    const second = render(<UserHome />);
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    expect(screen.queryByText('¡Completaste tu actividad de hoy!')).not.toBeInTheDocument();
    second.unmount();
    data.user = { ...data.user, id: '1', name: 'Ana' };
    render(<UserHome />);
    await screen.findByRole('heading', { name: '¡Completaste tu actividad de hoy!' });
  });

  it('no muestra éxito si la finalización no quedó guardada o no puede verificar la selección', async () => {
    render(<UserHome />);
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    // Un intento de guardado fallido deja el estado real pendiente.
    act(() => window.dispatchEvent(new CustomEvent('tandem:activity-status-changed')));
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    expect(screen.queryByText('¡Completaste tu actividad de hoy!')).not.toBeInTheDocument();
    vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    act(() => window.dispatchEvent(new Event('focus')));
    await screen.findByText('No pudimos verificar tu actividad del día. Intentá nuevamente.');
    expect(screen.queryByRole('button', { name: 'Comenzar actividad' })).not.toBeInTheDocument();
    expect(screen.queryByText('¡Completaste tu actividad de hoy!')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByRole('button', { name: 'Comenzar actividad' });
  });

  it('detecta medianoche con la Home abierta, sin necesitar otra navegación', async () => {
    const interval = vi.spyOn(window, 'setInterval');
    render(<UserHome />);
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    vi.setSystemTime(new Date(2027, 0, 1, 0));
    const checkDay = interval.mock.calls.find(([, delay]) => delay === 30000)?.[0];
    expect(typeof checkDay).toBe('function');
    await act(async () => { (checkDay as () => void)(); });
    await screen.findByRole('button', { name: 'Comenzar actividad' });
    expect(selections.has('1:activities.daily:2027-01-01')).toBe(true);
    interval.mockRestore();
  });
});
