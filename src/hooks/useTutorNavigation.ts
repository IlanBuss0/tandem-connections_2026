import { useRoleNavigation, type RoleNavigationConfig } from './useRoleNavigation';
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

type TutorContext = { detailUserId?: string | null; chatId?: string };
const navigationConfig: RoleNavigationConfig<TutorLocation, TutorTab, TutorContext> = {
  locationFromPath: tutorLocationFromPath,
  pathFor: tutorPathFor,
  homeTab: 'home',
  homePath: '/tutor',
  markerKey: 'tandemTutor',
  depthKey: 'tutorDepth',
  scrollKey: 'tutorScrollY',
  scrollFrames: 2,
};

export function useTutorNavigation() {
  return useRoleNavigation(navigationConfig);
}
