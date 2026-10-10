import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublicHelpCardPage from './PublicHelpCardPage';
import { ApiError } from '@/services/api/client';
import type { HelpCardPublic } from '@/services/api/tandem-api';

const api = vi.hoisted(() => ({ getPublic: vi.fn() }));
vi.mock('@/services/api/tandem-api', () => ({ tandemApi: { tarjetaAyuda: api } }));

const token = 'a'.repeat(64);
const card = (overrides: Partial<HelpCardPublic> = {}): HelpCardPublic => ({
  nombre: 'Mateo',
  apellido: 'Pérez',
  tutores: [
    { nombre: 'Laura', apellido: 'Gómez', parentesco: 'Mamá', celular: '1155551234', mail: 'laura@mail.com' },
    { nombre: 'Pedro', apellido: 'Pérez' },
  ],
  ...overrides,
});

describe('PublicHelpCardPage', () => {
  beforeEach(() => { api.getPublic.mockReset(); });

  it('muestra nombre, mensaje, tutores y pie; Llamar y WhatsApp con 549', async () => {
    api.getPublic.mockResolvedValue(card({ mensaje: 'Hablame despacio', domicilio: 'Av. Rivadavia 4000' }));
    render(<PublicHelpCardPage token={token} />);
    expect(await screen.findByRole('heading', { name: 'Mateo Pérez' })).toBeInTheDocument();
    expect(api.getPublic).toHaveBeenCalledWith(token);
    expect(screen.getByText('Esta persona puede necesitar ayuda:')).toBeInTheDocument();
    expect(screen.getByText(/Hablame despacio/)).toBeInTheDocument();
    expect(screen.getByText('Llamá a su familia')).toBeInTheDocument();
    expect(screen.getByText('Mamá · 11 5555-1234')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Llamar/ })).toHaveAttribute('href', 'tel:1155551234');
    const whatsapp = screen.getByRole('link', { name: /WhatsApp/ });
    expect(whatsapp).toHaveAttribute('href', 'https://wa.me/5491155551234');
    expect(whatsapp).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /laura@mail.com/ })).toHaveAttribute('href', 'mailto:laura@mail.com');
    expect(screen.getByText('Av. Rivadavia 4000')).toBeInTheDocument();
    expect(screen.getByText('Al abrir esta página le avisamos a su familia. Gracias por ayudar.')).toBeInTheDocument();
  });

  it('muestra solo lo que viene: sin mensaje, mail ni domicilio no hay nada de eso', async () => {
    api.getPublic.mockResolvedValue(card({ tutores: [{ nombre: 'Laura', apellido: 'Gómez', celular: '1155551234' }] }));
    render(<PublicHelpCardPage token={token} />);
    await screen.findByRole('heading', { name: 'Mateo Pérez' });
    expect(screen.queryByText('Vive en')).not.toBeInTheDocument();
    expect(screen.queryByText(/💬 /)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /@/ })).not.toBeInTheDocument();
  });

  it('un tutor sin celular no tiene botones de llamar ni WhatsApp', async () => {
    api.getPublic.mockResolvedValue(card());
    render(<PublicHelpCardPage token={token} />);
    await screen.findByRole('heading', { name: 'Mateo Pérez' });
    const pedro = screen.getByText('Pedro Pérez').closest('li') as HTMLElement;
    expect(within(pedro).queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Llamar/ })).toHaveLength(1);
  });

  it('celular que ya viene con 549: el link de WhatsApp no lo duplica', async () => {
    api.getPublic.mockResolvedValue(card({ tutores: [{ nombre: 'Laura', apellido: 'Gómez', celular: '5491155551234' }] }));
    render(<PublicHelpCardPage token={token} />);
    expect(await screen.findByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/5491155551234');
  });

  it('404 (apagada, token viejo o inexistente): "Esta tarjeta no está activa" sin datos', async () => {
    api.getPublic.mockImplementation(async () => { throw new ApiError('Tarjeta no disponible.', 404); });
    render(<PublicHelpCardPage token={token} />);
    expect(await screen.findByRole('heading', { name: 'Esta tarjeta no está activa' })).toBeInTheDocument();
    expect(screen.getByText(/pedile que te muestre otra forma de contactar a su familia/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('error de red: no dice que está inactiva y permite probar de nuevo', async () => {
    api.getPublic.mockRejectedValueOnce(new Error('network'));
    render(<PublicHelpCardPage token={token} />);
    expect(await screen.findByText('No pudimos cargar la tarjeta.')).toBeInTheDocument();
    expect(screen.queryByText('Esta tarjeta no está activa')).not.toBeInTheDocument();
    api.getPublic.mockResolvedValue(card());
    fireEvent.click(screen.getByRole('button', { name: 'Probar de nuevo' }));
    expect(await screen.findByRole('heading', { name: 'Mateo Pérez' })).toBeInTheDocument();
  });

  it('pide a los buscadores que no la indexen mientras está abierta', async () => {
    api.getPublic.mockResolvedValue(card());
    const { unmount } = render(<PublicHelpCardPage token={token} />);
    await screen.findByRole('heading', { name: 'Mateo Pérez' });
    expect(document.head.querySelector('meta[name="robots"][content="noindex"]')).not.toBeNull();
    unmount();
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});
