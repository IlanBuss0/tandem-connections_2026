import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';

const searchRefepsProfessional = vi.fn();
const searchRefepsByDni = vi.fn();
const verifyProfessionalDni = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    register: vi.fn(),
    googleAuth: vi.fn(),
  }),
}));

vi.mock('@/data/api', () => ({
  searchRefepsProfessional: (...args: unknown[]) => searchRefepsProfessional(...args),
  searchRefepsByDni: (...args: unknown[]) => searchRefepsByDni(...args),
  verifyProfessionalDni: (...args: unknown[]) => verifyProfessionalDni(...args),
}));

vi.mock('@/components/auth/DniScanner', () => ({
  DniScanner: ({ onCapture }: { onCapture: (file: File) => void }) => (
    <button type="button" onClick={() => onCapture(new File(['dni'], 'dni.jpg', { type: 'image/jpeg' }))}>Escanear DNI</button>
  ),
}));

function openProfessionalRegistration() {
  render(<Login initialView="register" />);
  fireEvent.click(screen.getByRole('button', { name: /soy profesional/i }));
}

function buildRefepsResults(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    nombre: `Nombre${index + 1}`,
    apellido: `Apellido${index + 1}`,
    matricula: '1234',
    profesion: 'Psicología',
    jurisdiccion: 'CABA',
  }));
}

async function openRefepsResults(count: number) {
  searchRefepsProfessional.mockResolvedValueOnce({
    found: true,
    ambiguous: count > 1,
    results: buildRefepsResults(count),
  });
  openProfessionalRegistration();

  fireEvent.change(screen.getByPlaceholderText(/tu n.*mero de matr/i), { target: { value: '1234' } });
  fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

  await waitFor(() => expect(searchRefepsProfessional).toHaveBeenCalledWith('1234'));
}

function expectScrollableRefepsModal() {
  const scrollArea = screen.getByTestId('refeps-modal-scroll-area');
  const actions = screen.getByTestId('refeps-modal-actions');
  const dialog = scrollArea.closest('[role="dialog"]');

  expect(dialog).toHaveClass('flex', 'max-h-[calc(100dvh-2rem)]', 'overflow-hidden');
  expect(dialog).toHaveClass('max-lg:top-4', 'max-lg:bottom-4', 'max-lg:left-4', 'max-lg:right-4', 'max-lg:w-auto');
  expect(scrollArea).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto', 'overscroll-contain');
  expect(actions).toHaveClass('shrink-0');
  expect(scrollArea).not.toContainElement(actions);
}

describe('professional registration flow', () => {
  beforeEach(() => {
    searchRefepsProfessional.mockReset();
    searchRefepsByDni.mockReset();
    verifyProfessionalDni.mockReset();
    URL.createObjectURL = vi.fn(() => 'blob:dni-preview');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('does not query REFEPS with fewer than 4 digits', () => {
    openProfessionalRegistration();

    fireEvent.change(screen.getByLabelText(/matrícula/i), { target: { value: '123' } });
    const continueButton = screen.getByRole('button', { name: /continuar/i });

    expect(continueButton).toBeDisabled();
    fireEvent.click(continueButton);

    expect(searchRefepsProfessional).not.toHaveBeenCalled();
    expect(screen.getByText(/la matrícula debe tener al menos 4 dígitos/i)).toBeInTheDocument();
  });

  it('queries REFEPS with 4 or more digits and shows multiple professionals by name', async () => {
    searchRefepsProfessional.mockResolvedValueOnce({
      found: true,
      ambiguous: true,
      results: [
        { nombre: 'Juan', apellido: 'Perez', matricula: '1234', profesion: 'Psicología', jurisdiccion: 'CABA' },
        { nombre: 'Maria', apellido: 'Gonzalez', matricula: '1234', profesion: 'Psicología', jurisdiccion: 'CABA' },
      ],
    });
    openProfessionalRegistration();

    fireEvent.change(screen.getByLabelText(/matrícula/i), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => expect(searchRefepsProfessional).toHaveBeenCalledWith('1234'));
    expect(await screen.findByText('Lic. Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Lic. Maria Gonzalez')).toBeInTheDocument();
    expect(screen.getAllByText('Psicología')).toHaveLength(2);
  });

  it('switches to DNI search and queries the public DNI lookup', async () => {
    searchRefepsByDni.mockResolvedValueOnce({ found: true, ambiguous: false, results: buildRefepsResults(1) });
    openProfessionalRegistration();

    fireEvent.click(screen.getByRole('button', { name: /por dni/i }));
    expect(screen.getByRole('button', { name: /por dni/i })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(screen.getByLabelText(/^dni$/i), { target: { value: '30123456' } });
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => expect(searchRefepsByDni).toHaveBeenCalledWith('30123456'));
    expect(searchRefepsProfessional).not.toHaveBeenCalled();
  });

  it('keeps the professional selection modal scrollable with one result', async () => {
    await openRefepsResults(1);

    expect(await screen.findByText('Nombre1')).toBeInTheDocument();
    expect(screen.getByText('Apellido1')).toBeInTheDocument();
    expectScrollableRefepsModal();
    expect(screen.getByRole('button', { name: /confirmar datos/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /no soy esta persona/i })).toBeVisible();
  });

  it('keeps all modal actions accessible with five professional results', async () => {
    await openRefepsResults(5);

    expect(await screen.findByText('Lic. Nombre1 Apellido1')).toBeInTheDocument();
    expect(screen.getByText('Lic. Nombre5 Apellido5')).toBeInTheDocument();
    expectScrollableRefepsModal();
    expect(screen.getByRole('button', { name: /confirmar datos/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /no soy esta persona/i })).toBeVisible();
  });

  it('allows reaching and selecting the last professional with ten or more results', async () => {
    await openRefepsResults(12);

    const lastProfessional = await screen.findByText('Lic. Nombre12 Apellido12');
    expect(lastProfessional).toBeInTheDocument();
    expectScrollableRefepsModal();

    fireEvent.click(lastProfessional);

    expect(screen.getByText('Nombre12')).toBeInTheDocument();
    expect(screen.getByText('Apellido12')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar datos/i })).toBeEnabled();
  });

  it('keeps the professional results modal constrained for mobile viewport', async () => {
    window.innerWidth = 390;
    window.innerHeight = 720;

    await openRefepsResults(12);

    expect(await screen.findByText('Lic. Nombre12 Apellido12')).toBeInTheDocument();
    expectScrollableRefepsModal();
  });

  it('keeps the professional results modal constrained for desktop viewport', async () => {
    window.innerWidth = 1440;
    window.innerHeight = 900;

    await openRefepsResults(12);

    expect(await screen.findByText('Lic. Nombre12 Apellido12')).toBeInTheDocument();
    expectScrollableRefepsModal();
    expect(screen.getByTestId('refeps-modal-scroll-area').closest('[role="dialog"]')).toHaveClass('sm:max-h-[42rem]');
  });

  it('blocks identity continuation when DNI verification does not match REFEPS', async () => {
    searchRefepsProfessional.mockResolvedValueOnce({
      found: true,
      ambiguous: false,
      results: [
        { nombre: 'Juan', apellido: 'Perez', matricula: '1234', profesion: 'Psicología', jurisdiccion: 'CABA' },
      ],
    });
    verifyProfessionalDni.mockResolvedValueOnce({
      status: 'DATA_MISMATCH',
      reviewStatus: 'DATA_MISMATCH',
      verified: false,
      reason: null,
      messageCode: 'PROFESSIONAL_DATA_MISMATCH',
    });
    openProfessionalRegistration();

    fireEvent.change(screen.getByLabelText(/matrícula/i), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    fireEvent.click(await screen.findByRole('button', { name: /confirmar datos/i }));
    fireEvent.click(screen.getByRole('button', { name: /escanear dni/i }));

    await waitFor(() => expect(verifyProfessionalDni).toHaveBeenCalled());
    expect(await screen.findByText(/los datos del dni no coinciden/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /escanear otro dni/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver a matr/i })).toBeInTheDocument();
    expect(screen.queryByText(/acceso concedido/i)).not.toBeInTheDocument();
  });
});
