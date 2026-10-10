import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useTutorNavigation } from './useTutorNavigation';
import { useProfessionalNavigation } from './useProfessionalNavigation';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

it('conserva rutas codificadas, historial y dos frames de scroll para tutor', () => {
  window.history.replaceState(null, '', '/tutor');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const frames = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callback(0); return 1; });
  const { result } = renderHook(() => useTutorNavigation());
  act(() => result.current.navigate('detail', { detailUserId: 'persona 7' }));
  expect(window.location.pathname).toBe('/tutor/personas/persona%207');
  expect(window.history.state).toMatchObject({ tandemTutor: true, tutorDepth: 1 });
  act(() => {
    window.history.replaceState({ tutorScrollY: 120 }, '', '/tutor');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { tutorScrollY: 120 } }));
  });
  expect(result.current.tab).toBe('home');
  expect(frames).toHaveBeenCalledTimes(2);
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 120, behavior: 'auto' });
});

it('conserva el scroll de profesional en un frame y sus claves de historial', () => {
  window.history.replaceState(null, '', '/professional');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const frames = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callback(0); return 1; });
  const { result } = renderHook(() => useProfessionalNavigation());
  act(() => result.current.navigate('patients', { patientId: 'paciente 4' }));
  expect(window.location.pathname).toBe('/professional/pacientes/paciente%204');
  expect(window.history.state).toMatchObject({ tandemProfessional: true, professionalDepth: 1 });
  act(() => {
    window.history.replaceState({ professionalScrollY: 80 }, '', '/professional');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { professionalScrollY: 80 } }));
  });
  expect(result.current.tab).toBe('home');
  expect(frames).toHaveBeenCalledTimes(1);
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 80, behavior: 'auto' });
});

it('mantiene un enlace directo de tutor con un identificador codificado', () => {
  window.history.replaceState(null, '', '/tutor/personas/persona%207');
  const { result } = renderHook(() => useTutorNavigation());
  expect(result.current).toMatchObject({ tab: 'detail', detailUserId: 'persona 7' });
  expect(window.location.pathname).toBe('/tutor/personas/persona%207');
  expect(window.history.state).toMatchObject({ tandemTutor: true, tutorDepth: 0 });
});

it('mantiene un enlace directo profesional con un identificador codificado', () => {
  window.history.replaceState(null, '', '/professional/pacientes/paciente%204');
  const { result } = renderHook(() => useProfessionalNavigation());
  expect(result.current).toMatchObject({ tab: 'patients', patientId: 'paciente 4' });
  expect(window.location.pathname).toBe('/professional/pacientes/paciente%204');
  expect(window.history.state).toMatchObject({ tandemProfessional: true, professionalDepth: 0 });
});

it('actualiza la pantalla de tutor al recorrer el historial hacia atras y adelante', async () => {
  window.history.replaceState(null, '', '/tutor');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callback(0); return 1; });
  const { result } = renderHook(() => useTutorNavigation());
  act(() => result.current.navigate('detail', { detailUserId: 'persona 7' }));
  act(() => result.current.goBack());
  await waitFor(() => expect(result.current.tab).toBe('home'));
  expect(window.location.pathname).toBe('/tutor');
  act(() => window.history.forward());
  await waitFor(() => expect(result.current.detailUserId).toBe('persona 7'));
  expect(result.current.tab).toBe('detail');
  expect(window.location.pathname).toBe('/tutor/personas/persona%207');
});

it('vuelve al inicio profesional cuando no hay una entrada anterior propia', () => {
  window.history.replaceState(null, '', '/professional/pacientes/paciente%204');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const back = vi.spyOn(window.history, 'back');
  const { result } = renderHook(() => useProfessionalNavigation());
  act(() => result.current.goBack());
  expect(back).not.toHaveBeenCalled();
  expect(result.current.tab).toBe('home');
  expect(window.location.pathname).toBe('/professional');
});
