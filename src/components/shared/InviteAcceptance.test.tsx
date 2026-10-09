import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import InviteLinkHandler from '@/pages/InviteLinkHandler';
import ProfessionalInviteLinkHandler from '@/pages/ProfessionalInviteLinkHandler';

const auth = vi.hoisted(() => ({ user: { role: 'user' }, refreshUser: vi.fn() }));
const joinTutor = vi.hoisted(() => vi.fn());
const joinProfessional = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/data/api', () => ({
  joinTutorInviteByToken: joinTutor,
  joinProfessionalInviteByToken: joinProfessional,
}));

beforeEach(() => {
  auth.user.role = 'user';
  auth.refreshUser.mockReset().mockResolvedValue(null);
  joinTutor.mockReset().mockResolvedValue({});
  joinProfessional.mockReset().mockResolvedValue({});
});
afterEach(() => cleanup());

describe('aceptacion de invitaciones', () => {
  it('rechaza la cuenta con rol equivocado sin consumir el token', async () => {
    render(<ProfessionalInviteLinkHandler token="abc" />);
    expect(await screen.findByText('Esta invitacion solo puede aceptarse desde una cuenta profesional.')).toBeInTheDocument();
    expect(joinProfessional).not.toHaveBeenCalled();
  });

  it('acepta una invitacion de tutor una vez y no emite permisos profesionales', async () => {
    const event = vi.fn();
    window.addEventListener('permisos:updated', event);
    const { rerender } = render(<InviteLinkHandler token="abc" />);
    expect(await screen.findByText('El tutor fue vinculado correctamente.')).toBeInTheDocument();
    rerender(<InviteLinkHandler token="abc" />);
    expect(joinTutor).toHaveBeenCalledTimes(1);
    expect(auth.refreshUser).toHaveBeenCalledTimes(1);
    expect(event).not.toHaveBeenCalled();
    window.removeEventListener('permisos:updated', event);
  });

  it('acepta una invitacion profesional y emite permisos:updated', async () => {
    auth.user.role = 'professional';
    const event = vi.fn();
    window.addEventListener('permisos:updated', event);
    render(<ProfessionalInviteLinkHandler token="pro" />);
    expect(await screen.findByText('El perteneciente fue vinculado correctamente.')).toBeInTheDocument();
    expect(joinProfessional).toHaveBeenCalledWith('pro');
    expect(event).toHaveBeenCalledTimes(1);
    window.removeEventListener('permisos:updated', event);
  });

  it('muestra el error de aceptacion y evita repetir el token', async () => {
    joinTutor.mockRejectedValue(new Error('Invitacion vencida'));
    const { rerender } = render(<InviteLinkHandler token="vencido" />);
    expect(await screen.findByText('Invitacion vencida')).toBeInTheDocument();
    rerender(<InviteLinkHandler token="vencido" />);
    await waitFor(() => expect(joinTutor).toHaveBeenCalledTimes(1));
  });
});
