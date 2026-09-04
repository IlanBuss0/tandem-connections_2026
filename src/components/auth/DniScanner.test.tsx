import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DniScanner } from './DniScanner';

describe('DniScanner', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('solicita la cámara trasera y muestra el video', async () => {
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] });
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<DniScanner onCapture={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /escanear dni/i }));
    await waitFor(() => expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ video: expect.objectContaining({ facingMode: { ideal: 'environment' } }) })));
    expect(screen.getByTestId('dni-guide-frame')).toHaveClass('aspect-[1.586/1]', 'border-2', 'border-white');
  });

  it('explica cómo reintentar cuando se rechaza el permiso', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')) } });
    render(<DniScanner onCapture={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /escanear dni/i }));
    expect(await screen.findByText(/no pudimos acceder a tu cámara/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('inicia la cuenta regresiva y captura automáticamente tras 3 segundos estables', async () => {
    vi.useFakeTimers();
    const stop = vi.fn(); const onCapture = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) } });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: Uint8ClampedArray.from({ length: 160 * 100 * 4 }, (_, index) => { const pixel = Math.floor(index / 4); const x = pixel % 160; const y = Math.floor(pixel / 160); const value = x < 5 || x > 154 || y < 5 || y > 94 ? 125 : (x + y) % 2 ? 50 : 200; return value; }) })) } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['dni'], { type: 'image/jpeg' })));
    render(<DniScanner onCapture={onCapture} />);
    fireEvent.click(screen.getByRole('button', { name: /escanear dni/i }));
    await act(async () => { await Promise.resolve(); });
    const video = screen.getByLabelText(/cámara para escanear/i);
    Object.defineProperties(video, { readyState: { value: 4 }, videoWidth: { value: 1280 }, videoHeight: { value: 720 } });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); expect(screen.getByRole('status')).toHaveTextContent('3s');
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); expect(screen.getByRole('status')).toHaveTextContent('2s');
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); expect(screen.getByRole('status')).toHaveTextContent('1s');
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(onCapture).toHaveBeenCalledTimes(1); expect(stop).toHaveBeenCalled();
  });
});
