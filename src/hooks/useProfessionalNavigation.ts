import { useRoleNavigation, type RoleNavigationConfig } from './useRoleNavigation';
import type { ProfessionalTab } from '@/components/professional/ProfessionalNavigation';

export type ProfessionalLocation = { tab: ProfessionalTab; patientId: string | null; chatId?: string };

const paths: Partial<Record<ProfessionalTab, string>> = {
  home: '/professional', calendar: '/professional/calendario', patients: '/professional/pacientes',
  chat: '/professional/chats', notifications: '/professional/notificaciones', documents: '/professional/documentos',
  create: '/professional/actividades', resources: '/professional/recursos', reports: '/professional/reportes',
  recentActivity: '/professional/actividad-reciente', emotionalStatus: '/professional/estado-emocional',
  profile: '/professional/perfil', 'profile-settings': '/professional/configuracion',
  about: '/professional/acerca-de', tools: '/professional/herramientas',
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

type ProfessionalContext = { patientId?: string | null; chatId?: string };
const navigationConfig: RoleNavigationConfig<ProfessionalLocation, ProfessionalTab, ProfessionalContext> = {
  locationFromPath,
  pathFor,
  homeTab: 'home',
  homePath: '/professional',
  markerKey: 'tandemProfessional',
  depthKey: 'professionalDepth',
  scrollKey: 'professionalScrollY',
  scrollFrames: 1,
};

export function useProfessionalNavigation() {
  return useRoleNavigation(navigationConfig);
}
