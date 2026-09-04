import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DniScanner } from './DniScanner';

describe('DniScanner', () => {
  afterEach(() => vi.restoreAllMocks());

  it('solicita la cámara trasera y muestra el video', async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] });
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<DniScanner onCapture={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /escanear dni/i }));
    await waitFor(() => expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ video: expect.objectContaining({ facingMode: { ideal: 'environment' } }) })));
    expect(screen.getByTestId('dni-guide-frame')).toHaveClass('aspect-[1.586/1]', 'border-2', 'border-white');
    expect(await screen.findByLabelText(/cámara para escanear/i)).toBeInTheDocument();
  });

  it('explica cómo reintentar cuando se rechaza el permiso', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')) } });
    render(<DniScanner onCapture={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /escanear dni/i }));
    expect(await screen.findByText(/no pudimos acceder a tu cámara/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
