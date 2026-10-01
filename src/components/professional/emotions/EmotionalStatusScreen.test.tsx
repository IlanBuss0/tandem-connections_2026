import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { EmotionalRecord, User } from '@/data/api';
import type { PatientLink } from '@/lib/professionalPatientsModel';
import { localDateKey } from '@/lib/agendaFormat';
import { addDays } from '@/lib/emotionSummary';
import EmotionalStatusScreen from './EmotionalStatusScreen';

const TODAY = localDateKey(new Date());
let seq = 0;
const rec = (userId: string, date: string, emotion: string, emoji: string, timestamp: string, over: Partial<EmotionalRecord> = {}): EmotionalRecord => ({
  id: String(++seq), userId, emotion, emoji, intensity: 4, context: '', whatHelped: '', timestamp, date, ...over,
});
const user = (id: number, name: string) => ({ id: String(id), name }) as unknown as User;
const link = (id: number, canViewHistory = true): PatientLink => ({ pertenecienteId: id, canViewHistory, canSchedule: true, canAssignActivities: true });

const people = [user(1, 'Martina Paz'), user(2, 'Sol Vega'), user(3, 'Tomás Gil'), user(4, 'Caro Ruiz'), user(5, 'Joel Sanz')];
const links = Object.fromEntries(people.map(p => [p.id, link(Number(p.id))]));
const emotions = {
  '1': [
    rec('1', TODAY, 'Ansioso', '😰', '18:00', { context: 'Antes de la prueba', whatHelped: 'Respirar hondo' }),
    rec('1', TODAY, 'Contento', '😊', '09:00'),
    rec('1', addDays(TODAY, -1), 'Contento', '😊', '10:00'),
  ],
  '2': [rec('2', TODAY, 'Enojado', '😠', '12:00')],
};

const renderScreen = (over: Partial<Parameters<typeof EmotionalStatusScreen>[0]> = {}) =>
  render(<EmotionalStatusScreen patients={people.slice(0, 2)} emotionsByUser={emotions} links={links} loading={false} {...over} />);

describe('EmotionalStatusScreen', () => {
  it('semana: último registro del día como emoji, ×n, detalle completo de hoy y números', () => {
    renderScreen();
    expect(screen.getByText('Últimos 7 días')).toBeInTheDocument();
    const todayButton = screen.getByRole('button', { name: /2 registros, último: Ansioso/ });
    expect(todayButton).toHaveAttribute('aria-pressed', 'true');
    expect(within(todayButton).getByText('×2')).toBeInTheDocument();
    expect(screen.getByText(/^Hoy, /)).toBeInTheDocument();
    expect(screen.getByText('Antes de la prueba')).toBeInTheDocument();
    expect(screen.getByText('Respirar hondo')).toBeInTheDocument();
    expect(screen.getByText('Días con registro').nextSibling).toHaveTextContent('2 de 7');
    expect(screen.getByText('Semana anterior: 0')).toBeInTheDocument();
    expect(screen.getByText('Emoción más elegida')).toBeInTheDocument();
  });

  it('elegir otro día muestra sus registros; un día vacío dice que no hubo', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: /^.*1 registro, último: Contento/ }));
    expect(screen.getByText(/^Ayer, /)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /sin registros/ })[0]);
    expect(screen.getByText('No hubo registros este día.')).toBeInTheDocument();
  });

  it('flechas: → deshabilitada en la semana actual y ← llega hasta 6 semanas atrás', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: 'Semana siguiente' })).toBeDisabled();
    const prev = screen.getByRole('button', { name: 'Semana anterior' });
    for (let i = 0; i < 6; i++) fireEvent.click(prev);
    expect(prev).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Semana siguiente' })).toBeEnabled();
    expect(screen.queryByText('Últimos 7 días')).not.toBeInTheDocument();
  });

  it('cambia a vista mensual (futuros deshabilitados) y al cambiar de paciente vuelve a hoy y a la semana', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a vista mensual' }));
    expect(screen.getByText('Vista mensual')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cambiar a vista semanal' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mes anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sol Vega' }));
    expect(screen.getByText('Vista mensual')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /1 registro, último: Enojado/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sin permiso: candado y ningún registro', () => {
    renderScreen({ links: { ...links, '1': link(1, false) } });
    expect(screen.getByText('La familia de Martina no habilitó el historial.')).toBeInTheDocument();
    expect(screen.queryByText('Antes de la prueba')).not.toBeInTheDocument();
    expect(screen.queryByText('Emoción más elegida')).not.toBeInTheDocument();
  });

  it('sin registros y cargando', () => {
    const { unmount } = renderScreen({ emotionsByUser: {} });
    expect(screen.getByText('Martina todavía no hizo registros.')).toBeInTheDocument();
    unmount();
    renderScreen({ loading: true });
    expect(screen.getByLabelText('Cargando registros')).toBeInTheDocument();
  });

  it('con más de 4 pacientes: 4 chips + Ver más que abre el mini modal', () => {
    renderScreen({ patients: people });
    expect(screen.getByText('Elegí de quién querés ver los registros')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Joel Sanz' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    fireEvent.click(screen.getByRole('button', { name: /Joel Sanz/ }));
    expect(screen.getByRole('button', { name: 'Joel Sanz' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Joel todavía no hizo registros.')).toBeInTheDocument();
  });

  it('incluye la nota fija al pie', () => {
    renderScreen();
    expect(screen.getByText('Son registros que escribió la persona. No es una evaluación ni un diagnóstico.')).toBeInTheDocument();
  });
});
