import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Pdf417TestPage from './Pdf417TestPage';

const mocks = vi.hoisted(() => ({ callback: null as ((result: { getText: () => string } | null, error?: Error) => void) | null, stop: vi.fn(), reset: vi.fn() }));
vi.mock('@zxing/browser', () => ({ BrowserPDF417Reader: class { reset = mocks.reset; decodeFromConstraints = vi.fn(async (_constraints, _video, callback) => { mocks.callback = callback; return { stop: mocks.stop }; }); } }));

describe('Pdf417TestPage', () => {
  afterEach(() => { vi.clearAllMocks(); mocks.callback = null; });

  it('monta y abre la cámara con el lector PDF417', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } });
    render(<Pdf417TestPage />);
    fireEvent.click(screen.getByRole('button', { name: /abrir cámara/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/buscando código pdf417/i));
  });

  it('muestra el contenido decodificado y detiene el lector', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } });
    render(<Pdf417TestPage />);
    fireEvent.click(screen.getByRole('button', { name: /abrir cámara/i }));
    await waitFor(() => expect(mocks.callback).not.toBeNull());
    mocks.callback?.({ getText: () => 'DNI|JUAN|PEREZ|30123456' });
    expect(await screen.findByText('DNI|JUAN|PEREZ|30123456')).toBeInTheDocument();
    expect(mocks.stop).toHaveBeenCalled();
  });

  it('muestra error controlado si no hay cámara', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
    render(<Pdf417TestPage />);
    fireEvent.click(screen.getByRole('button', { name: /abrir cámara/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/no encontramos una cámara/i);
  });

  it('detiene recursos al desmontar', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } });
    const { unmount } = render(<Pdf417TestPage />);
    fireEvent.click(screen.getByRole('button', { name: /abrir cámara/i }));
    await waitFor(() => expect(mocks.callback).not.toBeNull());
    unmount();
    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.reset).toHaveBeenCalled();
  });
});
