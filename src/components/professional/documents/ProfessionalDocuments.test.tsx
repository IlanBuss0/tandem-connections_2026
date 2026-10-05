import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfessionalSession } from '@/data/api';
import type { AgendaPatient } from '@/components/agenda/SessionFormSheet';
import ProfessionalDocuments from './ProfessionalDocuments';

const fetchNote = vi.fn();
vi.mock('@/data/api', () => ({ fetchPrivateProfessionalNote: (id: number) => fetchNote(id) }));
vi.mock('@/components/DriveExplorer', () => ({ default: () => <div>Explorador de Drive</div> }));
vi.mock('@/components/ProfessionalPrivateNote', () => ({ default: ({ session }: { session: ProfessionalSession }) => <div>Editor de nota {session.id}</div> }));

const day = (daysAgo: number, hour = 16) => new Date(2026, 8, 30 - daysAgo, hour).toISOString();
let seq = 0;
const s = (pid: number, daysAgo: number, over: Partial<ProfessionalSession> = {}): ProfessionalSession => ({
  id: ++seq, id_profesional: 1, id_perteneciente: pid, fecha_sesion: day(daysAgo), titulo: 'Sesión profesional', duracion_minutos: 45, estado: 'completada', recordatorios: [], ...over,
});
const patient = (id: number, name: string) => ({ id: String(id), name, pertenecienteId: id }) as unknown as AgendaPatient;
const patients = [patient(1, 'Martina'), patient(2, 'Sol'), patient(3, 'Joel')];

const sessions = [
  s(1, 1), s(1, 9, { has_note: true }), s(1, 16, { has_note: true }), s(1, 40, { has_note: true }),
  s(2, 2), s(2, 3), s(2, 4), s(2, 5), s(2, 6), s(2, 7),
  s(99, 1), // paciente sin vínculo: no debe aparecer
];

const renderDocs = (list = sessions, onRefresh = vi.fn()) => render(<ProfessionalDocuments sessions={list} patients={patients} onRefresh={onRefresh} />);

describe('ProfessionalDocuments', () => {
  beforeEach(() => {
    fetchNote.mockReset();
    fetchNote.mockImplementation(async (id: number) => ({ id, id_sesion_profesional: id, fecha_actualizacion: '', documento_drive: { id, google_file_id: `g${id}`, nombre: `Doc ${id}`, mime_type: '', web_view_url: `https://docs.google.com/${id}`, fecha_vinculacion: '' } }));
  });

  it('Para escribir: 5 más recientes, Ver más, sin pacientes sin vínculo; Drive debajo', () => {
    renderDocs();
    expect(screen.getByText('Para escribir · 7')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Escribir nota' })).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: /Ver más \(2\)/ }));
    expect(screen.getAllByRole('button', { name: 'Escribir nota' })).toHaveLength(7);
    expect(screen.getByText('Explorador de Drive')).toBeInTheDocument();
    expect(screen.getByText(/Tus notas son privadas/)).toBeInTheDocument();
    expect(fetchNote).not.toHaveBeenCalled();
  });

  it('sin sesiones pendientes no muestra "Para escribir"', () => {
    renderDocs([s(1, 9, { has_note: true })]);
    expect(screen.queryByText(/Para escribir/)).not.toBeInTheDocument();
  });

  it('carpetas con conteo, última fecha, sin nota y singular/plural', () => {
    renderDocs();
    expect(screen.getByText('3 notas · última el 21 sep')).toBeInTheDocument();
    expect(screen.getByText('1 sin nota')).toBeInTheDocument();
    expect(screen.getByText('6 sin nota')).toBeInTheDocument();
    expect(screen.getAllByText('Todavía no hay notas')).toHaveLength(2);
  });

  it('abrir carpeta: pide los nombres de Doc solo ahí, agrupa por mes y un error no rompe la lista', async () => {
    const failing = sessions.find(x => x.has_note)!;
    fetchNote.mockImplementation(async (id: number) => { if (id === failing.id) throw new Error('boom'); return { documento_drive: { nombre: `Doc ${id}`, web_view_url: `https://docs.google.com/${id}` } }; });
    renderDocs();
    fireEvent.click(screen.getByRole('button', { name: /Martina/ }));
    expect(screen.getByLabelText('Cargando notas')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByLabelText('Cargando notas')).not.toBeInTheDocument());
    expect(fetchNote).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('region', { name: 'Septiembre 2026' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Agosto 2026' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Abrir nota' })).toHaveLength(3);
    const links = screen.getAllByRole('link', { name: 'Abrir en Google Docs' });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(screen.queryByText('Explorador de Drive')).not.toBeInTheDocument();
  });

  it('escribir nota abre el editor a vista completa y al volver refresca la lista', () => {
    const onRefresh = vi.fn();
    renderDocs(sessions, onRefresh);
    fireEvent.click(screen.getAllByRole('button', { name: 'Escribir nota' })[0]);
    expect(screen.getByText(/Editor de nota/)).toBeInTheDocument();
    expect(screen.queryByText('Explorador de Drive')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '← Volver' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
