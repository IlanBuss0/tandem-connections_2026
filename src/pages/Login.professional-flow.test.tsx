import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';

const searchRefepsProfessional = vi.fn();
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
  verifyProfessionalDni: (...args: unknown[]) => verifyProfessionalDni(...args),
}));

function openProfessionalRegistration() {
  render(<Login initialView="register" />);
  fireEvent.click(screen.getByRole('button', { name: /soy profesional/i }));
}

describe('professional registration flow', () => {
  beforeEach(() => {
    searchRefepsProfessional.mockReset();
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
    fireEvent.click(screen.getByRole('button', { name: /subir foto/i }));
    fireEvent.change(screen.getByLabelText(/elegir de galería/i), {
      target: { files: [new File(['not-this-person'], 'dni.jpg', { type: 'image/jpeg' })] },
    });

    await waitFor(() => expect(verifyProfessionalDni).toHaveBeenCalled());
    expect(await screen.findByText(/los datos del dni no coinciden/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
  });
});
