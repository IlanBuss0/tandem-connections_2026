import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HelpSpotsCard from './HelpSpotsCard';
import type { HelpSpotsState } from './useHelpSpots';
import type { HelpSpot } from '@/data/usageApi';

const spot = (over: Partial<HelpSpot>): HelpSpot => ({ contexto: 'actividad', titulo: 'Preparar la mochila', paso: 3, pasoTexto: 'Agregar cuadernos y útiles', cantidad: 4, ultimaVez: '2026-10-06T10:00:00Z', ...over });
const ready = (lugares: HelpSpot[], porMotivo = { ayuda: 5, no_entiende: 2, pausa: 0 }, total = 7): HelpSpotsState => ({ loading: false, failed: false, report: { dias: 30, total, porMotivo, lugares } });

describe('HelpSpotsCard', () => {
  it('muestra título, subtítulo, filas con paso y cantidad, chips y pie', () => {
    render(<HelpSpotsCard state={ready([spot({}), spot({ titulo: 'Ordenar el escritorio', paso: 2, pasoTexto: 'Limpiar la superficie', cantidad: 2 })])} />);
    expect(screen.getByText('Dónde se traba')).toBeInTheDocument();
    expect(screen.getByText('Últimos 30 días · 7 pedidos de ayuda')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Preparar la mochila · paso 3: 4 pedidos' })).toBeInTheDocument();
    expect(screen.getByText('Preparar la mochila')).toBeInTheDocument();
    expect(screen.getAllByText('· paso 3', { exact: false })[0]).toBeInTheDocument();
    expect(screen.getByText('×4')).toBeInTheDocument();
    expect(screen.getByText('Agregar cuadernos y útiles')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ordenar el escritorio · paso 2: 2 pedidos' })).toBeInTheDocument();
    expect(screen.getByText(/Ayuda 5/)).toBeInTheDocument();
    expect(screen.getByText(/No entiende 2/)).toBeInTheDocument();
    expect(screen.queryByText(/Pausa/)).not.toBeInTheDocument();
    expect(screen.getByText(/Sirve para ajustar la actividad o dejarle un Plan B/)).toBeInTheDocument();
  });

  it('muestra como máximo 4 filas', () => {
    const many = Array.from({ length: 6 }, (_, index) => spot({ titulo: `Actividad ${index + 1}`, cantidad: 6 - index }));
    render(<HelpSpotsCard state={ready(many)} />);
    expect(screen.getByText('Actividad 4')).toBeInTheDocument();
    expect(screen.queryByText('Actividad 5')).not.toBeInTheDocument();
  });

  it('"No puedo hablar" va sin paso y con la nota del botón de comunicación', () => {
    render(<HelpSpotsCard state={ready([spot({ contexto: 'comunicacion', titulo: 'No puedo hablar', paso: null, pasoTexto: null, cantidad: 3 })])} />);
    expect(screen.getByText('No puedo hablar')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'No puedo hablar: 3 pedidos' })).toBeInTheDocument();
    expect(screen.getByText('Desde el botón de comunicación')).toBeInTheDocument();
  });

  it('estados: cargando, sin datos y error', () => {
    const { rerender } = render(<HelpSpotsCard state={{ loading: true, failed: false, report: null }} />);
    expect(screen.getByText('Calculando…')).toBeInTheDocument();
    rerender(<HelpSpotsCard state={ready([], { ayuda: 0, no_entiende: 0, pausa: 0 }, 0)} />);
    expect(screen.getByText('Todavía no pidió ayuda en este período.')).toBeInTheDocument();
    rerender(<HelpSpotsCard state={{ loading: false, failed: true, report: null }} />);
    expect(screen.getByText('No se pudo cargar.')).toBeInTheDocument();
    expect(screen.queryByText('Todavía no pidió ayuda en este período.')).not.toBeInTheDocument();
  });
});
