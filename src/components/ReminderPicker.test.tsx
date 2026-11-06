import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReminderPicker from './ReminderPicker';

describe('Avisos personalizados del calendario', () => {
  for (const [quantity, unit, expected] of [['17', '1', -17], ['2', '60', -120], ['3', '1440', -4320], ['1', '10080', -10080]] as const) {
    it(`convierte ${quantity} por ${unit} minutos antes al formato existente`, () => {
      const change = vi.fn();
      render(<ReminderPicker allowCustom value={[-5]} onChange={change} />);
      fireEvent.click(screen.getByRole('button', { name: 'Personalizar aviso' }));
      fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: quantity } });
      fireEvent.change(screen.getByLabelText('Unidad'), { target: { value: unit } });
      fireEvent.click(screen.getByRole('button', { name: 'Agregar aviso' }));
      expect(change).toHaveBeenCalledWith([expected, -5]);
    });
  }

  for (const quantity of ['0', '-1', '1.5', '40321']) {
    it(`rechaza cantidad inválida ${quantity}`, () => {
      const change = vi.fn();
      render(<ReminderPicker allowCustom onChange={change} />);
      fireEvent.click(screen.getByRole('button', { name: 'Personalizar aviso' }));
      fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: quantity } });
      fireEvent.click(screen.getByRole('button', { name: 'Agregar aviso' }));
      expect(change).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  }

  it('recupera valores al editar y permite quitar un aviso sin cambiar los demás', () => {
    function Editing() {
      const [value, setValue] = useState([-10080, -120, -5]);
      return <ReminderPicker allowCustom value={value} onChange={setValue} />;
    }
    render(<Editing />);
    expect(screen.getByRole('button', { name: 'Quitar aviso 1 semana antes' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar aviso 2 horas antes' }));
    expect(screen.queryByText('2 horas antes · Quitar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar aviso 1 semana antes' })).toBeInTheDocument();
  });

  it('conserva las opciones predefinidas y no activa cambios en otras pantallas', () => {
    const change = vi.fn();
    render(<ReminderPicker onChange={change} />);
    expect(screen.queryByRole('button', { name: 'Personalizar aviso' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '15 min antes' }));
    expect(change).toHaveBeenCalledWith([-15]);
  });
});
