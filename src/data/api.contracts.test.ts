import { describe, expect, it, vi } from 'vitest';
import { tandemApi } from '@/services/api';
import { fetchAllUsers, fetchPertenecienteHome } from './api';

vi.mock('@/services/api', () => ({ tandemApi: { usuarios: { getAll: vi.fn() } } }));

describe('API view model contracts', () => {
  it('does not pass the array index as an avatar when mapping user records', async () => {
    vi.mocked(tandemApi.usuarios.getAll).mockResolvedValue([
      { id: 1, id_tipo_usuario: 1, nombre_usuario: 'fixture1' },
      { id: 2, id_tipo_usuario: 1, nombre_usuario: 'fixture2' },
      { id: 3, id_tipo_usuario: 2, nombre_usuario: 'fixture-tutor' },
    ] as Awaited<ReturnType<typeof tandemApi.usuarios.getAll>>);
    const users = await fetchAllUsers();
    expect(users.map(user => user.id)).toEqual(['1', '2']);
    expect(users.every(user => typeof user.avatar === 'string')).toBe(true);
  });

  it('returns the same profile field for guest and backend home responses', async () => {
    const home = await fetchPertenecienteHome('guest');
    expect(home.perteneciente).toBeNull();
    expect(home).not.toHaveProperty('pertenec');
  });
});
