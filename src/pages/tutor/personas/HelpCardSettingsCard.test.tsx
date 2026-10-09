import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HelpCardSettingsCard from './HelpCardSettingsCard';
import type { HelpCardConfig } from '@/services/api/tandem-api';

const api = vi.hoisted(() => ({ getForPerteneciente: vi.fn(), update: vi.fn(), regenerate: vi.fn() }));
vi.mock('@/services/api/tandem-api', () => ({ tandemApi: { tarjetaAyuda: api } }));
const toastMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/ui/use-toast', () => ({ toast: toastMock }));

const config = (overrides: Partial<HelpCardConfig> = {}): HelpCardConfig => ({
  activa: true,
  mostrarCelular: true,
  mostrarMail: false,
  mostrarDomicilio: false,
  domicilio: null,
  mensaje: null,
  url: `/tarjeta/${'a'.repeat(64)}`,
  fechaModificacion: '2026-01-01T00:00:00Z',
  tutores: [
    { nombre: 'Laura', apellido: 'Gomez', parentesco: 'Madre', esTutorPrincipal: true, tieneCelular: true, tieneMail: true },
    { nombre: 'Pedro', apellido: 'Gomez', parentesco: null, esTutorPrincipal: false, tieneCelular: false, tieneMail: true },
  ],
  ...overrides,
});

const renderCard = async (initial: HelpCardConfig = config()) => {
  api.getForPerteneciente.mockResolvedValue(initial);
  render(<HelpCardSettingsCard idPerteneciente={7} name="Mateo" />);
  await screen.findByText(/Tarjeta de ayuda de Mateo/);
};

const toggle = (name: string) => screen.getByRole('switch', { name });

describe('HelpCardSettingsCard', () => {
  beforeEach(() => {
    Object.values(api).forEach(fn => fn.mockReset());
    toastMock.mockReset();
  });

  it('carga la tarjeta de la persona y muestra su estado', async () => {
    await renderCard(config({ mostrarMail: true, mensaje: 'Hablame despacio' }));
    expect(api.getForPerteneciente).toHaveBeenCalledWith(7);
    expect(screen.getByText('Mateo la muestra desde su celular. Quien escanea el QR ve solo lo que actives acá.')).toBeInTheDocument();
    expect(toggle('Tarjeta de ayuda activa')).toBeChecked();
    expect(toggle('Celular de los tutores')).toBeChecked();
    expect(toggle('Mail de los tutores')).toBeChecked();
    expect(toggle('Domicilio')).not.toBeChecked();
    expect(screen.getByDisplayValue('Hablame despacio')).toBeInTheDocument();
    expect(screen.getByText('16/200')).toBeInTheDocument();
    expect(screen.getByText('Siempre')).toBeInTheDocument();
  });

  it('muestra un error con "Reintentar" si no carga', async () => {
    api.getForPerteneciente.mockRejectedValueOnce(new Error('boom'));
    render(<HelpCardSettingsCard idPerteneciente={7} name="Mateo" />);
    await screen.findByText('No pudimos cargar la tarjeta. Intentá nuevamente.');
    api.getForPerteneciente.mockResolvedValue(config());
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    await screen.findByText(/Tarjeta de ayuda de Mateo/);
  });

  it('apagar y prender guardan al tocar el switch con el body completo', async () => {
    await renderCard();
    api.update.mockResolvedValueOnce(config({ activa: false }));
    fireEvent.click(toggle('Tarjeta de ayuda activa'));
    await waitFor(() => expect(toggle('Tarjeta de ayuda activa')).not.toBeChecked());
    expect(api.update).toHaveBeenCalledWith(7, { activa: false, mostrarCelular: true, mostrarMail: false, mostrarDomicilio: false, domicilio: null, mensaje: null });

    api.update.mockResolvedValueOnce(config({ activa: false, mostrarMail: true }));
    fireEvent.click(toggle('Mail de los tutores'));
    await waitFor(() => expect(toggle('Mail de los tutores')).toBeChecked());
    expect(api.update).toHaveBeenLastCalledWith(7, expect.objectContaining({ activa: false, mostrarMail: true }));
  });

  it('avisa por cada tutor sin celular mientras el celular está prendido', async () => {
    await renderCard();
    expect(screen.getByText('Pedro no cargó su celular. Va a aparecer sin botón de llamar.')).toBeInTheDocument();
    expect(screen.queryByText(/Laura no cargó/)).not.toBeInTheDocument();

    api.update.mockResolvedValueOnce(config({ mostrarCelular: false }));
    fireEvent.click(toggle('Celular de los tutores'));
    await waitFor(() => expect(screen.queryByText(/no cargó su celular/)).not.toBeInTheDocument());
  });

  it('el domicilio aparece al prenderlo (máx 160) y se guarda al salir del campo', async () => {
    await renderCard();
    expect(screen.queryByRole('textbox', { name: 'Domicilio' })).not.toBeInTheDocument();

    api.update.mockResolvedValueOnce(config({ mostrarDomicilio: true }));
    fireEvent.click(toggle('Domicilio'));
    const input = await screen.findByRole('textbox', { name: 'Domicilio' });
    expect(input).toHaveAttribute('maxlength', '160');

    api.update.mockResolvedValueOnce(config({ mostrarDomicilio: true, domicilio: 'Calle 123' }));
    fireEvent.change(input, { target: { value: 'Calle 123' } });
    expect(api.update).toHaveBeenCalledTimes(1);
    fireEvent.blur(input);
    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(2));
    expect(api.update).toHaveBeenLastCalledWith(7, expect.objectContaining({ mostrarDomicilio: true, domicilio: 'Calle 123' }));
  });

  it('el mensaje cuenta caracteres (máx 200) y no guarda en cada tecla: solo al salir y si cambió', async () => {
    await renderCard();
    const textarea = screen.getByRole('textbox', { name: 'Mensaje (opcional)' });
    expect(textarea).toHaveAttribute('maxlength', '200');

    fireEvent.blur(textarea);
    expect(api.update).not.toHaveBeenCalled();

    api.update.mockResolvedValueOnce(config({ mensaje: 'Hola' }));
    for (const value of ['H', 'Ho', 'Hol', 'Hola']) fireEvent.change(textarea, { target: { value } });
    expect(screen.getByText('4/200')).toBeInTheDocument();
    expect(api.update).not.toHaveBeenCalled();
    fireEvent.blur(textarea);
    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(1));
    expect(api.update).toHaveBeenCalledWith(7, expect.objectContaining({ mensaje: 'Hola' }));
  });

  it('si falla el guardado muestra el error y vuelve al valor anterior', async () => {
    await renderCard();
    api.update.mockRejectedValueOnce(new Error('No autorizado'));
    fireEvent.click(toggle('Mail de los tutores'));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'No se pudo guardar', variant: 'destructive' })));
    expect(toggle('Mail de los tutores')).not.toBeChecked();
  });

  it('si falla guardar el mensaje, el texto vuelve al anterior', async () => {
    await renderCard(config({ mensaje: 'Original' }));
    const textarea = screen.getByRole('textbox', { name: 'Mensaje (opcional)' });
    api.update.mockRejectedValueOnce(new Error('boom'));
    fireEvent.change(textarea, { target: { value: 'Nuevo' } });
    fireEvent.blur(textarea);
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    await waitFor(() => expect(textarea).toHaveValue('Original'));
  });

  it('apagada: las filas se ven atenuadas y "Ver cómo se ve" queda deshabilitado', async () => {
    await renderCard(config({ activa: false }));
    expect(screen.getByText('Nombre y apellido').closest('.transition-opacity')).toHaveClass('opacity-60');
    expect(screen.getByRole('button', { name: /Ver cómo se ve/ })).toBeDisabled();
  });

  it('"Ver cómo se ve" abre la página pública en una pestaña nueva', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await renderCard();
    fireEvent.click(screen.getByRole('button', { name: /Ver cómo se ve/ }));
    expect(open).toHaveBeenCalledWith(`${window.location.origin}/tarjeta/${'a'.repeat(64)}`, '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('"Cambiar QR" pide confirmación con un diálogo propio y recién ahí regenera', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    await renderCard();
    fireEvent.click(screen.getByRole('button', { name: /Cambiar QR/ }));
    expect(await screen.findByText('El código anterior va a dejar de funcionar. Mateo tendrá que mostrar el nuevo.')).toBeInTheDocument();
    expect(api.regenerate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(api.regenerate).not.toHaveBeenCalled();

    api.regenerate.mockResolvedValueOnce(config({ url: `/tarjeta/${'b'.repeat(64)}` }));
    fireEvent.click(screen.getByRole('button', { name: /Cambiar QR/ }));
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(Array.from(dialog.querySelectorAll('button')).find(b => b.textContent === 'Cambiar QR')!);
    await waitFor(() => expect(api.regenerate).toHaveBeenCalledWith(7));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'QR cambiado' })));

    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(screen.getByRole('button', { name: /Ver cómo se ve/ }));
    expect(open).toHaveBeenCalledWith(`${window.location.origin}/tarjeta/${'b'.repeat(64)}`, '_blank', 'noopener,noreferrer');
    expect(confirmSpy).not.toHaveBeenCalled();
    open.mockRestore();
    confirmSpy.mockRestore();
  });

  it('si falla cambiar el QR avisa y no cambia la URL', async () => {
    await renderCard();
    api.regenerate.mockRejectedValueOnce(new Error('No autorizado'));
    fireEvent.click(screen.getByRole('button', { name: /Cambiar QR/ }));
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(Array.from(dialog.querySelectorAll('button')).find(b => b.textContent === 'Cambiar QR')!);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'No se pudo cambiar el QR', variant: 'destructive' })));
  });
});
