import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', async (importOriginal) => ({ ...(await importOriginal<typeof import('./client')>()), apiRequest: vi.fn() }));
import { apiRequest } from './client';
import { tandemApi, type HelpRequestBody } from './tandem-api';

describe('tandemApi.ayuda.request', () => {
  beforeEach(() => { vi.mocked(apiRequest).mockReset(); });

  it('hace POST a /api/ayuda con el body tal cual y devuelve la respuesta', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ avisados: ['Laura'], repetido: false });
    const body: HelpRequestBody = { contexto: 'rutina', motivo: 'no_entiende', titulo: 'Mi mañana', paso: 2, totalPasos: 5, pasoTexto: 'Lavarse la cara' };
    await expect(tandemApi.ayuda.request(body)).resolves.toEqual({ avisados: ['Laura'], repetido: false });
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(apiRequest).toHaveBeenCalledWith('/api/ayuda', { method: 'POST', body });
  });

  it('el comunicador va sin paso', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ avisados: [], repetido: false });
    const body: HelpRequestBody = { contexto: 'comunicador', motivo: 'pausa', frase: 'Necesito espacio' };
    await tandemApi.ayuda.request(body);
    expect(vi.mocked(apiRequest).mock.calls[0][1]).toEqual({ method: 'POST', body });
  });
});
