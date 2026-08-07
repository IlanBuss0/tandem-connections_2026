import { useCallback, useEffect, useState } from 'react';
import type { ProfessionalTab } from '@/components/professional/ProfessionalNavigation';

export type ProfessionalLocation = { tab: ProfessionalTab; patientId: string | null; chatId?: string };

const paths: Partial<Record<ProfessionalTab, string>> = {
  home: '/professional', calendar: '/professional/calendario', patients: '/professional/pacientes',
  chat: '/professional/chats', notifications: '/professional/notificaciones', documents: '/professional/documentos',
  create: '/professional/actividades', resources: '/professional/recursos', reports: '/professional/reportes',
  profile: '/professional/perfil', about: '/professional/acerca-de', tools: '/professional/herramientas',
  pictograms: '/professional/pictogramas/ia', pictogramCatalog: '/professional/pictogramas',
};

function locationFromPath(pathname: string): ProfessionalLocation {
  const patient = pathname.match(/^\/professional\/pacientes\/([^/]+)$/);
  if (patient) return { tab: 'patients', patientId: decodeURIComponent(patient[1]) };
  const chat = pathname.match(/^\/professional\/chats\/([^/]+)$/);
  if (chat) return { tab: 'chat', patientId: null, chatId: decodeURIComponent(chat[1]) };
  const match = Object.entries(paths).find(([, path]) => path === pathname);
  return { tab: (match?.[0] as ProfessionalTab | undefined) || 'home', patientId: null };
}

function pathFor(tab: ProfessionalTab, context?: { patientId?: string | null; chatId?: string }) {
  if (tab === 'patients' && context?.patientId) return `/professional/pacientes/${encodeURIComponent(context.patientId)}`;
  if (tab === 'chat' && context?.chatId) return `/professional/chats/${encodeURIComponent(context.chatId)}`;
  return paths[tab] || '/professional';
}

export function useProfessionalNavigation() {
  const [location, setLocation] = useState<ProfessionalLocation>(() => locationFromPath(window.location.pathname));

  useEffect(() => {
    const current = locationFromPath(window.location.pathname);
    const valid = window.location.pathname === pathFor(current.tab, current);
    const initialPath = valid ? window.location.pathname : '/professional';
    const initial = valid ? current : locationFromPath(initialPath);
    window.history.replaceState({ ...window.history.state, tandemProfessional: true, professionalDepth: 0, professionalScrollY: window.scrollY }, '', initialPath);
    setLocation(initial);
    const onPopState = (event: PopStateEvent) => {
      setLocation(locationFromPath(window.location.pathname));
      const scrollY = typeof event.state?.professionalScrollY === 'number' ? event.state.professionalScrollY : 0;
      window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((tab: ProfessionalTab, context?: { patientId?: string | null; chatId?: string }) => {
    const nextPath = pathFor(tab, context);
    window.history.replaceState({ ...window.history.state, professionalScrollY: window.scrollY }, '');
    if (window.location.pathname !== nextPath) {
      const depth = Number(window.history.state?.professionalDepth || 0) + 1;
      window.history.pushState({ tandemProfessional: true, professionalDepth: depth, professionalScrollY: 0 }, '', nextPath);
    }
    setLocation(locationFromPath(nextPath));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const goBack = useCallback((fallback: ProfessionalTab = 'home') => {
    if (Number(window.history.state?.professionalDepth || 0) > 0) window.history.back();
    else navigate(fallback);
  }, [navigate]);

  return { ...location, navigate, goBack };
}
