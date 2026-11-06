import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import UserCalendar from './UserCalendar';
import type { DayRoutine } from '@/contexts/RoutinesContext';

const data = vi.hoisted(() => ({
  allowed: true, routineAllowed: true,
  addEvent: vi.fn(), updateEvent: vi.fn(), addItem: vi.fn(), toggleItem: vi.fn(),
  events: [{ id: 'e1', title: 'Consulta', description: 'Consulta programada', date: '2026-11-06', time: '09:00', type: 'mañana', reminders: [-120] }],
  routines: [{ id: 'r1', name: 'Mi rutina', dayOfWeek: 5, items: [{ id: 's1', title: 'Preparar la mochila', time: '08:00', category: 'mañana', completed: false, icon: '🎒' }] }] as DayRoutine[],
}));
vi.mock('@/contexts/CalendarContext', () => ({ useCalendar: () => ({ events: data.events, addEvent: data.addEvent, updateEvent: data.updateEvent, deleteEvent: vi.fn(), eventTypePatterns: [] }), eventTypes: [] }));
vi.mock('@/contexts/RoutinesContext', () => ({
  useRoutines: () => ({ routines: data.routines, customCategories: [], hiddenPredefined: [], dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'], addItem: data.addItem, toggleItem: data.toggleItem }),
  predefinedCategories: ['mañana'], predefinedLabels: { mañana: 'Mañana' },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: '1' } }) }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissionContext: () => ({}), isPermissionEnabled: (_: unknown, permission: string) => permission === 'routine' ? data.routineAllowed : data.allowed, PERTENECIENTE_PERMISSIONS: { USAR_CALENDARIO: 'calendar', USAR_MI_DIA: 'routine' } }));
vi.mock('@/hooks/useCalendarPictograms', () => ({ useCalendarPictograms: () => undefined }));
vi.mock('@/hooks/useRoutinePictograms', () => ({ useRoutinePictograms: () => undefined }));
vi.mock('@/data/api', () => ({ fetchPictograms: async () => [], rememberPictogramChoice: vi.fn() }));
vi.mock('@/components/EventPictogram', () => ({ default: () => null }));
vi.mock('@/components/RoutinePictogram', () => ({ default: () => null }));
vi.mock('@/components/RoutinePictogramPicker', () => ({ default: () => null }));
vi.mock('@/components/SpeakButton', () => ({ default: () => null }));
vi.mock('@/components/SocialStoryView', () => ({ default: () => null }));
vi.mock('@/components/StartTaskHint', () => ({ default: () => null }));
vi.mock('@/components/GuidedRoutineMode', () => ({ default: () => null }));
vi.mock('@/components/SectionSelector', () => ({ default: () => null }));

describe('Calendario A', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 6, 12));
    data.allowed = true; data.routineAllowed = true;
    data.routines = [{ id: 'r1', name: 'Mi rutina', dayOfWeek: 5, items: [{ id: 's1', title: 'Preparar la mochila', time: '08:00', category: 'mañana', completed: false, icon: '🎒' }] }];
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => vi.useRealTimers());

  it('destaca la selección y conserva hoy como indicador secundario sin mover eventos', () => {
    render(<UserCalendar onBack={vi.fn()} />);
    const today = screen.getByRole('button', { name: /^6 de Noviembre/ });
    const other = screen.getByRole('button', { name: /^7 de Noviembre/ });
    expect(today).toHaveAttribute('aria-current', 'date');
    expect(today).toHaveClass('bg-[#6b4c9a]');
    fireEvent.click(other);
    expect(other).toHaveAttribute('aria-pressed', 'true');
    expect(other).toHaveClass('bg-[#6b4c9a]');
    expect(today).not.toHaveClass('bg-[#6b4c9a]');
    expect(today).toHaveAttribute('aria-current', 'date');
    expect(screen.queryByText('Consulta programada')).not.toBeInTheDocument();
    fireEvent.click(today);
    expect(screen.getByText('Consulta programada')).toBeInTheDocument();
  });

  it('Nuevo evento abre el formulario y guarda avisos personalizados en minutos', async () => {
    render(<UserCalendar onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo evento' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Título'), { target: { value: 'Nueva consulta' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Personalizar aviso' }));
    fireEvent.change(within(dialog).getByLabelText('Cantidad'), { target: { value: '3' } });
    fireEvent.change(within(dialog).getByLabelText('Unidad'), { target: { value: '1440' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Agregar aviso' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Crear evento' }));
    expect(data.addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'Nueva consulta', date: '2026-11-06', reminders: [-4320] }));
    await screen.findByRole('heading', { name: 'Calendario' });
  });

  it('recupera el aviso personalizado al editar un evento existente', () => {
    render(<UserCalendar onBack={vi.fn()} />);
    fireEvent.click(screen.getAllByTitle('Editar')[0]);
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Quitar aviso 2 horas antes' })).toBeInTheDocument();
  });

  it('Agregar paso aparece después del último paso y usa la acción existente', async () => {
    render(<UserCalendar onBack={vi.fn()} />);
    const step = await screen.findByText('Preparar la mochila');
    const add = screen.getByRole('button', { name: 'Agregar paso' });
    expect(step.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(add);
    fireEvent.change(screen.getByPlaceholderText('¿Qué tenés que hacer?'), { target: { value: 'Guardar los útiles' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar paso' }));
    expect(data.addItem).toHaveBeenCalledWith('r1', expect.objectContaining({ title: 'Guardar los útiles' }));
  });

  it('conserva el bloqueo de calendario y de edición de rutinas', () => {
    data.routineAllowed = false;
    const view = render(<UserCalendar onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Agregar paso' })).not.toBeInTheDocument();
    expect(screen.getByText(/Tu tutor deshabilitó temporalmente Mi día/)).toBeInTheDocument();
    view.unmount();
    data.allowed = false;
    render(<UserCalendar onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Nuevo evento' })).not.toBeInTheDocument();
  });

  it('separa la rutina del detalle y muestra un estado claro al seleccionar un día sin rutina', async () => {
    render(<UserCalendar onBack={vi.fn()} />);
    const routine = await screen.findByRole('region', { name: 'El paso a paso de hoy' });
    const detail = screen.getByRole('region', { name: 'Detalle del día' });
    expect(detail.contains(routine)).toBe(false);
    expect(within(detail).queryByText('Preparar la mochila')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^7 de Noviembre/ }));
    expect(await screen.findByText('No hay rutina asignada a los Sábado.')).toBeInTheDocument();
    expect(screen.queryByText('Preparar la mochila')).not.toBeInTheDocument();
    expect(data.toggleItem).not.toHaveBeenCalled();
  });

  it('muestra muchos pasos en ambas vistas sin duplicarlos y conserva Agregar paso al final', async () => {
    data.routines[0].items = Array.from({ length: 12 }, (_, index) => ({ id: `s${index}`, title: `Tarea ${index + 1}`, time: '08:00', category: 'mañana', completed: index < 2, icon: '🎒' }));
    render(<UserCalendar onBack={vi.fn()} />);
    await screen.findByRole('heading', { name: 'Tarea 12' });
    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    expect(screen.getByRole('progressbar', { name: 'Progreso de la rutina' })).toHaveAttribute('aria-valuenow', '17');
    expect(screen.getByText('Siguiente paso').closest('li')).toHaveTextContent('Tarea 3');
    fireEvent.click(screen.getByRole('button', { name: 'Ver paso a paso' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    expect(screen.getByRole('button', { name: 'Ver listado' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Tarea 12').compareDocumentPosition(screen.getByRole('button', { name: 'Agregar paso' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver listado' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(12);
  });

  it('usa el control de avance existente y recupera el progreso compartido al volver a la pantalla', async () => {
    const view = render(<UserCalendar onBack={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Marcar completado: Preparar la mochila' }));
    expect(data.toggleItem).toHaveBeenCalledWith('r1', 's1');
    // El contexto es la fuente de verdad; simula su actualización y vuelve a montar la vista.
    data.routines = data.routines.map(routine => ({ ...routine, items: routine.items.map(item => ({ ...item, completed: true })) }));
    view.unmount();
    render(<UserCalendar onBack={vi.fn()} />);
    expect(await screen.findByRole('button', { name: 'Marcar pendiente: Preparar la mochila' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.queryByText('Siguiente paso')).not.toBeInTheDocument();
  });
});
