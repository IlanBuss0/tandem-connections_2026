import { useCallback, useEffect, useState } from 'react';
import type { TutorTab } from '@/components/tutor/TutorNavigation';

export type TutorLocation = {
  tab: TutorTab;
  detailUserId: string | null;
  chatId?: string;
};

const tabPaths: Partial<Record<TutorTab, string>> = {
  home: '/tutor', calendar: '/tutor/calendario', activities: '/tutor/actividades',
  chat: '/tutor/chats', notifications: '/tutor/notificaciones', reports: '/tutor/reportes',
  professionals: '/tutor/profesionales', pictograms: '/tutor/pictogramas/ia',
  pictogramCatalog: '/tutor/pictogramas', connections: '/tutor/personas',
  profile: '/tutor/perfil', about: '/tutor/acerca-de',
};

export function tutorLocationFromPath(pathname: string): TutorLocation {
  const detail = pathname.match(/^\/tutor\/personas\/([^/]+)$/);
  if (detail) return { tab: 'detail', detailUserId: decodeURIComponent(detail[1]) };
  const chat = pathname.match(/^\/tutor\/chats\/([^/]+)$/);
  if (chat) return { tab: 'chat', detailUserId: null, chatId: decodeURIComponent(chat[1]) };
  const match = Object.entries(tabPaths).find(([, path]) => path === pathname);
  return { tab: (match?.[0] as TutorTab | undefined) || 'home', detailUserId: null };
}

export function tutorPathFor(tab: TutorTab, context?: { detailUserId?: string | null; chatId?: string }) {
  if (tab === 'detail' && context?.detailUserId) return `/tutor/personas/${encodeURIComponent(context.detailUserId)}`;
  if (tab === 'chat' && context?.chatId) return `/tutor/chats/${encodeURIComponent(context.chatId)}`;
  return tabPaths[tab] || '/tutor';
}

export function useTutorNavigation() {
  const [location, setLocation] = useState<TutorLocation>(() => tutorLocationFromPath(window.location.pathname));

  useEffect(() => {
    const current = tutorLocationFromPath(window.location.pathname);
    const validTutorPath = window.location.pathname === tutorPathFor(current.tab, current);
    const initialPath = validTutorPath ? window.location.pathname : '/tutor';
    const initialLocation = validTutorPath ? current : tutorLocationFromPath(initialPath);
    window.history.replaceState({ ...window.history.state, tandemTutor: true, tutorDepth: 0, tutorScrollY: window.scrollY }, '', initialPath);
    setLocation(initialLocation);

    const onPopState = (event: PopStateEvent) => {
      setLocation(tutorLocationFromPath(window.location.pathname));
      const scrollY = typeof event.state?.tutorScrollY === 'number' ? event.state.tutorScrollY : 0;
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' })));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((tab: TutorTab, context?: { detailUserId?: string | null; chatId?: string }) => {
    const nextPath = tutorPathFor(tab, context);
    window.history.replaceState({ ...window.history.state, tutorScrollY: window.scrollY }, '');
    if (window.location.pathname !== nextPath) {
      const depth = Number(window.history.state?.tutorDepth || 0) + 1;
      window.history.pushState({ tandemTutor: true, tutorDepth: depth, tutorScrollY: 0 }, '', nextPath);
    }
    setLocation(tutorLocationFromPath(nextPath));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const goBack = useCallback((fallback: TutorTab = 'home') => {
    if (Number(window.history.state?.tutorDepth || 0) > 0) window.history.back();
    else navigate(fallback);
  }, [navigate]);

  return { ...location, navigate, goBack };
}
