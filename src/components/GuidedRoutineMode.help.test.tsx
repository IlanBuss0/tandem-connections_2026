import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { RoutineItem } from '@/data/api';

const request = vi.hoisted(() => vi.fn());
const toggleItem = vi.hoisted(() => vi.fn());
vi.mock('@/services/api/tandem-api', () => ({ tandemApi: { ayuda: { request } } }));
vi.mock('@/contexts/AccessibilityContext', () => ({ useAccessibility: () => ({ settings: { pauseAnimations: false, reduceMotion: false } }) }));

const item = (id: string, title: string, completed = false): RoutineItem => ({ id, time: '08:00', title, icon: '', completed, category: 'general' });
// Paso actual: "Lavarse la cara" (2 de 3 entre todos los items; el primero ya está hecho).
const items = [item('i1', 'Despertarse', true), item('i2', 'Lavarse la cara'), item('i3', 'Desayunar')];
vi.mock('@/contexts/RoutinesContext', () => ({
  useRoutines: () => ({ toggleItem, routines: [{ id: 'r1', name: 'Mi mañana', dayOfWeek: 1, items }] }),
}));

import GuidedRoutineMode from './GuidedRoutineMode';

function openHelpSheet() {
  render(<GuidedRoutineMode routineId="r1" items={items} />);
  fireEvent.click(screen.getByRole('button', { name: /Modo guiado/ }));
  fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
}

describe('GuidedRoutineMode: No puedo seguir', () => {
  beforeEach(() => { request.mockReset(); toggleItem.mockReset(); });

  it('muestra "No puedo seguir" y abre la hoja con las opciones (sin Plan B)', () => {
    openHelpSheet();
    expect(screen.getByText('¿Qué necesitás?')).toBeInTheDocument();
    expect(screen.getByText('Le aviso a quien te acompaña')).toBeInTheDocument();
    expect(screen.getByText('Necesito una pausa')).toBeInTheDocument();
    expect(screen.queryByText(/Otra forma de hacerlo/i)).not.toBeInTheDocument();
  });

  it('"Necesito ayuda" avisa con el nombre de la rutina y el paso entre todos los ítems', async () => {
    request.mockResolvedValue({ avisados: ['Laura'], repetido: false });
    openHelpSheet();
    fireEvent.click(screen.getByText('Necesito ayuda'));
    expect(await screen.findByText('Ya le avisamos a Laura')).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({ contexto: 'rutina', motivo: 'ayuda', titulo: 'Mi mañana', paso: 2, totalPasos: 3, pasoTexto: 'Lavarse la cara' });
  });

  it('sin avisados muestra "No pudimos avisar" y "Probar de nuevo" reintenta el mismo motivo', async () => {
    request.mockResolvedValueOnce({ avisados: [], repetido: false });
    request.mockResolvedValueOnce({ avisados: ['Laura'], repetido: false });
    openHelpSheet();
    fireEvent.click(screen.getByText('Necesito ayuda'));
    expect(await screen.findByText('No pudimos avisar')).toBeInTheDocument();
    expect(screen.getByText('Paso 2: Lavarse la cara')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Probar de nuevo/ }));
    expect(await screen.findByText('Ya le avisamos a Laura')).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][0].motivo).toBe('ayuda');
  });

  it('"No entiendo este paso" muestra el paso y manda no_entiende', async () => {
    request.mockResolvedValue({ avisados: ['Laura'], repetido: false });
    openHelpSheet();
    fireEvent.click(screen.getByText('No entiendo este paso'));
    expect(screen.getByText('Este paso, más despacio')).toBeInTheDocument();
    expect(screen.getByText('Paso 2 de 3 · Ahora')).toBeInTheDocument();
    expect(screen.getByText('Lavarse la cara', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Despertarse')).toBeInTheDocument();
    expect(screen.getByText('Desayunar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'No, avisale a quien te acompaña' }));
    await screen.findByText('Ya le avisamos a Laura');
    expect(request.mock.calls[0][0].motivo).toBe('no_entiende');
  });

  it('"Necesito una pausa" abre el Modo calma y avisar desde ahí manda pausa sin cerrarlo', async () => {
    request.mockResolvedValue({ avisados: ['Laura'], repetido: false });
    openHelpSheet();
    fireEvent.click(screen.getByText('Necesito una pausa'));
    expect(screen.getByRole('dialog', { name: 'Vamos despacio' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Avisarle a quien te acompaña' }));
    expect(await screen.findByRole('button', { name: /Ya le avisamos ✓/ })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Vamos despacio' })).toBeInTheDocument();
    expect(request.mock.calls[0][0].motivo).toBe('pausa');
  });

  it('cerrar cada vista vuelve al mismo paso sin marcarlo ni cerrar el modo guiado', async () => {
    request.mockResolvedValue({ avisados: ['Laura'], repetido: false });
    openHelpSheet();
    // hoja → volver
    fireEvent.click(screen.getByRole('button', { name: 'Volver a la actividad' }));
    expect(screen.queryByText('¿Qué necesitás?')).not.toBeInTheDocument();
    // "No entiendo" → Sí, sigo
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('No entiendo este paso'));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, sigo' }));
    // aviso enviado → volver
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('Necesito ayuda'));
    await screen.findByText('Ya le avisamos a Laura');
    fireEvent.click(screen.getByRole('button', { name: 'Volver a la actividad' }));
    // Modo calma → Ya estoy mejor
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('Necesito una pausa'));
    fireEvent.click(screen.getByRole('button', { name: 'Ya estoy mejor' }));

    expect(screen.getByRole('heading', { name: 'Lavarse la cara' })).toBeInTheDocument();
    expect(screen.getByText('Paso 2 de 3')).toBeInTheDocument();
    expect(toggleItem).not.toHaveBeenCalled();
  });
});

describe('GuidedRoutineMode: un solo número de paso', () => {
  beforeEach(() => { request.mockReset(); toggleItem.mockReset(); });

  // 6 pasos; los 3 primeros ya están hechos, así que el actual es el 4.
  const six = (done: number) => ['Despertarse', 'Lavarse la cara', 'Vestirse', 'Desayunar', 'Cepillarse', 'Salir']
    .map((title, index) => item(`s${index + 1}`, title, index < done));

  it('el encabezado y "No entiendo este paso" muestran el mismo número y el mismo total', () => {
    render(<GuidedRoutineMode routineId="r1" items={six(3)} />);
    fireEvent.click(screen.getByRole('button', { name: /Modo guiado/ }));
    expect(screen.getByText('Paso 4 de 6')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('No entiendo este paso'));
    expect(screen.getByText('Paso 4 de 6 · Ahora')).toBeInTheDocument();
    expect(screen.getByText('Paso 4 de 6')).toBeInTheDocument();
  });

  it('el número avanza al tocar "Listo, siguiente": 4 de 6 y después 5 de 6', () => {
    const { rerender } = render(<GuidedRoutineMode routineId="r1" items={six(3)} />);
    fireEvent.click(screen.getByRole('button', { name: /Modo guiado/ }));
    expect(screen.getByText('Paso 4 de 6')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Listo, siguiente/ }));
    expect(toggleItem).toHaveBeenCalledWith('r1', 's4');
    rerender(<GuidedRoutineMode routineId="r1" items={six(4)} />);
    expect(screen.getByText('Paso 5 de 6')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cepillarse' })).toBeInTheDocument();
  });
});
