import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HelpCardMode, { type HelpCardModeHandle } from './HelpCardMode';

const api = vi.hoisted(() => ({ getMine: vi.fn() }));
vi.mock('@/services/api/tandem-api', () => ({ tandemApi: { tarjetaAyuda: api } }));
const qr = vi.hoisted(() => ({ toDataURL: vi.fn() }));
vi.mock('qrcode', () => ({ default: qr }));

const token = 'a'.repeat(64);
const mine = (activa: boolean) => ({ activa, url: `/tarjeta/${token}`, nombre: 'Mateo', apellido: 'Pérez' });

const renderMode = () => {
  const ref = createRef<HelpCardModeHandle>();
  render(<HelpCardMode ref={ref} />);
  return ref;
};
const open = (ref: ReturnType<typeof renderMode>) => act(() => { ref.current?.open(); });

describe('HelpCardMode', () => {
  beforeEach(() => {
    api.getMine.mockReset();
    qr.toDataURL.mockReset();
    qr.toDataURL.mockResolvedValue('data:image/png;base64,QR');
  });

  it('no muestra nada ni pide datos hasta que se abre', () => {
    renderMode();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.getMine).not.toHaveBeenCalled();
  });

  it('activa: nombre, texto y QR del origen actual + url (grande, sin localhost fijo)', async () => {
    api.getMine.mockResolvedValue(mine(true));
    open(renderMode());
    expect(await screen.findByText('Mateo Pérez')).toBeInTheDocument();
    expect(screen.getByText(/mostrale este código a alguien/)).toBeInTheDocument();
    expect(screen.getByText('Lo pueden escanear con la cámara del celular. Van a ver cómo llamar a tu familia.')).toBeInTheDocument();
    expect(qr.toDataURL).toHaveBeenCalledWith(`${window.location.origin}/tarjeta/${token}`, expect.objectContaining({ width: expect.any(Number) }));
    expect(qr.toDataURL.mock.calls[0][1].width).toBeGreaterThanOrEqual(260);
    const img = screen.getByRole('img', { name: /Código QR/ });
    expect(img).toHaveAttribute('src', 'data:image/png;base64,QR');
    expect(img).toHaveAttribute('width', '280');
  });

  it('no activa: avisa que le pida a quien lo acompaña y no genera QR', async () => {
    api.getMine.mockResolvedValue(mine(false));
    open(renderMode());
    expect(await screen.findByText('Todavía no está activa')).toBeInTheDocument();
    expect(screen.getByText('Pedile a quien te acompaña que la active.')).toBeInTheDocument();
    expect(qr.toDataURL).not.toHaveBeenCalled();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('error de red: mensaje corto y "Probar de nuevo" vuelve a pedir la tarjeta', async () => {
    api.getMine.mockRejectedValueOnce(new Error('network'));
    open(renderMode());
    expect(await screen.findByText('No pudimos cargar tu tarjeta.')).toBeInTheDocument();
    api.getMine.mockResolvedValue(mine(true));
    fireEvent.click(screen.getByRole('button', { name: 'Probar de nuevo' }));
    expect(await screen.findByText('Mateo Pérez')).toBeInTheDocument();
  });

  it('se cierra con la X y con Escape, y al reabrir vuelve a pedir la tarjeta', async () => {
    api.getMine.mockResolvedValue(mine(false));
    const ref = renderMode();
    open(ref);
    await screen.findByText('Todavía no está activa');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    open(ref);
    await screen.findByText('Todavía no está activa');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.getMine).toHaveBeenCalledTimes(2);
  });
});
