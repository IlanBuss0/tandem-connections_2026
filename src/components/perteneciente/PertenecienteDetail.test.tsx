import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/data/usageApi', async importOriginal => ({
  ...(await importOriginal<typeof import('@/data/usageApi')>()),
  fetchEvolutionReport: vi.fn(async () => []),
  fetchEvolutionDaily: vi.fn(async () => []),
}));

import { fetchEvolutionReport } from '@/data/usageApi';
import PertenecienteDetail, { type PertenecienteDetailProps } from './PertenecienteDetail';

const NOTICE = 'El historial no está habilitado para este vínculo.';
const person = { id: '7', name: 'Paciente Uno', avatar: '', age: 12 } as PertenecienteDetailProps['person'];
const open = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  window.sessionStorage.clear();
  vi.mocked(fetchEvolutionReport).mockClear();
});

describe('PertenecienteDetail con role="tutor"', () => {
  it('conserva sus pestañas, el cuerpo de Sesiones y la IA compartida', () => {
    render(<PertenecienteDetail person={person} role="tutor" currentUserId="1" onAskAI={async () => ''} />);
    expect(screen.getByText('Una mirada de esta semana')).toBeInTheDocument();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    expect(fetchEvolutionReport).toHaveBeenCalledTimes(1);

    open('Sesiones');
    expect(screen.getByText('Sesiones permitidas')).toBeInTheDocument();
    expect(screen.getByText('Reportes')).toBeInTheDocument();

    open('IA');
    expect(screen.getAllByText('Preguntale a TÁNDEM').length).toBeGreaterThan(0);
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it('nunca muestra "Tu próxima sesión" ni la nota de permisos (solo llegan por summaryTop)', () => {
    render(<PertenecienteDetail person={person} role="tutor" currentUserId="1" />);
    expect(screen.queryByText('Tu próxima sesión')).not.toBeInTheDocument();
    expect(screen.queryByText(/Su familia te habilitó/)).not.toBeInTheDocument();
  });

  it('sin initialTab abre con la pestaña recordada', () => {
    window.sessionStorage.setItem('tandem:perteneciente-tab:1:7', 'sessions');
    render(<PertenecienteDetail person={person} role="tutor" currentUserId="1" />);
    expect(screen.getByText('Sesiones permitidas')).toBeInTheDocument();
  });
});

describe('PertenecienteDetail con role="professional"', () => {
  it('initialTab manda sobre la pestaña recordada y sessionsSlot reemplaza el cuerpo de Sesiones', () => {
    window.sessionStorage.setItem('tandem:perteneciente-tab:1:7', 'ai');
    render(<PertenecienteDetail person={person} role="professional" currentUserId="1" initialTab="sessions" sessionsSlot={<p>Contenido del Profesional</p>} />);
    expect(screen.getByText('Contenido del Profesional')).toBeInTheDocument();
    expect(screen.queryByText('Sesiones permitidas')).not.toBeInTheDocument();

    open('Resumen');
    expect(screen.getByText('Una mirada de esta semana')).toBeInTheDocument();
    open('Sesiones');
    expect(screen.getByText('Contenido del Profesional')).toBeInTheDocument();
  });

  it('"Ver los N reportes" llama a onViewReports (y sin él, abre Sesiones)', () => {
    const report = { id: 1, id_profesional: 1, id_perteneciente: 7, titulo: 'R', contenido: 'x', id_tipo: 'manual', fecha_generacion: '2026-09-01T10:00:00Z', enviado_al_tutor: true, fecha_envio: null } as NonNullable<PertenecienteDetailProps['reports']>[number];
    const onViewReports = vi.fn();
    const { unmount } = render(<PertenecienteDetail person={person} role="professional" currentUserId="1" reports={[report]} onViewReports={onViewReports} />);
    fireEvent.click(screen.getByRole('button', { name: /Ver los 1 reportes/ }));
    expect(onViewReports).toHaveBeenCalledTimes(1);
    unmount();
    render(<PertenecienteDetail person={person} role="tutor" currentUserId="1" reports={[report]} />);
    fireEvent.click(screen.getByRole('button', { name: /Ver los 1 reportes/ }));
    expect(screen.getByText('Sesiones permitidas')).toBeInTheDocument();
  });

  it('"Ver los N reportes" llama a onViewReports (y sin él, abre Sesiones)', () => {
    const report = { id: 1, id_profesional: 1, id_perteneciente: 7, titulo: 'R', contenido: 'x', id_tipo: 'manual', fecha_generacion: '2026-09-01T10:00:00Z', enviado_al_tutor: true, fecha_envio: null } as NonNullable<PertenecienteDetailProps['reports']>[number];
    const onViewReports = vi.fn();
    const { unmount } = render(<PertenecienteDetail person={person} role="professional" currentUserId="1" reports={[report]} onViewReports={onViewReports} />);
    fireEvent.click(screen.getByRole('button', { name: /Ver los 1 reportes/ }));
    expect(onViewReports).toHaveBeenCalledTimes(1);
    unmount();
    render(<PertenecienteDetail person={person} role="tutor" currentUserId="1" reports={[report]} />);
    fireEvent.click(screen.getByRole('button', { name: /Ver los 1 reportes/ }));
    expect(screen.getByText('Sesiones permitidas')).toBeInTheDocument();
  });

  it('summaryTop va arriba del Resumen y solo ahí', () => {
    render(<PertenecienteDetail person={person} role="professional" currentUserId="1" summaryTop={<p>Tu próxima sesión</p>} />);
    const top = screen.getByText('Tu próxima sesión');
    expect(top.compareDocumentPosition(screen.getByText('Una mirada de esta semana')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    open('Evolución');
    expect(screen.queryByText('Tu próxima sesión')).not.toBeInTheDocument();
  });

  it('sin permiso de historial el Resumen con summaryTop no repite el aviso genérico', () => {
    render(<PertenecienteDetail person={person} role="professional" currentUserId="1" canViewHistory={false} summaryTop={<p>Nota de permisos</p>} />);
    expect(screen.getByText('Nota de permisos')).toBeInTheDocument();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it('sin permiso de historial muestra el aviso, no pide evolución y deja Sesiones', () => {
    render(<PertenecienteDetail person={person} role="professional" currentUserId="1" canViewHistory={false} sessionsSlot={<p>Contenido del Profesional</p>} />);
    for (const name of ['Resumen', 'Evolución', 'Colaboración', 'IA']) {
      open(name);
      expect(screen.getByText(NOTICE)).toBeInTheDocument();
    }
    open('Sesiones');
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    expect(screen.getByText('Contenido del Profesional')).toBeInTheDocument();
    expect(fetchEvolutionReport).not.toHaveBeenCalled();
  });
});
