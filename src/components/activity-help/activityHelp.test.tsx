import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ActivityExecution from '@/pages/user/ActivityExecution';
import type { Activity } from '@/data/api';
import { helpRecipientLabel } from './helpRecipientLabel';

const requestHelp = vi.hoisted(() => vi.fn());
vi.mock('@/services/api/tandem-api', () => ({ tandemApi: { actividadesAsignadas: { requestHelp } } }));

vi.mock('@/contexts/WalletContext', () => ({ useWallet: () => ({ earn: vi.fn() }) }));
vi.mock('@/data/usageApi', () => ({ logUsageEvent: vi.fn() }));
vi.mock('@/components/MiniGame', () => ({ default: () => null }));
vi.mock('@/contexts/AccessibilityContext', () => ({ useAccessibility: () => ({ settings: { pauseAnimations: false, reduceMotion: false } }) }));

const baseActivity = {
  id: '1',
  title: 'Preparar la mochila',
  category: 'organización',
  objective: 'Organizarse',
  description: '',
  difficulty: 'fácil',
  duration: '10 min',
  steps: ['Mirar el horario', 'Sacar lo que no necesitás', 'Agregar cuadernos y útiles'],
  stepIcons: ['📅', '🗑️', '📚'],
  status: 'pendiente',
  recommendedBy: 'tutor',
  progress: 0,
  points: 30,
  type: 'guiada',
  assignedByName: 'Laura Gómez',
  assignedByRole: 'tutor',
  assignedActivityId: 42,
} as Activity;

function renderActivity(overrides: Partial<Activity> = {}) {
  return render(<ActivityExecution activity={{ ...baseActivity, ...overrides }} onBack={vi.fn()} onComplete={vi.fn()} />);
}

describe('helpRecipientLabel', () => {
  it('usa el primer nombre del tutor que asignó', () => {
    expect(helpRecipientLabel('Laura Gómez', 'tutor')).toBe('Laura');
  });
  it('cae en "quien te acompaña" si no hay tutor o nombre', () => {
    expect(helpRecipientLabel('Lic. Martina Pérez', 'profesional')).toBe('quien te acompaña');
    expect(helpRecipientLabel(undefined, undefined)).toBe('quien te acompaña');
    expect(helpRecipientLabel('  ', 'tutor')).toBe('quien te acompaña');
  });
});

describe('No puedo seguir', () => {
  beforeEach(() => { requestHelp.mockReset(); });

  it('abre la hoja con las opciones, incluida la pausa', () => {
    renderActivity({ planB: 'Poné una carpeta con hojas.' });
    expect(screen.queryByText('¿Necesitás ayuda?')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    expect(screen.getByText('¿Qué necesitás?')).toBeInTheDocument();
    expect(screen.getByText('Le aviso a Laura')).toBeInTheDocument();
    expect(screen.getByText('Te lo dejó Laura Gómez')).toBeInTheDocument();
    expect(screen.getByText('Necesito una pausa')).toBeInTheDocument();
  });

  it('sin Plan B no muestra la tarjeta verde', () => {
    renderActivity({ assignedByRole: 'profesional' });
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    expect(screen.queryByText(/Otra forma de hacerlo/i)).not.toBeInTheDocument();
    expect(screen.getByText('Le aviso a quien te acompaña')).toBeInTheDocument();
  });

  it('"Lo hago así" cierra la hoja y muestra el Plan B, que se cierra con la ✕', () => {
    renderActivity({ planB: 'Poné una carpeta con hojas.' });
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Lo hago así' }));
    expect(screen.queryByText('¿Qué necesitás?')).not.toBeInTheDocument();
    expect(screen.getByText('Poné una carpeta con hojas.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar Plan B' }));
    expect(screen.queryByText('Poné una carpeta con hojas.')).not.toBeInTheDocument();
  });

  it('"No entiendo este paso" muestra el paso más despacio y "Sí, sigo" vuelve al mismo paso', () => {
    renderActivity();
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('No entiendo este paso'));
    expect(screen.getByText('Este paso, más despacio')).toBeInTheDocument();
    expect(screen.getByText('Paso 1 de 3 · Ahora')).toBeInTheDocument();
    expect(screen.getByText('Sacar lo que no necesitás')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, sigo' }));
    expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument();
  });

  it('"Necesito ayuda" avisa de verdad y muestra "Ya le avisamos a Laura" con el Plan B', async () => {
    requestHelp.mockResolvedValueOnce({ avisados: ['Laura'], repetido: false });
    renderActivity({ planB: 'Poné una carpeta con hojas.' });
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('Necesito ayuda'));
    expect(await screen.findByText('Ya le avisamos a Laura')).toBeInTheDocument();
    expect(requestHelp).toHaveBeenCalledWith(42, { motivo: 'ayuda', paso: 1, totalPasos: 3, pasoTexto: 'Mirar el horario' });
    expect(screen.getByText(/Mientras tanto, podés probar/i)).toBeInTheDocument();
  });

  it('si no se pudo avisar muestra la pantalla para mostrarle a alguien y "Probar de nuevo" reintenta', async () => {
    requestHelp.mockRejectedValueOnce(new Error('Network error'));
    requestHelp.mockResolvedValueOnce({ avisados: ['Laura'], repetido: true });
    renderActivity();
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('Necesito ayuda'));
    expect(await screen.findByText('No pudimos avisar')).toBeInTheDocument();
    expect(screen.queryByText(/Network error/)).not.toBeInTheDocument();
    expect(screen.getByText('Paso 1: Mirar el horario')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Probar de nuevo/ }));
    expect(await screen.findByText('Ya le avisamos a Laura')).toBeInTheDocument();
    expect(requestHelp).toHaveBeenCalledTimes(2);
  });

  it('"No, avisale a…" manda no_entiende', async () => {
    requestHelp.mockResolvedValueOnce({ avisados: ['Laura'], repetido: false });
    renderActivity();
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('No entiendo este paso'));
    fireEvent.click(screen.getByRole('button', { name: 'No, avisale a Laura' }));
    await screen.findByText('Ya le avisamos a Laura');
    expect(requestHelp.mock.calls[0][1].motivo).toBe('no_entiende');
  });

  it('una actividad sin assignedActivityId va directo a la pantalla de mostrar, sin llamar al backend', async () => {
    renderActivity({ assignedActivityId: undefined } as Partial<Activity>);
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('Necesito ayuda'));
    expect(await screen.findByText('No pudimos avisar')).toBeInTheDocument();
    expect(requestHelp).not.toHaveBeenCalled();
  });
});

describe('Modo calma desde la actividad', () => {
  it('"Necesito una pausa" abre el Modo calma y "Ya estoy mejor" vuelve al mismo paso', () => {
    renderActivity();
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('Necesito una pausa'));
    expect(screen.getByRole('dialog', { name: 'Vamos despacio' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ya estoy mejor' }));
    expect(screen.queryByRole('dialog', { name: 'Vamos despacio' })).not.toBeInTheDocument();
    expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument();
  });

  it('"Respirar un rato" abre el Modo calma y avisar desde ahí manda pausa sin cerrarlo', async () => {
    requestHelp.mockResolvedValueOnce({ avisados: ['Laura'], repetido: false });
    renderActivity();
    fireEvent.click(screen.getByRole('button', { name: /No puedo seguir/ }));
    fireEvent.click(screen.getByText('Necesito ayuda'));
    await screen.findByText('Ya le avisamos a Laura');
    fireEvent.click(screen.getByRole('button', { name: /Respirar un rato/ }));
    expect(screen.getByRole('dialog', { name: 'Vamos despacio' })).toBeInTheDocument();
    requestHelp.mockResolvedValueOnce({ avisados: ['Laura'], repetido: false });
    fireEvent.click(screen.getByRole('button', { name: 'Avisarle a Laura' }));
    expect(await screen.findByRole('button', { name: /Ya le avisamos ✓/ })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Vamos despacio' })).toBeInTheDocument();
    expect(requestHelp.mock.calls[1][1].motivo).toBe('pausa');
  });
});
