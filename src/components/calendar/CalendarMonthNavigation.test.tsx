import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CalendarMonthNavigation from './CalendarMonthNavigation';

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
describe('Selectores de calendario', () => {
  it('muestra 12 meses y permite cerrar sin cambiar la fecha', () => {
    const change = vi.fn();
    render(<CalendarMonthNavigation year={2026} month={10} months={months} onChange={change} />);
    fireEvent.click(screen.getByRole('button', { name: 'Elegir mes: Noviembre' }));
    for (const month of months) expect(screen.getByRole('button', { name: month })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Noviembre' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar selector de mes' }));
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Elegir mes: Noviembre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Febrero' }));
    expect(change).toHaveBeenCalledWith(2026, 1);
  });

  it('avanza años sin aplicarlos hasta confirmar y permite cancelar', () => {
    const change = vi.fn();
    render(<CalendarMonthNavigation year={2026} month={10} months={months} onChange={change} />);
    fireEvent.click(screen.getByRole('button', { name: 'Elegir año: 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Año siguiente' }));
    expect(screen.getByRole('button', { name: 'Elegir 2027' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Elegir año: 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Año anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elegir 2025' }));
    expect(change).toHaveBeenCalledWith(2025, 10);
  });
});
