import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BelongingQuickActionsMenu from './BelongingQuickActionsMenu';

const renderMenu = () => {
  const handlers = { onNavigate: vi.fn(), onOpenCantSpeak: vi.fn(), onOpenHelpCard: vi.fn() };
  render(<BelongingQuickActionsMenu activeTab="home" {...handlers} />);
  fireEvent.click(screen.getByRole('button', { name: 'Abrir accesos rápidos' }));
  fireEvent.click(screen.getByRole('button', { name: 'Comunicarme' }));
  return handlers;
};

describe('BelongingQuickActionsMenu · Comunicarme', () => {
  it('"Mi tarjeta" abre la tarjeta de ayuda y cierra el menú', async () => {
    const handlers = renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /Mi tarjeta/ }));
    expect(handlers.onOpenHelpCard).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenCantSpeak).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Accesos rápidos' })).not.toBeInTheDocument());
  });

  it('"No puedo hablar" y "Armar una frase" siguen igual', () => {
    const handlers = renderMenu();
    expect(screen.getByRole('button', { name: 'Armar una frase' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'No puedo hablar' }));
    expect(handlers.onOpenCantSpeak).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenHelpCard).not.toHaveBeenCalled();
  });

  it('Escape cierra el menú', async () => {
    renderMenu();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Accesos rápidos' })).not.toBeInTheDocument());
  });
});
