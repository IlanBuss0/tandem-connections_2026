import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ShoppingBudgetGame from './ShoppingBudgetGame';

const data = {
  kind: 'shopping-budget' as const,
  schemaVersion: 1 as const,
  prompt: 'Hacé la compra',
  currencySymbol: '$',
  budget: 6,
  products: [
    { id: 'bread', name: 'Pan', image: '🍞', price: 3, required: true },
    { id: 'milk', name: 'Leche', image: '🥛', price: 3, required: true },
    { id: 'cookies', name: 'Galletitas', image: '🍪', price: 2, required: false },
  ],
};

describe('ShoppingBudgetGame', () => {
  it('allows corrections and discounts failed reviews from the final score', () => {
    const onFinish = vi.fn();
    render(<ShoppingBudgetGame data={data} onFinish={onFinish} />);

    fireEvent.click(screen.getByRole('button', { name: /Pan/ }));
    fireEvent.click(screen.getByRole('button', { name: /Galletitas/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Revisar compra' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Todavía falta: Leche');
    expect(screen.getByRole('alert')).toHaveTextContent('no están en la lista: Galletitas');

    fireEvent.click(screen.getByRole('button', { name: /Galletitas/ }));
    fireEvent.click(screen.getByRole('button', { name: /Leche/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Revisar compra' }));
    expect(screen.getByText('Resultado: 90/100')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar actividad' }));
    expect(onFinish).toHaveBeenCalledWith(90);
  });
});
