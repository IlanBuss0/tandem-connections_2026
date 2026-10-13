import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/client')>()),
  apiRequest: vi.fn(),
}));

import { ApiError, apiRequest, setApiCacheUser } from '@/services/api/client';
import { fetchProfessionalSessions } from './api';

describe('fetchProfessionalSessions', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
    setApiCacheUser(null);
  });

  it('despues de un 403 sin id_perteneciente no repite el pedido en la misma sesion', async () => {
    setApiCacheUser('5');
    vi.mocked(apiRequest).mockRejectedValue(new ApiError('No autorizado', 403));
    await expect(fetchProfessionalSessions()).rejects.toMatchObject({ status: 403 });
    await expect(fetchProfessionalSessions()).rejects.toMatchObject({ status: 403 });
    expect(apiRequest).toHaveBeenCalledTimes(1);

    // Con id_perteneciente sigue preguntando al backend (otro permiso).
    vi.mocked(apiRequest).mockResolvedValue([]);
    await expect(fetchProfessionalSessions(7)).resolves.toEqual([]);
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it('otro usuario vuelve a preguntar', async () => {
    setApiCacheUser('15');
    vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError('No autorizado', 403));
    await expect(fetchProfessionalSessions()).rejects.toBeTruthy();
    setApiCacheUser('16');
    vi.mocked(apiRequest).mockResolvedValueOnce([]);
    await expect(fetchProfessionalSessions()).resolves.toEqual([]);
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });
});
