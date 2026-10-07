import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const request = vi.hoisted(() => vi.fn());
const speakText = vi.hoisted(() => vi.fn());
const logUsageEvent = vi.hoisted(() => vi.fn());
vi.mock('@/services/api/tandem-api', () => ({ tandemApi: { ayuda: { request } } }));
vi.mock('@/lib/speech', () => ({ speakText, isSpeechSupported: () => true }));
vi.mock('@/data/usageApi', () => ({ logUsageEvent, fetchAutonomyCardUsage: vi.fn(async () => []) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: '7' } }) }));

import CantSpeakMode from './CantSpeakMode';

function openMode() {
  render(<CantSpeakMode />);
  fireEvent.click(screen.getByRole('button', { name: 'Modo no puedo hablar' }));
}
const tap = (label: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));

describe('CantSpeakMode: avisar al tutor', () => {
  beforeEach(() => { request.mockReset(); speakText.mockReset(); logUsageEvent.mockReset(); });

  it('"Sí" solo habla y registra el uso, sin avisar', () => {
    openMode();
    tap('^👍 Sí');
    expect(speakText).toHaveBeenCalledWith('Sí');
    expect(logUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ tipoEvento: 'tarjeta_autonomia_usada', entidadId: 'si' }));
    expect(request).not.toHaveBeenCalled();
    expect(screen.queryByText(/Avisando|Ya le avisamos|No pudimos avisar/)).not.toBeInTheDocument();
  });

  it('las otras frases (No, No puedo hablar ahora, Estoy bien) tampoco avisan', () => {
    openMode();
    for (const label of ['^👎 No', 'No puedo hablar ahora', 'Estoy bien']) tap(label);
    expect(speakText).toHaveBeenCalledTimes(3);
    expect(request).not.toHaveBeenCalled();
  });

  it('"Necesito ayuda" habla primero, registra el uso y avisa con motivo ayuda', async () => {
    request.mockResolvedValue({ avisados: ['Laura'], repetido: false });
    openMode();
    tap('Necesito ayuda');
    expect(speakText).toHaveBeenCalledWith('Necesito ayuda');
    expect(logUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ entidadId: 'necesito-ayuda' }));
    expect(request).toHaveBeenCalledWith({ contexto: 'comunicador', motivo: 'ayuda' });
    expect(speakText.mock.invocationCallOrder[0]).toBeLessThan(request.mock.invocationCallOrder[0]);
    expect(await screen.findByText(/Ya le avisamos a Laura/)).toBeInTheDocument();
    expect(screen.getByText('✓ Avisado')).toBeInTheDocument();
  });

  it('"Necesito espacio" avisa con motivo pausa y la frase', async () => {
    request.mockResolvedValue({ avisados: ['Laura', 'Pedro'], repetido: false });
    openMode();
    tap('Necesito espacio');
    expect(request).toHaveBeenCalledWith({ contexto: 'comunicador', motivo: 'pausa', frase: 'Necesito espacio' });
    expect(await screen.findByText(/Ya le avisamos a Laura y Pedro/)).toBeInTheDocument();
  });

  it('sin avisados o con error muestra "No pudimos avisar" y tocar de nuevo reintenta', async () => {
    request.mockResolvedValueOnce({ avisados: [], repetido: false });
    request.mockRejectedValueOnce(new Error('Network error'));
    request.mockResolvedValueOnce({ avisados: ['Laura'], repetido: false });
    openMode();
    tap('Necesito ayuda');
    expect(await screen.findByText('No pudimos avisar')).toBeInTheDocument();
    expect(screen.getByText('Mostrale esta pantalla a alguien o tocá de nuevo.')).toBeInTheDocument();
    expect(screen.getByText('Tocá de nuevo')).toBeInTheDocument();
    expect(speakText).toHaveBeenCalledTimes(1); // la voz funciona igual

    tap('Necesito ayuda');
    expect(await screen.findByText('No pudimos avisar')).toBeInTheDocument(); // el error de red tampoco se muestra
    expect(screen.queryByText(/Network error/)).not.toBeInTheDocument();

    tap('Necesito ayuda');
    expect(await screen.findByText(/Ya le avisamos a Laura/)).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('con el aviso ya enviado, tocar de nuevo vuelve a hablar y a pedir el aviso (repetido sigue siendo éxito)', async () => {
    request.mockResolvedValueOnce({ avisados: ['Laura'], repetido: false });
    request.mockResolvedValueOnce({ avisados: ['Laura'], repetido: true });
    openMode();
    tap('Necesito ayuda');
    await screen.findByText(/Ya le avisamos a Laura/);
    tap('✓ Avisado|Necesito ayuda');
    expect(speakText).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/Ya le avisamos a Laura/)).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('un doble toque rápido manda un solo pedido', async () => {
    let resolve: (value: { avisados: string[]; repetido: boolean }) => void = () => {};
    request.mockReturnValue(new Promise((r) => { resolve = r; }));
    openMode();
    tap('Necesito ayuda');
    expect(screen.getByText('Avisando…')).toBeInTheDocument();
    tap('Necesito ayuda');
    expect(request).toHaveBeenCalledTimes(1);
    resolve({ avisados: ['Laura'], repetido: false });
    expect(await screen.findByText(/Ya le avisamos a Laura/)).toBeInTheDocument();
  });

  it('cerrar y abrir de nuevo deja la franja vacía y las tarjetas sin marcar', async () => {
    request.mockResolvedValue({ avisados: ['Laura'], repetido: false });
    openMode();
    tap('Necesito ayuda');
    await screen.findByText(/Ya le avisamos a Laura/);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Modo no puedo hablar' }));
    expect(screen.queryByText(/Ya le avisamos/)).not.toBeInTheDocument();
    expect(screen.queryByText('✓ Avisado')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Avisa a tu tutor/)).toHaveLength(2);
  });
});
