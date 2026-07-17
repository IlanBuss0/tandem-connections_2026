import * as legacy from './mockData';
import { tandemApi } from '@/services/api';
import { API_BASE_URL, ApiError, apiRequest, clearDefaultAuthToken, unwrapApiData } from '@/services/api/client';
import type { GameData, GameType } from '@/data/miniGames';
import type {
  Actividad as DbActividad,
  ActividadAsignada as DbActividadAsignada,
  ActividadPersonalizada as DbActividadPersonalizada,
  AutonomiaOperativa as DbAutonomiaOperativa,
  Avatar as DbAvatar,
  ConfiguracionUsuario,
  Chat as DbChat,
  Dispositivo as DbDispositivo,
  EstadoActividad as DbEstadoActividad,
  EstadoVinculo as DbEstadoVinculo,
  NivelApoyo as DbNivelApoyo,
  Mensaje as DbMensaje,
  Notificacion as DbNotificacion,
  Perteneciente as DbPerteneciente,
  PerfilProfesional as DbPerfilProfesional,
  PlanSuscripcion as DbPlanSuscripcion,
  Profesional as DbProfesional,
  PuntoOtorgado as DbPuntoOtorgado,
  SaldoPuntos as DbSaldoPuntos,
  Tutor as DbTutor,
  UbicacionActual as DbUbicacionActual,
  Usuario,
  VinculoProfesionalPerteneciente as DbVinculoProfesionalPerteneciente,
  VinculoTutorPerteneciente as DbVinculoTutorPerteneciente,
  ZonaSegura as DbZonaSegura,
} from '@/types/database';

export type UserRole = legacy.UserRole;
export type User = legacy.User;
export type Tutor = legacy.Tutor;
export type Professional = legacy.Professional;
export type Admin = legacy.Admin;
export type Activity = legacy.Activity;
export type ActivityCategory = legacy.ActivityCategory;
export type ActivityType = legacy.ActivityType;
export type RoutineItem = legacy.RoutineItem;

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  color?: string;
}
export type CalendarEvent = legacy.CalendarEvent;
export interface ProfessionalSession {
  id: number;
  id_profesional: number;
  id_perteneciente: number;
  fecha_sesion: string;
  titulo: string;
  duracion_minutos: number;
  estado: 'programada' | 'completada' | 'cancelada' | 'ausente';
  recordatorios: number[];
  recurrence_group_id?: string | null;
  recurrence_rule?: { frequency: 'none' | 'weekly' | 'twice_weekly' | 'biweekly' | 'monthly'; count?: number } | null;
  recurrence_index?: number;
  motivo_cancelacion?: string | null;
  has_note?: boolean;
}

export interface PrivateProfessionalNote {
  id: number;
  id_sesion_profesional: number;
  fecha_actualizacion: string;
  documento_drive?: {
    id: number;
    google_file_id: string;
    nombre: string;
    mime_type: string;
    web_view_url: string;
    fecha_vinculacion: string;
  } | null;
}

function professionalSessionToCalendarEvent(session: ProfessionalSession, userId: string): CalendarEvent {
  const date = new Date(session.fecha_sesion);
  return {
    id: `professional-session-${session.id}`,
    title: session.titulo || 'Sesion profesional',
    date: date.toISOString().slice(0, 10),
    time: date.toTimeString().slice(0, 5),
    type: 'terapia',
    description: `Sesion profesional · ${session.duracion_minutos} min · Estado: ${session.estado}`,
    userId,
    color: calendarTypeColor('terapia'),
    reminders: session.recordatorios || [],
  };
}

export interface ProfessionalPublicProfile {
  id: number;
  id_profesional: number;
  nombre: string;
  profesion: string;
  especialidad: string | null;
  institucion: string | null;
  descripcion: string | null;
  experiencia: string | null;
  precio_sesion: number | null;
  informacion_precio: string | null;
  modalidad: string | null;
  disponibilidad: string | null;
  correo_contacto: string | null;
  whatsapp_contacto: string | null;
}

export interface ProfessionalOwnProfile {
  profesional: DbProfesional;
  perfil: (DbPerfilProfesional & {
    modalidad?: string | null;
    disponibilidad?: string | null;
    correo_contacto?: string | null;
    whatsapp_contacto?: string | null;
    publicar_correo?: boolean;
    publicar_whatsapp?: boolean;
  }) | null;
}
export type Conversation = legacy.Conversation;
export type ChatMessage = legacy.ChatMessage & {
  editedAt?: string;
  deletedAt?: string;
};
export type Notification = legacy.Notification;
export type EmotionalRecord = legacy.EmotionalRecord;
export type Achievement = legacy.Achievement;
export type Objective = legacy.Objective;
export type Location = legacy.Location;
export type Recommendation = legacy.Recommendation;
export type Pictogram = legacy.Pictogram;
export type Resource = legacy.Resource;
export type PricingPlan = legacy.PricingPlan;

export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  role: 'user' | 'tutor' | 'profesional';
  subtitle?: string;
}

export type EffectivePermission = {
  habilitado: boolean;
  source: 'otorgado' | 'default' | string;
};

export type EffectivePertenecientePermissions = {
  id_perteneciente: number;
  puede_autogestionarse: boolean;
  mode: string;
  permisos: Record<string, EffectivePermission>;
};

export type EffectiveProfessionalPermissions = {
  id_vinculo_profesional_perteneciente: number;
  vinculo_aprobado: boolean;
  permisos: Record<string, EffectivePermission>;
};

export type PermissionContextUser = {
  id: number;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  activo: boolean;
};

export type TutorPermissionContextPerteneciente = {
  id: number;
  usuario: PermissionContextUser;
  perteneciente: DbPerteneciente;
  vinculo: {
    id: number;
    id_tutor: number;
    id_perteneciente: number;
    es_tutor_principal: boolean;
    id_estado_vinculo: number;
    estado_vinculo: string;
    fecha_alta: string;
    fecha_fin: string | null;
  };
  permisos_efectivos: EffectivePertenecientePermissions;
  profesionales_vinculados?: Array<{
    id_vinculo: number;
    profesional: {
      id: number;
      id_usuario: number;
      usuario: PermissionContextUser;
      profesion: string;
      especialidad: string | null;
      matricula: string;
      institucion: string | null;
      id_estado_validacion: number;
      estado_validacion: string | null;
    };
    vinculo: {
      id: number;
      id_profesional: number;
      id_perteneciente: number;
      id_estado_vinculo: number;
      estado_vinculo: string;
      requiere_aprobacion_tutor: boolean;
      fue_aprobado_por_tutor: boolean;
      id_tutor_aprobador: number | null;
      fecha_solicitud: string;
      fecha_resolucion: string | null;
    };
    permisos_efectivos: EffectiveProfessionalPermissions;
  }>;
};

export type PermissionContext = {
  rol: string;
  roles: string[];
  usuario: PermissionContextUser;
  tutor?: DbTutor;
  pertenecientes?: TutorPermissionContextPerteneciente[];
  perteneciente?: DbPerteneciente & { permisos_efectivos: EffectivePertenecientePermissions };
  profesional?: DbProfesional;
  vinculos?: Array<{
    id_vinculo: number;
    perteneciente: DbPerteneciente & { usuario: PermissionContextUser };
    vinculo: DbVinculoProfesionalPerteneciente & { estado_vinculo?: string };
    permisos_efectivos: EffectiveProfessionalPermissions;
  }>;
};

export type PermissionPatchResult = EffectivePertenecientePermissions | EffectiveProfessionalPermissions;

export type TutorInvite = {
  id: number;
  codigo: string;
  token: string;
  fecha_expiracion: string;
};

export type TutorInviteJoinResult = {
  vinculo: DbVinculoTutorPerteneciente;
  es_principal: boolean;
};

export type TutorProfessionalLinkResult = {
  vinculo: DbVinculoProfesionalPerteneciente;
  permisos_efectivos: EffectiveProfessionalPermissions;
  profesional: DbProfesional;
  id_usuario_perteneciente: number | null;
  was_existing: boolean;
};

export type ProfessionalInvite = {
  id: number;
  codigo: string;
  token: string;
  id_perteneciente: number;
  fecha_expiracion: string;
};

export type ProfessionalInviteJoinResult = TutorProfessionalLinkResult & {
  id_usuario_tutor: number | null;
};

export interface AchievementDashboard {
  achievements: Achievement[];
  stats: {
    points: number;
    level: number;
    completedActivities: number;
    assignedActivities: number;
    emotionDays: number;
    avatarExperience: number;
  };
}

async function apiFetchWithFallback<T>(paths: string[], init?: RequestInit): Promise<T> {
  let last: unknown = null;
  for (const p of paths) {
    try {
      if (p.startsWith('/api') && init?.body === undefined) {
        const options = { ...(init || {}) };
        return await apiRequest<T>(p, options);
      }

      const res = await fetch(`${((import.meta as any).env?.VITE_BACKEND_URL || (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')}${p}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
        ...init,
      });
      if (!res.ok) {
        last = new Error(`HTTP ${res.status} on ${p}`);
        continue;
      }
      const payload = await res.json();
      return (payload && typeof payload === 'object' && 'ok' in payload && 'data' in payload ? payload.data : payload) as T;
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error('Request failed');
}

function backendRoleToLegacyRole(idTipoUsuario?: number): UserRole {
  switch (idTipoUsuario) {
    case 2:
      return 'tutor';
    case 3:
      return 'professional';
    case 4:
      return 'admin';
    case 1:
    default:
      return 'user';
  }
}

function toLegacyUser(user: Partial<Usuario>, avatarUrl?: string | null): User | Tutor | Professional | Admin {
  const role = backendRoleToLegacyRole(user.id_tipo_usuario);
  const base = {
    id: String(user.id ?? ''),
    username: user.nombre_usuario ?? user.correo ?? '',
    password: '',
    name: [user.nombre, user.apellido].filter(Boolean).join(' ') || user.nombre_usuario || user.correo || 'Usuario',
    email: user.correo ?? '',
    avatar: avatarUrl || '🙂',
  };

  if (role === 'admin') {
    return { ...base, role, clearance: 'superadmin' } as Admin;
  }

  if (role === 'tutor') {
    return { ...base, role, relation: '', linkedUserIds: [], phone: user.telefono ? String(user.telefono) : '' } as Tutor;
  }

  if (role === 'professional') {
    return {
      ...base,
      role,
      specialty: '',
      description: '',
      modality: '',
      availability: '',
      linkedUserIds: [],
      phone: user.telefono ? String(user.telefono) : '',
    } as Professional;
  }

  return {
    ...base,
    role,
    points: 0,
    streak: 0,
    level: 1,
    plan: 'free',
    onboarded: true,
  } as User;
}

function ageFromDate(value?: string | null): number | undefined {
  if (!value) return undefined;
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age -= 1;
  return age >= 0 ? age : undefined;
}

function enrichPertenecienteUser(user: Usuario, perteneciente?: DbPerteneciente, points = 0, level = 1): User {
  return {
    ...(toLegacyUser(user) as User),
    age: ageFromDate(user.fecha_nacimiento),
    bio: perteneciente?.observacion_general || '',
    points,
    level,
    streak: 0,
    supportLevel: 'medio',
  };
}

function toLegacyActivity(activity: DbActividad, userId?: string): Activity {
  const typeById: Record<number, ActivityType> = {
    1: 'guiada',
    2: 'juego',
    3: 'regulación',
    4: 'decisión',
    5: 'guiada',
  };

  return {
    id: String(activity.id),
    title: activity.titulo,
    category: 'autonomía personal',
    objective: activity.descripcion || activity.titulo,
    description: activity.descripcion || activity.titulo,
    difficulty: 'medio',
    duration: '10 min',
    steps: [activity.descripcion || activity.titulo],
    stepIcons: ['1'],
    status: 'pendiente',
    recommendedBy: 'app',
    progress: 0,
    assignedTo: userId,
    points: activity.id_punto_otorgado ? activity.id_punto_otorgado * 10 : 10,
    type: typeById[activity.id_tipo_actividad] || 'guiada',
    completionMessage: 'Actividad completada.',
  };
}

function extractCustomSteps(description?: string | null): string[] {
  const stepsLine = (description || '').split('\n').find(line => line.trim().startsWith('Pasos:'));
  if (!stepsLine) return [description || 'Completar la actividad asignada.'];
  const steps = stepsLine.replace(/^Pasos:\s*/i, '').split('|').map(step => step.trim()).filter(Boolean);
  return steps.length > 0 ? steps : [description || 'Completar la actividad asignada.'];
}

function customDescriptionWithoutMetadata(description?: string | null): string {
  return (description || '')
    .split('\n')
    .filter(line =>
      !line.trim().startsWith('Objetivo:') &&
      !line.trim().startsWith('Pasos:') &&
      !line.trim().startsWith('Juego:')
    )
    .join('\n')
    .trim();
}

function parseActivityGameMetadata(description?: string | null): { gameType?: GameType; gameData?: GameData } {
  const line = (description || '').split('\n').find(item => item.trim().startsWith('Juego:'));
  if (!line) return {};

  const raw = line.replace(/^Juego:\s*/i, '').trim();
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as { gameType?: GameType; gameData?: GameData };
    if (!parsed.gameType || !parsed.gameData) return {};
    return { gameType: parsed.gameType, gameData: parsed.gameData };
  } catch {
    return {};
  }
}

function toAssignedLegacyActivity(
  assignment: DbActividadAsignada,
  activity: DbActividad | DbActividadPersonalizada,
  status: DbEstadoActividad | undefined,
  userId: string,
): Activity {
  const base = toLegacyActivity({
    id: activity.id,
    id_tipo_actividad: activity.id_tipo_actividad,
    id_punto_otorgado: activity.id_punto_otorgado,
    titulo: activity.titulo,
    descripcion: activity.descripcion,
    es_integrada: 'es_integrada' in activity ? activity.es_integrada : false,
    activa: activity.activa,
  }, userId);
  const completed = isCompletedStatus(status, assignment);
  const customDescription = 'id_actividad_base' in activity ? customDescriptionWithoutMetadata(activity.descripcion) : '';
  const customSteps = 'id_actividad_base' in activity ? extractCustomSteps(activity.descripcion) : null;
  const gameMetadata = parseActivityGameMetadata(activity.descripcion);

  return {
    ...base,
    id: String(assignment.id),
    title: activity.titulo,
    description: customDescription || activity.descripcion || base.description,
    objective: activity.descripcion?.match(/Objetivo:\s*([^\n]+)/)?.[1] || base.objective,
    steps: customSteps || base.steps,
    stepIcons: customSteps ? customSteps.map((_, index) => String(index + 1)) : base.stepIcons,
    status: completed ? 'completada' : 'pendiente',
    progress: completed ? 100 : 0,
    assignedTo: userId,
    recommendedBy: 'profesional',
    assignedActivityId: assignment.id,
    backendActivityId: assignment.id_actividad,
    backendCustomActivityId: assignment.id_actividad_personalizada,
    ...gameMetadata,
  } as Activity & {
    assignedActivityId: number;
    backendActivityId: number | null;
    backendCustomActivityId: number | null;
  };
}

const NOTIFICATION_TYPE_MAP: Record<number, Notification['type']> = {
  1: 'alert',
  2: 'system',
  3: 'reminder',
  4: 'system',
  5: 'chat',
};

const NOTIFICATION_ICON_MAP: Record<string, string> = {
  chat: '💬',
  activity: '🎯',
  system: '🔔',
  payment: '💰',
  message: '💬',
  reminder: '⏰',
  achievement: '🏆',
  alert: '⚠️',
  recommendation: '⭐',
  streak: '🔥',
};

function toLegacyNotification(notification: DbNotificacion): Notification {
  const referenceTypeMap: Record<string, Notification['type']> = {
    chat: 'chat',
    activity: 'activity',
    calendar: 'reminder',
    achievement: 'achievement',
    payment: 'payment',
  };
  const type = (notification.reference_type && referenceTypeMap[notification.reference_type])
    || NOTIFICATION_TYPE_MAP[notification.id_tipo_notificacion]
    || 'system';
  return {
    id: String(notification.id),
    userId: String(notification.id_usuario_destino),
    title: notification.titulo,
    message: notification.cuerpo || '',
    type,
    icon: NOTIFICATION_ICON_MAP[type] || '🔔',
    read: notification.leida,
    timestamp: notification.fecha_creacion,
    actionLabel: notification.reference_type === 'chat' ? 'Ir al chat' : undefined,
    referenceType: notification.reference_type || undefined,
    referenceId: notification.reference_type === 'calendar' && notification.reference_calendar_event_id
      ? notification.reference_calendar_event_id
      : notification.reference_id !== null ? String(notification.reference_id) : undefined,
    sourceUserId: notification.context_user_id !== null
      ? String(notification.context_user_id)
      : notification.id_usuario_actor !== null ? String(notification.id_usuario_actor) : undefined,
    routineId: notification.reference_routine_id || undefined,
    itemId: notification.reference_item_id || undefined,
  } as Notification;
}

function isBackendUserId(userId: string): boolean {
  return Number.isInteger(Number(userId));
}

export function getStoredAuthToken(): string | null {
  return 'cookie-auth';
}

function storeAuthToken(_token?: string | null): void {
  clearDefaultAuthToken();
}

export function clearStoredAuthToken(): void {
  clearDefaultAuthToken();
}

async function fetchPertenecienteByUsuarioId(userId: string | number): Promise<DbPerteneciente | null> {
  try {
    return await apiRequest<DbPerteneciente>(`/api/pertenecientes/usuario/${encodeURIComponent(String(userId))}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

async function fetchCustomActivitiesByPerteneciente(idPerteneciente: number): Promise<DbActividadPersonalizada[]> {
  return apiRequest<DbActividadPersonalizada[]>(
    `/api/actividades-personalizadas?id_perteneciente=${encodeURIComponent(String(idPerteneciente))}`,
    { token: getStoredAuthToken() },
  );
}

export async function fetchPermissionContext(): Promise<PermissionContext> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para consultar permisos.');

  const response = await apiRequest<{ ok: true; data: PermissionContext }>('/api/permisos/contexto', { token });
  return unwrapApiData(response);
}

export async function setPertenecientePermissionByName(
  idPerteneciente: number,
  permiso: string,
  habilitado: boolean,
  motivo = 'Actualizado desde frontend',
): Promise<PermissionPatchResult> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para modificar permisos.');

  const response = await apiRequest<{ ok: true; data: PermissionPatchResult }>(
    `/api/permisos/perteneciente/${encodeURIComponent(String(idPerteneciente))}`,
    {
      method: 'PATCH',
      token,
      body: { permiso, habilitado, motivo },
    },
  );

  return unwrapApiData(response);
}

export async function setProfessionalPermissionByName(
  idVinculo: number,
  permiso: string,
  habilitado: boolean,
  motivo = 'Actualizado desde frontend',
): Promise<PermissionPatchResult> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para modificar permisos.');

  const response = await apiRequest<{ ok: true; data: PermissionPatchResult }>(
    `/api/permisos/profesional-vinculo/${encodeURIComponent(String(idVinculo))}`,
    {
      method: 'PATCH',
      token,
      body: { permiso, habilitado, motivo },
    },
  );

  return unwrapApiData(response);
}

export async function generateTutorInvite(
  payload: { horas_validez?: number } = {},
): Promise<TutorInvite> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para generar invitaciones.');

  const response = await apiRequest<{ ok: true; data: TutorInvite }>('/api/vinculos/invite/generate', {
    method: 'POST',
    token,
    body: { horas_validez: payload.horas_validez ?? 1 },
  });

  return unwrapApiData(response);
}

function normalizeInviteCode(codigo: string): string {
  const compact = String(codigo || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  return compact.length > 4 ? `${compact.slice(0, 4)}-${compact.slice(4, 8)}` : compact;
}

export async function joinTutorInviteByCode(codigo: string): Promise<TutorInviteJoinResult> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para aceptar invitaciones.');
  const normalizedCode = normalizeInviteCode(codigo);

  const response = await apiRequest<{ ok: true; data: TutorInviteJoinResult }>('/api/vinculos/invite/join', {
    method: 'POST',
    token,
    body: { codigo: normalizedCode },
  });

  return unwrapApiData(response);
}

export async function joinTutorInviteByToken(inviteToken: string): Promise<TutorInviteJoinResult> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para aceptar invitaciones.');

  const response = await apiRequest<{ ok: true; data: TutorInviteJoinResult }>('/api/vinculos/invite/join', {
    method: 'POST',
    token,
    body: { token: inviteToken },
  });

  return unwrapApiData(response);
}

export async function deleteTutorPertenecienteLink(idVinculo: number): Promise<{ rowsAffected: number }> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para eliminar vinculos.');

  const response = await apiRequest<{ ok: true; data: { rowsAffected: number } }>(
    `/api/vinculos-tutor-pertenecientes/tutor/${encodeURIComponent(String(idVinculo))}`,
    {
      method: 'DELETE',
      token,
    },
  );

  return unwrapApiData(response);
}

export async function generateProfessionalInvite(
  idPerteneciente: number,
  payload: { horas_validez?: number } = {},
): Promise<ProfessionalInvite> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para generar invitaciones profesionales.');

  const response = await apiRequest<{ ok: true; data: ProfessionalInvite }>(
    '/api/vinculos-profesionales-pertenecientes/invite/generate',
    {
      method: 'POST',
      token,
      body: {
        id_perteneciente: idPerteneciente,
        horas_validez: payload.horas_validez ?? 1,
      },
    },
  );

  return unwrapApiData(response);
}

export async function joinProfessionalInviteByCode(codigo: string): Promise<ProfessionalInviteJoinResult> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para aceptar invitaciones profesionales.');
  const normalizedCode = normalizeInviteCode(codigo);

  const response = await apiRequest<{ ok: true; data: ProfessionalInviteJoinResult }>(
    '/api/vinculos-profesionales-pertenecientes/invite/join',
    {
      method: 'POST',
      token,
      body: { codigo: normalizedCode },
    },
  );

  return unwrapApiData(response);
}

export async function joinProfessionalInviteByToken(inviteToken: string): Promise<ProfessionalInviteJoinResult> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para aceptar invitaciones profesionales.');

  const response = await apiRequest<{ ok: true; data: ProfessionalInviteJoinResult }>(
    '/api/vinculos-profesionales-pertenecientes/invite/join',
    {
      method: 'POST',
      token,
      body: { token: inviteToken },
    },
  );

  return unwrapApiData(response);
}

export async function deleteProfessionalPertenecienteLink(idVinculo: number): Promise<{ rowsAffected: number }> {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Token requerido para eliminar vinculos profesionales.');

  const response = await apiRequest<{ ok: true; data: { rowsAffected: number } }>(
    `/api/vinculos-profesionales-pertenecientes/tutor/${encodeURIComponent(String(idVinculo))}`,
    {
      method: 'DELETE',
      token,
    },
  );

  return unwrapApiData(response);
}

export async function fetchAssignedActivitiesByPerteneciente(
  idPerteneciente: number,
  token = getStoredAuthToken(),
): Promise<DbActividadAsignada[]> {
  if (!token) return [];

  return apiRequest<DbActividadAsignada[]>(
    `/api/actividades-asignadas?id_perteneciente=${encodeURIComponent(String(idPerteneciente))}`,
    { token },
  );
}

export async function fetchSafeZonesByPerteneciente(
  idPerteneciente: number,
  token = getStoredAuthToken(),
): Promise<DbZonaSegura[]> {
  if (!token) return [];

  return apiRequest<DbZonaSegura[]>(
    `/api/zonas-seguras?id_perteneciente=${encodeURIComponent(String(idPerteneciente))}`,
    { token },
  );
}

function formatChatTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export interface ProfileSupportPerson {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: 'tutor' | 'professional';
  detail: string;
  status: string;
  isPrimary?: boolean;
}

export interface UserProfileDashboard {
  usuario: Omit<Usuario, 'contrasena_hash'> | null;
  perteneciente: DbPerteneciente | null;
  supportLevel: string;
  autonomy: string;
  canSelfManage: boolean;
  observation: string;
  points: number;
  level: number;
  experience: number;
  tutors: ProfileSupportPerson[];
  professionals: ProfileSupportPerson[];
  plans: PricingPlan[];
}

export interface UserProfileSettings {
  usuario: Omit<Usuario, 'contrasena_hash'> | null;
  perteneciente: DbPerteneciente | null;
  supportLevels: DbNivelApoyo[];
  autonomies: DbAutonomiaOperativa[];
  preferences: {
    recibir_notificaciones: boolean;
    recordatorios_actividad: boolean;
    resumen_semanal: boolean;
    compartir_ubicacion: boolean;
    permitir_mensajes: boolean;
    mostrar_progreso_red_apoyo: boolean;
  };
  accessibility: {
    tamanio_texto: 'normal' | 'grande' | 'muy_grande';
    contraste_alto: boolean;
    reducir_movimiento: boolean;
    pictogramas_grandes: boolean;
  };
}

export type UserProfileSettingsPayload = {
  usuario: Pick<Usuario, 'nombre_usuario' | 'nombre' | 'apellido' | 'correo'> & {
    telefono: number | null;
    fecha_nacimiento: string | null;
  };
  perteneciente: Pick<
    DbPerteneciente,
    'id_nivel_apoyo' | 'id_autonomia_operativa' | 'puede_autogestionarse' | 'observacion_general'
  >;
  preferences: UserProfileSettings['preferences'];
  accessibility: UserProfileSettings['accessibility'];
};

function parseEmotionConfig(config: ConfiguracionUsuario): EmotionalRecord | null {
  if (!config.clave?.startsWith('emotion:')) return null;

  try {
    const value = JSON.parse(config.valor || '{}') as Partial<EmotionalRecord>;
    if (!value.emotion) return null;

    return {
      id: String(config.id),
      userId: String(config.id_usuario),
      emotion: value.emotion,
      emoji: value.emoji || '🙂',
      intensity: Number(value.intensity || 3),
      context: value.context || '',
      whatHelped: value.whatHelped || '',
      timestamp: value.timestamp || new Date(config.fecha_modificacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      date: value.date || config.fecha_modificacion.split('T')[0],
    };
  } catch {
    return null;
  }
}

function daysAgoLabel(date?: string | null): string | undefined {
  if (!date) return undefined;
  const then = new Date(date);
  if (Number.isNaN(then.getTime())) return undefined;
  const diff = Math.max(0, Math.floor((Date.now() - then.getTime()) / 86400000));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return `Hace ${diff} dias`;
}

function buildAchievement(
  id: string,
  title: string,
  description: string,
  icon: string,
  category: string,
  points: number,
  requirement: string,
  progress: number,
  target: number,
  unlockedDate?: string | null,
): Achievement {
  const unlocked = progress >= target;
  return {
    id,
    title,
    description,
    icon,
    category,
    unlocked,
    unlockedDate: unlocked ? daysAgoLabel(unlockedDate) || 'Desbloqueado' : undefined,
    points,
    requirement: unlocked ? `${target}/${target}` : `${Math.min(progress, target)}/${target} · ${requirement}`,
  };
}

function isCompletedStatus(status?: DbEstadoActividad, assigned?: DbActividadAsignada) {
  const name = (status?.nombre || '').toLowerCase();
  return Boolean(assigned?.fecha_completada || name.includes('complet') || name.includes('finaliz'));
}

function formatBackendDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(date);
}

async function fetchBackendAchievementDashboard(userId: string): Promise<AchievementDashboard> {
  const idUsuario = Number(userId);
  const [pertenecientes, saldos, avatares, configs] = await Promise.all([
    tandemApi.pertenecientes.getAll(),
    tandemApi.saldosPuntos.getAll(),
    tandemApi.avatares.getAll(),
    tandemApi.configuracionesUsuarios.getAll(),
  ]);

  const perteneciente = pertenecientes.find((item) => item.id_usuario === idUsuario);
  const idPerteneciente = perteneciente?.id;
  const assignedForUser = idPerteneciente ? await fetchAssignedActivitiesByPerteneciente(idPerteneciente) : [];
  const completed = assignedForUser.filter((item) => item.fecha_completada || item.id_estado_actividad === 3);
  const completedDates = completed
    .map((item) => item.fecha_completada || item.fecha_asignacion)
    .filter(Boolean)
    .sort();
  const latestCompletedDate = completedDates[completedDates.length - 1];
  const saldo = idPerteneciente
    ? saldos.find((item) => item.id_perteneciente === idPerteneciente)?.saldo || 0
    : 0;
  const avatar = idPerteneciente
    ? avatares.find((item) => item.id_perteneciente === idPerteneciente)
    : undefined;
  const emotionDays = new Set(
    configs
      .filter((config) => config.id_usuario === idUsuario && config.clave.startsWith('emotion:'))
      .map((config) => parseEmotionConfig(config)?.date || config.fecha_modificacion.split('T')[0])
      .filter(Boolean)
  ).size;

  const completedCount = completed.length;
  const level = avatar?.nivel || 1;
  const experience = avatar?.experiencia || 0;

  return {
    achievements: [
      buildAchievement('ach-first-activity', 'Primer paso', 'Completaste tu primera actividad asignada.', '🌟', 'actividades', 50, 'Completar 1 actividad', completedCount, 1, latestCompletedDate),
      buildAchievement('ach-five-activities', 'En marcha', 'Completaste 5 actividades.', '✅', 'actividades', 100, 'Completar 5 actividades', completedCount, 5, latestCompletedDate),
      buildAchievement('ach-ten-activities', 'Explorador', 'Completaste 10 actividades.', '🧭', 'actividades', 150, 'Completar 10 actividades', completedCount, 10, latestCompletedDate),
      buildAchievement('ach-twenty-activities', 'Constante', 'Completaste 20 actividades.', '🔥', 'constancia', 200, 'Completar 20 actividades', completedCount, 20, latestCompletedDate),
      buildAchievement('ach-emotion-first', 'Me conozco', 'Registraste tu primera emocion.', '💭', 'emociones', 50, 'Registrar 1 dia emocional', emotionDays, 1),
      buildAchievement('ach-emotion-five', 'En sintonia', 'Registraste emociones en 5 dias distintos.', '🎯', 'emociones', 80, 'Registrar 5 dias emocionales', emotionDays, 5),
      buildAchievement('ach-points-100', 'Primer ahorro', 'Alcanzaste 100 puntos disponibles.', '🪙', 'puntos', 75, 'Llegar a 100 puntos', saldo, 100),
      buildAchievement('ach-points-500', 'Gran ahorro', 'Alcanzaste 500 puntos disponibles.', '💰', 'puntos', 150, 'Llegar a 500 puntos', saldo, 500),
      buildAchievement('ach-level-3', 'Subiendo de nivel', 'Tu avatar alcanzo el nivel 3.', '🎖️', 'avatar', 120, 'Llegar a nivel 3', level, 3),
      buildAchievement('ach-level-5', 'Nivel 5', 'Tu avatar alcanzo el nivel 5.', '🏆', 'avatar', 180, 'Llegar a nivel 5', level, 5),
      buildAchievement('ach-exp-250', 'Aprendiz activo', 'Tu avatar sumo 250 puntos de experiencia.', '📈', 'avatar', 100, 'Llegar a 250 XP', experience, 250),
      buildAchievement('ach-exp-1000', 'Maestria', 'Tu avatar sumo 1000 puntos de experiencia.', '⭐', 'avatar', 250, 'Llegar a 1000 XP', experience, 1000),
    ],
    stats: {
      points: saldo,
      level,
      completedActivities: completedCount,
      assignedActivities: assignedForUser.length,
      emotionDays,
      avatarExperience: experience,
    },
  };
}

function toPricingPlan(plan: DbPlanSuscripcion): PricingPlan {
  const monthly = plan.precio_mensual == null ? '$0' : `$${Number(plan.precio_mensual).toLocaleString('es-AR')}`;
  const features = [
    plan.descripcion || 'Funciones principales de TANDEM',
    plan.precio_anual ? `Precio anual: $${Number(plan.precio_anual).toLocaleString('es-AR')}` : 'Sin precio anual registrado',
    plan.activo ? 'Disponible' : 'No disponible',
  ];

  return {
    id: String(plan.id),
    name: plan.nombre_plan,
    price: monthly,
    period: '/mes',
    features,
    highlighted: Boolean(plan.activo && Number(plan.precio_mensual || 0) > 0),
    badge: plan.activo ? undefined : 'Inactivo',
  };
}

async function fetchBackendUserProfileDashboard(userId: string): Promise<UserProfileDashboard> {
  const idUsuario = Number(userId);
  const [
    usuarios,
    pertenecientes,
    nivelesApoyo,
    autonomias,
    saldos,
    avatares,
    vinculosTutor,
    vinculosProfesional,
    tutores,
    profesionales,
    estadosVinculos,
    planes,
  ] = await Promise.all([
    tandemApi.usuarios.getAll(),
    tandemApi.pertenecientes.getAll(),
    tandemApi.nivelesApoyos.getAll(),
    tandemApi.autonomiasOperativas.getAll(),
    tandemApi.saldosPuntos.getAll(),
    tandemApi.avatares.getAll(),
    tandemApi.vinculosTutorPertenecientes.getAll(),
    tandemApi.vinculosProfesionalesPertenecientes.getAll(),
    tandemApi.tutores.getAll(),
    tandemApi.profesionales.getAll(),
    tandemApi.estadosVinculos.getAll(),
    tandemApi.planesSuscripciones.getAll(),
  ]);

  const usuario = usuarios.find((item) => Number(item.id) === idUsuario) || null;
  const perteneciente = (pertenecientes as DbPerteneciente[]).find((item) => Number(item.id_usuario) === idUsuario) || null;

  if (!perteneciente) {
    return {
      usuario: usuario ? ({ ...usuario, contrasena_hash: undefined } as Omit<Usuario, 'contrasena_hash'>) : null,
      perteneciente: null,
      supportLevel: 'Sin registrar',
      autonomy: 'Sin registrar',
      canSelfManage: false,
      observation: '',
      points: 0,
      level: 1,
      experience: 0,
      tutors: [],
      professionals: [],
      plans: (planes as DbPlanSuscripcion[]).map(toPricingPlan),
    };
  }

  const usersById = new Map((usuarios as Usuario[]).map((item) => [Number(item.id), item]));
  const tutorById = new Map((tutores as DbTutor[]).map((item) => [Number(item.id), item]));
  const professionalById = new Map((profesionales as DbProfesional[]).map((item) => [Number(item.id), item]));
  const statusById = new Map((estadosVinculos as DbEstadoVinculo[]).map((item) => [Number(item.id), item.nombre]));
  const supportLevel = (nivelesApoyo as DbNivelApoyo[]).find((item) => Number(item.id) === Number(perteneciente.id_nivel_apoyo));
  const autonomy = (autonomias as DbAutonomiaOperativa[]).find((item) => Number(item.id) === Number(perteneciente.id_autonomia_operativa));
  const saldo = (saldos as DbSaldoPuntos[]).find((item) => Number(item.id_perteneciente) === Number(perteneciente.id));
  const avatar = (avatares as DbAvatar[]).find((item) => Number(item.id_perteneciente) === Number(perteneciente.id));

  const linkedTutors = (vinculosTutor as DbVinculoTutorPerteneciente[])
    .filter((link) => Number(link.id_perteneciente) === Number(perteneciente.id))
    .map((link) => {
      const tutor = tutorById.get(Number(link.id_tutor));
      const tutorUser = tutor ? usersById.get(Number(tutor.id_usuario)) : undefined;
      return {
        id: String(tutor?.id || link.id_tutor),
        name: tutorUser ? [tutorUser.nombre, tutorUser.apellido].filter(Boolean).join(' ') : `Tutor #${link.id_tutor}`,
        username: tutorUser?.nombre_usuario || '',
        email: tutorUser?.correo || '',
        phone: tutorUser?.telefono ? String(tutorUser.telefono) : '',
        role: 'tutor' as const,
        detail: tutor?.parentesco || 'Tutor',
        status: statusById.get(Number(link.id_estado_vinculo)) || 'Sin estado',
        isPrimary: Boolean(link.es_tutor_principal),
      };
    });

  const linkedProfessionals = (vinculosProfesional as DbVinculoProfesionalPerteneciente[])
    .filter((link) => Number(link.id_perteneciente) === Number(perteneciente.id))
    .map((link) => {
      const professional = professionalById.get(Number(link.id_profesional));
      const professionalUser = professional ? usersById.get(Number(professional.id_usuario)) : undefined;
      return {
        id: String(professional?.id || link.id_profesional),
        name: professionalUser ? [professionalUser.nombre, professionalUser.apellido].filter(Boolean).join(' ') : `Profesional #${link.id_profesional}`,
        username: professionalUser?.nombre_usuario || '',
        email: professionalUser?.correo || '',
        phone: professionalUser?.telefono ? String(professionalUser.telefono) : '',
        role: 'professional' as const,
        detail: professional?.especialidad || professional?.profesion || 'Profesional',
        status: statusById.get(Number(link.id_estado_vinculo)) || 'Sin estado',
      };
    });

  return {
    usuario: usuario ? ({ ...usuario, contrasena_hash: undefined } as Omit<Usuario, 'contrasena_hash'>) : null,
    perteneciente,
    supportLevel: supportLevel?.nombre || 'Sin registrar',
    autonomy: autonomy?.nombre || 'Sin registrar',
    canSelfManage: Boolean(perteneciente.puede_autogestionarse),
    observation: perteneciente.observacion_general || '',
    points: saldo?.saldo ?? 0,
    level: avatar?.nivel ?? 1,
    experience: avatar?.experiencia ?? 0,
    tutors: linkedTutors,
    professionals: linkedProfessionals,
    plans: (planes as DbPlanSuscripcion[]).map(toPricingPlan),
  };
}

async function fetchUserAvatarUrl(userId: number): Promise<string | null> {
  try {
    const [pertenecientes, avatares] = await Promise.all([
      tandemApi.pertenecientes.getAll(),
      tandemApi.avatares.getAll(),
    ]);
    const pp = (pertenecientes as DbPerteneciente[]).find(p => Number(p.id_usuario) === userId);
    if (!pp) return null;
    const avatar = (avatares as DbAvatar[]).find(a => Number(a.id_perteneciente) === Number(pp.id));
    return avatar?.avatar_imagen_url || avatar?.avatar_imagen_origen_url || null;
  } catch {
    return null;
  }
}

export async function findUser(username: string, password: string): Promise<User | Tutor | Professional | Admin | null> {
  try {
    const auth = await tandemApi.auth.login({
      nombre_usuario: username,
      correo: username.includes('@') ? username : undefined,
      contrasena: password,
    });

    storeAuthToken();
    const avatarUrl = auth.user?.id ? await fetchUserAvatarUrl(auth.user.id) : null;
    return toLegacyUser(auth.user, avatarUrl);
  } catch {
    const localUser = legacy.findUser(username, password);
    if (localUser) {
      storeAuthToken();
      return localUser;
    }

    return null;
  }
}

export async function fetchStoredAuthUser(): Promise<User | Tutor | Professional | Admin | null> {
  try {
    const user = await tandemApi.auth.me();
    const avatarUrl = user?.id ? await fetchUserAvatarUrl(user.id) : null;
    return toLegacyUser(user, avatarUrl);
  } catch {
    try {
      await tandemApi.auth.refresh();
      const user = await tandemApi.auth.me();
      const avatarUrl = user?.id ? await fetchUserAvatarUrl(user.id) : null;
      return toLegacyUser(user, avatarUrl);
    } catch {
      return null;
    }
  }
}

export async function logoutStoredAuthSession(): Promise<void> {
  await tandemApi.auth.logout();
}

export interface PertenecienteHomeActivity {
  id: string;
  title: string;
  description: string;
  status: string;
  completed: boolean;
  assignedAt: string;
}

export interface PertenecienteHomeData {
  perteneciente: DbPerteneciente | null;
  supportLevel: string;
  autonomy: string;
  canSelfManage: boolean;
  points: number;
  level: number;
  experience: number;
  activities: PertenecienteHomeActivity[];
  notifications: Notification[];
}

export interface TutorHomeLinkedUser extends User {
  pertenecienteId: number;
  linkId: number;
  linkStatus: string;
  isPrimaryTutor: boolean;
  supportLevel: string;
  autonomy: string;
  canSelfManage: boolean;
  observation: string;
}

export interface TutorHomeActivity {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  status: string;
  completed: boolean;
  assignedAt: string;
  completedAt: string | null;
}

export interface TutorHomeLocation {
  id: string;
  name: string;
  address: string;
  type: 'actual' | 'seguro';
  timestamp?: string;
}

export interface TutorHomeData {
  tutorId: number | null;
  linkedUsers: TutorHomeLinkedUser[];
  byUserId: Record<string, {
    activities: TutorHomeActivity[];
    emotions: EmotionalRecord[];
    events: CalendarEvent[];
    locations: TutorHomeLocation[];
    notifications: Notification[];
    recommendations: Recommendation[];
  }>;
}

export async function fetchPertenecienteHome(userId: string): Promise<PertenecienteHomeData> {
  if (!isBackendUserId(userId)) {
    const user = legacy.getUserById(userId);
    const activities = legacy.getActivitiesForUser(userId);
    return {
      perteneciente: null,
      supportLevel: user?.supportLevel || 'Sin registrar',
      autonomy: 'Sin registrar',
      canSelfManage: Boolean(user?.onboarded),
      points: user?.points ?? 0,
      level: user?.level ?? 1,
      experience: 0,
      activities: activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        status: activity.status,
        completed: activity.status === 'completada',
        assignedAt: 'Hoy',
      })),
      notifications: legacy.getNotificationsForUser(userId),
    };
  }

  const perteneciente = await fetchPertenecienteByUsuarioId(userId);
  if (!perteneciente) {
    return {
      perteneciente: null,
      supportLevel: 'Sin registrar',
      autonomy: 'Sin registrar',
      canSelfManage: false,
      points: 0,
      level: 1,
      experience: 0,
      activities: [],
      notifications: [],
    };
  }

  const [
    asignadas,
    actividades,
    actividadesPersonalizadas,
    estados,
    notificaciones,
    saldos,
    avatares,
    nivelesApoyo,
    autonomias,
  ] = await Promise.all([
    fetchAssignedActivitiesByPerteneciente(Number(perteneciente.id)),
    tandemApi.actividades.getAll(),
    fetchCustomActivitiesByPerteneciente(Number(perteneciente.id)),
    tandemApi.estadosActividades.getAll(),
    tandemApi.notificaciones.getMine(),
    tandemApi.saldosPuntos.getAll(),
    tandemApi.avatares.getAll(),
    tandemApi.nivelesApoyos.getAll(),
    tandemApi.autonomiasOperativas.getAll(),
  ]);

  const activitiesById = new Map((actividades as DbActividad[]).map(a => [Number(a.id), a]));
  const customById = new Map((actividadesPersonalizadas as DbActividadPersonalizada[]).map(a => [Number(a.id), a]));
  const statusById = new Map((estados as DbEstadoActividad[]).map(e => [Number(e.id), e]));
  const saldo = (saldos as DbSaldoPuntos[]).find(s => Number(s.id_perteneciente) === Number(perteneciente.id));
  const avatar = (avatares as DbAvatar[]).find(a => Number(a.id_perteneciente) === Number(perteneciente.id));
  const supportLevel = (nivelesApoyo as DbNivelApoyo[]).find(n => Number(n.id) === Number(perteneciente.id_nivel_apoyo));
  const autonomy = (autonomias as DbAutonomiaOperativa[]).find(a => Number(a.id) === Number(perteneciente.id_autonomia_operativa));

  return {
    perteneciente,
    supportLevel: supportLevel?.nombre || 'Sin registrar',
    autonomy: autonomy?.nombre || 'Sin registrar',
    canSelfManage: Boolean(perteneciente.puede_autogestionarse),
    points: saldo?.saldo ?? 0,
    level: avatar?.nivel ?? 1,
    experience: avatar?.experiencia ?? 0,
    activities: (asignadas as DbActividadAsignada[])
      .filter(a => Number(a.id_perteneciente) === Number(perteneciente.id))
      .filter(a =>
        Boolean(a.id_actividad && activitiesById.has(Number(a.id_actividad))) ||
        Boolean(a.id_actividad_personalizada && customById.has(Number(a.id_actividad_personalizada)))
      )
      .map(a => {
        const base = a.id_actividad ? activitiesById.get(Number(a.id_actividad)) : undefined;
        const custom = a.id_actividad_personalizada ? customById.get(Number(a.id_actividad_personalizada)) : undefined;
        const status = a.id_estado_actividad ? statusById.get(Number(a.id_estado_actividad)) : undefined;
        return {
          id: String(a.id),
          title: base?.titulo || custom?.titulo || `Actividad #${a.id}`,
          description: base?.descripcion || custom?.descripcion || 'Actividad asignada desde el equipo de apoyo.',
          status: status?.nombre || (a.fecha_completada ? 'Completada' : 'Pendiente'),
          completed: isCompletedStatus(status, a),
          assignedAt: formatBackendDate(a.fecha_asignacion),
        };
      }),
    notifications: (notificaciones as DbNotificacion[])
      .filter(n => Number(n.id_usuario_destino) === Number(userId))
      .map(n => ({
        id: String(n.id),
        userId,
        title: n.titulo || 'Notificación',
        message: n.cuerpo || '',
        type: 'reminder',
        icon: '!',
        read: Boolean(n.leida),
        timestamp: formatBackendDate(n.fecha_creacion),
      } as Notification)),
  };
}

export async function fetchTutorHome(userId: string): Promise<TutorHomeData> {
  const idUsuarioTutor = Number(userId);

  if (!Number.isFinite(idUsuarioTutor)) {
    return { tutorId: null, linkedUsers: [], byUserId: {} };
  }

  const [
    usuarios,
    tutores,
    pertenecientes,
    vinculosTutor,
    estadosVinculos,
    nivelesApoyo,
    autonomias,
    saldos,
    avatares,
    actividades,
    estadosActividades,
    puntosOtorgados,
    notificaciones,
  ] = await Promise.all([
    tandemApi.usuarios.getAll(),
    tandemApi.tutores.getAll(),
    tandemApi.pertenecientes.getAll(),
    tandemApi.vinculosTutorPertenecientes.getAll(),
    tandemApi.estadosVinculos.getAll(),
    tandemApi.nivelesApoyos.getAll(),
    tandemApi.autonomiasOperativas.getAll(),
    tandemApi.saldosPuntos.getAll(),
    tandemApi.avatares.getAll(),
    tandemApi.actividades.getAll(),
    tandemApi.estadosActividades.getAll(),
    tandemApi.puntosOtorgados.getAll(),
    Promise.resolve([] as DbNotificacion[]),
  ]);

  const tutor = (tutores as DbTutor[]).find(item => Number(item.id_usuario) === idUsuarioTutor);

  if (!tutor) {
    return { tutorId: null, linkedUsers: [], byUserId: {} };
  }

  const usersById = new Map((usuarios as Usuario[]).map(item => [Number(item.id), item]));
  const pertenecienteById = new Map((pertenecientes as DbPerteneciente[]).map(item => [Number(item.id), item]));
  const statusById = new Map((estadosVinculos as DbEstadoVinculo[]).map(item => [Number(item.id), item.nombre]));
  const supportById = new Map((nivelesApoyo as DbNivelApoyo[]).map(item => [Number(item.id), item.nombre]));
  const autonomyById = new Map((autonomias as DbAutonomiaOperativa[]).map(item => [Number(item.id), item.nombre]));
  const activityById = new Map((actividades as DbActividad[]).map(item => [Number(item.id), item]));
  const activityStatusById = new Map((estadosActividades as DbEstadoActividad[]).map(item => [Number(item.id), item]));
  const pointById = new Map((puntosOtorgados as DbPuntoOtorgado[]).map(item => [Number(item.id), item]));

  const activeLinks = (vinculosTutor as DbVinculoTutorPerteneciente[])
    .filter(link => Number(link.id_tutor) === Number(tutor.id))
    .filter(link => !link.fecha_fin && (statusById.get(Number(link.id_estado_vinculo)) || '').toLowerCase() === 'activo');

  const linkedUsers = activeLinks
    .map(link => {
      const perteneciente = pertenecienteById.get(Number(link.id_perteneciente));
      const usuario = perteneciente ? usersById.get(Number(perteneciente.id_usuario)) : undefined;
      if (!perteneciente || !usuario) return null;

      const legacy = toLegacyUser(usuario) as User;
      const saldo = (saldos as DbSaldoPuntos[]).find(item => Number(item.id_perteneciente) === Number(perteneciente.id));
      const avatar = (avatares as DbAvatar[]).find(item => Number(item.id_perteneciente) === Number(perteneciente.id));

      return {
        ...legacy,
        points: saldo?.saldo ?? legacy.points,
        level: avatar?.nivel ?? legacy.level,
        streak: legacy.streak,
        pertenecienteId: Number(perteneciente.id),
        linkId: Number(link.id),
        linkStatus: statusById.get(Number(link.id_estado_vinculo)) || 'Sin estado',
        isPrimaryTutor: Boolean(link.es_tutor_principal),
        supportLevel: supportById.get(Number(perteneciente.id_nivel_apoyo)) || 'Sin registrar',
        autonomy: autonomyById.get(Number(perteneciente.id_autonomia_operativa)) || 'Sin registrar',
        canSelfManage: Boolean(perteneciente.puede_autogestionarse),
        observation: perteneciente.observacion_general || '',
      } as TutorHomeLinkedUser;
    })
    .filter((item): item is TutorHomeLinkedUser => Boolean(item))
    .sort((a, b) => Number(b.isPrimaryTutor) - Number(a.isPrimaryTutor) || a.name.localeCompare(b.name));

  const byUserId: TutorHomeData['byUserId'] = {};

  await Promise.all(linkedUsers.map(async linked => {
    const [assignedRows, customActivities] = await Promise.all([
      fetchAssignedActivitiesByPerteneciente(Number(linked.pertenecienteId)),
      fetchCustomActivitiesByPerteneciente(Number(linked.pertenecienteId)),
    ]);
    const customActivityById = new Map((customActivities as DbActividadPersonalizada[]).map(item => [Number(item.id), item]));
    const assignedForUser = assignedRows
      .sort((a, b) => String(b.fecha_asignacion || '').localeCompare(String(a.fecha_asignacion || '')))
      .map(item => {
        const base = item.id_actividad ? activityById.get(Number(item.id_actividad)) : undefined;
        const custom = item.id_actividad_personalizada ? customActivityById.get(Number(item.id_actividad_personalizada)) : undefined;
        const status = activityStatusById.get(Number(item.id_estado_actividad));
        const pointId = base?.id_punto_otorgado || custom?.id_punto_otorgado;
        const pointName = pointId ? pointById.get(Number(pointId))?.nombre : undefined;
        const pointsByName: Record<string, number> = { Bajo: 10, Medio: 20, Alto: 30, Bonus: 50 };

        return {
          id: String(item.id),
          title: base?.titulo || custom?.titulo || `Actividad #${item.id}`,
          description: base?.descripcion || custom?.descripcion || 'Actividad asignada desde el equipo de apoyo.',
          category: custom ? 'Personalizada' : 'Integrada',
          difficulty: 'Medio',
          points: pointName ? pointsByName[pointName] ?? 10 : 10,
          status: status?.nombre || (item.fecha_completada ? 'Completada' : 'Pendiente'),
          completed: isCompletedStatus(status, item),
          assignedAt: formatBackendDate(item.fecha_asignacion),
          completedAt: item.fecha_completada ? formatBackendDate(item.fecha_completada) : null,
        } satisfies TutorHomeActivity;
      });

    const safeZonesRows = await fetchSafeZonesByPerteneciente(Number(linked.pertenecienteId)).catch(() => []);
    const safeZones = safeZonesRows
      .filter(item => item.activa)
      .map(item => ({
        id: `zone-${item.id}`,
        name: item.nombre,
        address: `${Number(item.latitud).toFixed(5)}, ${Number(item.longitud).toFixed(5)} - radio ${item.radio_metro} m`,
        type: 'seguro' as const,
      }));

    byUserId[linked.id] = {
      activities: assignedForUser,
      emotions: await fetchEmotionRecordsForUser(linked.id).catch(() => []),
      events: await fetchCalendarEventsForUser(linked.id).catch(() => []),
      locations: [
        ...safeZones,
      ],
      notifications: (notificaciones as DbNotificacion[])
        .filter(item => Number(item.id_usuario_destino) === Number(linked.id))
        .map(toLegacyNotification),
      recommendations: [],
    };
  }));

  return {
    tutorId: Number(tutor.id),
    linkedUsers,
    byUserId,
  };
}

export async function fetchActivitiesForUser(userId: string): Promise<Activity[]> {
  if (!isBackendUserId(userId)) return legacy.getActivitiesForUser(userId);

  try {
    const numericUserId = Number(userId);
    const [pertenecientes, actividades, estados] = await Promise.all([
      tandemApi.pertenecientes.getAll(),
      tandemApi.actividades.getAll(),
      tandemApi.estadosActividades.getAll(),
    ]);
    const perteneciente = pertenecientes.find(item => Number(item.id_usuario) === numericUserId);
    if (!perteneciente) return [];

    const [asignadas, actividadesPersonalizadas] = await Promise.all([
      fetchAssignedActivitiesByPerteneciente(Number(perteneciente.id)),
      fetchCustomActivitiesByPerteneciente(Number(perteneciente.id)),
    ]);
    const activityById = new Map((actividades as DbActividad[]).map(item => [Number(item.id), item]));
    const customById = new Map((actividadesPersonalizadas as DbActividadPersonalizada[]).map(item => [Number(item.id), item]));
    const statusById = new Map((estados as DbEstadoActividad[]).map(item => [Number(item.id), item]));

    return asignadas
      .filter(item => Number(item.id_perteneciente) === Number(perteneciente.id))
      .sort((a, b) => String(b.fecha_asignacion || '').localeCompare(String(a.fecha_asignacion || '')))
      .map(item => {
        const activity = item.id_actividad
          ? activityById.get(Number(item.id_actividad))
          : item.id_actividad_personalizada
            ? customById.get(Number(item.id_actividad_personalizada))
            : undefined;
        return activity ? toAssignedLegacyActivity(item, activity, statusById.get(Number(item.id_estado_actividad)), userId) : null;
      })
      .filter((item): item is Activity => Boolean(item));
  } catch {
    return apiFetchWithFallback<Activity[]>([`/activities?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/activities`]);
  }
}

export async function completeAssignedActivity(activity: Activity, userId: string): Promise<void> {
  let assignedActivityId = Number((activity as any).assignedActivityId || activity.id);
  if (!Number.isFinite(assignedActivityId)) {
    const numericUserId = Number(userId);
    const backendCustomActivityId = Number((activity as any).backendCustomActivityId || (activity as any).backendId);
    const backendActivityId = Number((activity as any).backendActivityId);
    const pertenecientes = await tandemApi.pertenecientes.getAll();
    const perteneciente = pertenecientes.find(item => Number(item.id_usuario) === numericUserId);
    const asignadas = perteneciente ? await fetchAssignedActivitiesByPerteneciente(Number(perteneciente.id)) : [];
    const assignment = asignadas.find(item =>
      (
        (Number.isFinite(backendCustomActivityId) && Number(item.id_actividad_personalizada) === backendCustomActivityId) ||
        (Number.isFinite(backendActivityId) && Number(item.id_actividad) === backendActivityId)
      )
    );
    assignedActivityId = Number(assignment?.id);
  }
  if (!Number.isFinite(assignedActivityId)) return;

  const token = getStoredAuthToken();
  const [assignment, estados] = await Promise.all([
    tandemApi.actividadesAsignadas.getById(assignedActivityId, { token }),
    tandemApi.estadosActividades.getAll(),
  ]);
  const completedStatus = (estados as DbEstadoActividad[]).find(item =>
    item.nombre.toLowerCase().includes('complet')
  );

  await tandemApi.actividadesAsignadas.update(assignedActivityId, {
    ...assignment,
    id_estado_actividad: completedStatus?.id || 3,
    fecha_completada: new Date().toISOString(),
  }, { token });
}

export async function fetchMyNotifications(userId?: string): Promise<Notification[]> {
  if (userId && !isBackendUserId(userId)) return legacy.getNotificationsForUser(userId);

  try {
    const rows = await tandemApi.notificaciones.getMine();
    return rows.map(toLegacyNotification);
  } catch {
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const numericId = Number(notificationId);
  if (!Number.isFinite(numericId)) return;

  await tandemApi.notificaciones.markRead(numericId);
}

export async function markNotificationsAsRead(notificationIds: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(notificationIds));
  await Promise.all(uniqueIds.map(markNotificationAsRead));
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await tandemApi.notificaciones.markAllRead();
}

export async function fetchObjectivesForUser(userId: string): Promise<Objective[]> {
  return apiFetchWithFallback<Objective[]>([`/objectives?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/objectives`]);
}

export async function fetchCalendarEventsForUser(userId: string): Promise<CalendarEvent[]> {
  if (isBackendUserId(userId)) {
    const configs = await getUserCalendarConfigs(Number(userId));
    const events = configs.flatMap(config => {
      if (!config.valor) return [];
      try {
        const parsed = JSON.parse(config.valor);
        return config.clave === CALENDAR_CONFIG_KEY
          ? normalizeCalendarEventsPayload(parsed, userId)
          : normalizeCalendarEventsPayload([parsed], userId);
      } catch {
        return [];
      }
    });

    let professionalSessionEvents: CalendarEvent[] = [];
    try {
      const sessions = await fetchProfessionalSessions();
      professionalSessionEvents = sessions
        .filter(session => session.estado !== 'cancelada')
        .map(session => professionalSessionToCalendarEvent(session, userId));
    } catch {
      professionalSessionEvents = [];
    }

    return [...events, ...professionalSessionEvents]
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }

  return legacy.getEventsForUser(userId);
}

export async function createCalendarEvent(userId: string, data: Omit<CalendarEvent, 'id' | 'userId'>): Promise<CalendarEvent> {
  if (isBackendUserId(userId)) {
    const created: CalendarEvent = {
      ...data,
      color: data.color || calendarTypeColor(data.type),
      id: `ce-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
    };
    await saveCalendarEventForUser(userId, created);
    syncCalendarReminders(userId);
    return created;
  }

  return apiFetchWithFallback<CalendarEvent>([`/calendar/events`, `/users/${encodeURIComponent(userId)}/calendar/events`], { method: 'POST', body: JSON.stringify({ ...data, userId }) });
}

export async function updateCalendarEvent(eventId: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const config = await findCalendarConfigByEventId(eventId);
  if (config) {
    const userId = String(config.id_usuario);
    const parsed = JSON.parse(config.valor || (config.clave === CALENDAR_CONFIG_KEY ? '[]' : '{}'));
    const events = config.clave === CALENDAR_CONFIG_KEY
      ? normalizeCalendarEventsPayload(parsed, userId)
      : normalizeCalendarEventsPayload([parsed], userId);
    const previous = events.find(event => event.id === eventId);
    if (!previous) throw new Error(`No se encontro el evento ${eventId}.`);
    const updated = {
      ...previous,
      ...patch,
      color: patch.color || (patch.type ? calendarTypeColor(patch.type) : previous.color),
      id: previous.id,
      userId: previous.userId,
    };
    if (config.clave === CALENDAR_CONFIG_KEY) {
      await saveCalendarEventsForUser(userId, events.map(event => event.id === eventId ? updated : event));
    } else {
      await saveCalendarEventForUser(userId, updated, config);
    }
    syncCalendarReminders(userId);
    return updated;
  }

  return apiFetchWithFallback<CalendarEvent>([`/calendar/events/${encodeURIComponent(eventId)}`], { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const config = await findCalendarConfigByEventId(eventId);
  if (config) {
    const userId = String(config.id_usuario);
    if (config.clave === CALENDAR_CONFIG_KEY) {
      const events = normalizeCalendarEventsPayload(JSON.parse(config.valor || '[]'), userId);
      await saveCalendarEventsForUser(userId, events.filter(event => event.id !== eventId));
    } else {
      await tandemApi.configuracionesUsuarios.delete(config.id);
    }
    syncCalendarReminders(userId);
    return;
  }

  await apiFetchWithFallback<unknown>([`/calendar/events/${encodeURIComponent(eventId)}`], { method: 'DELETE' });
}

export async function fetchEmotionRecordsForUser(userId: string): Promise<EmotionalRecord[]> {
  if (isBackendUserId(userId)) {
    try {
      const idUsuario = Number(userId);
      const configs = await tandemApi.configuracionesUsuarios.getAll();

      return configs
        .filter((config) => config.id_usuario === idUsuario && config.clave.startsWith('emotion:'))
        .map(parseEmotionConfig)
        .filter((record): record is EmotionalRecord => Boolean(record))
        .sort((a, b) => `${b.date} ${b.timestamp}`.localeCompare(`${a.date} ${a.timestamp}`));
    } catch {
      return [];
    }
  }

  return legacy.getEmotionsForUser(userId);
}

export async function createEmotionRecord(userId: string, payload: Omit<EmotionalRecord, 'id' | 'userId'>): Promise<EmotionalRecord> {
  if (isBackendUserId(userId)) {
    const now = new Date();
    const record = {
      ...payload,
      timestamp: payload.timestamp || now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      date: payload.date || now.toISOString().split('T')[0],
    };
    const result = await tandemApi.configuracionesUsuarios.create({
      id_usuario: Number(userId),
      clave: `emotion:${now.toISOString()}`,
      valor: JSON.stringify(record),
      fecha_modificacion: now.toISOString(),
    });

    return {
      id: String(result.id || now.getTime()),
      userId,
      ...record,
    };
  }

  return apiFetchWithFallback<EmotionalRecord>([`/emotions`, `/users/${encodeURIComponent(userId)}/emotions`], { method: 'POST', body: JSON.stringify({ ...payload, userId }) });
}

export async function deleteEmotionRecord(recordId: string): Promise<void> {
  if (isBackendUserId(recordId)) {
    await tandemApi.configuracionesUsuarios.delete(recordId);
    return;
  }

  await apiFetchWithFallback<unknown>([`/emotions/${encodeURIComponent(recordId)}`], { method: 'DELETE' });
}

const CALENDAR_CONFIG_KEY = 'calendar.events';
const CALENDAR_EVENT_KEY_PREFIX = 'calendar.event:';

async function getUserConfig(userId: number, key: string): Promise<ConfiguracionUsuario | undefined> {
  try {
    return await apiRequest<ConfiguracionUsuario>(
      `/api/configuraciones-usuarios/usuario/${encodeURIComponent(String(userId))}/${encodeURIComponent(key)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

async function getUserCalendarConfigs(userId: number): Promise<ConfiguracionUsuario[]> {
  const rows = await apiRequest<ConfiguracionUsuario[]>(
    `/api/configuraciones-usuarios/usuario/${encodeURIComponent(String(userId))}`,
  );
  return rows.filter(row => row.clave === CALENDAR_CONFIG_KEY || row.clave.startsWith(CALENDAR_EVENT_KEY_PREFIX));
}

function normalizeCalendarEventsPayload(payload: unknown, userId: string): CalendarEvent[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item, index) => {
      const event = item as Partial<CalendarEvent>;
      const type = event.type || 'personal';
      const date = event.date || '';
      const time = event.time || '09:00';
      const title = event.title || '';

      if (!date || !title) return null;

      return {
        id: String(event.id || `ce-${Date.now()}-${index}`),
        userId: String(event.userId || userId),
        title: String(title),
        date: String(date),
        time: String(time),
        type,
        description: String(event.description || ''),
        color: String(event.color || calendarTypeColor(type)),
        reminders: Array.isArray(event.reminders) ? event.reminders.map(Number).filter(Number.isFinite) : [],
      } as CalendarEvent;
    })
    .filter((event): event is CalendarEvent => Boolean(event));
}

function calendarTypeColor(type: CalendarEvent['type']): string {
  const colors: Partial<Record<CalendarEvent['type'] | string, string>> = {
    terapia: 'hsl(270 40% 75%)',
    escuela: 'hsl(210 70% 55%)',
    personal: 'hsl(30 80% 60%)',
    médico: 'hsl(0 72% 55%)',
    medico: 'hsl(0 72% 55%)',
    'mÃ©dico': 'hsl(0 72% 55%)',
    social: 'hsl(150 60% 45%)',
    actividad: 'hsl(45 90% 55%)',
  };
  return colors[type] || colors.personal;
}

async function saveCalendarEventsForUser(userId: string, events: CalendarEvent[]): Promise<void> {
  const numericUserId = Number(userId);
  const payload = {
    id_usuario: numericUserId,
    clave: CALENDAR_CONFIG_KEY,
    valor: JSON.stringify(events),
    fecha_modificacion: new Date().toISOString(),
  };
  const config = await getUserConfig(numericUserId, CALENDAR_CONFIG_KEY);
  if (config?.id) {
    await tandemApi.configuracionesUsuarios.update(config.id, payload);
    return;
  }

  try {
    await tandemApi.configuracionesUsuarios.create(payload);
  } catch (error) {
    const latestConfig = await getUserConfig(numericUserId, CALENDAR_CONFIG_KEY);
    if (!latestConfig?.id) throw error;
    await tandemApi.configuracionesUsuarios.update(latestConfig.id, payload);
  }
}

async function findCalendarConfigByEventId(eventId: string): Promise<ConfiguracionUsuario | undefined> {
  const rows = await tandemApi.configuracionesUsuarios.getAll();
  return rows.find(row => {
    if ((!row.clave.startsWith(CALENDAR_EVENT_KEY_PREFIX) && row.clave !== CALENDAR_CONFIG_KEY) || !row.valor) return false;
    try {
      const parsed = JSON.parse(row.valor);
      const payload = row.clave === CALENDAR_CONFIG_KEY ? parsed : [parsed];
      return normalizeCalendarEventsPayload(payload, String(row.id_usuario))
        .some(event => event.id === eventId);
    } catch {
      return false;
    }
  });
}

async function saveCalendarEventForUser(userId: string, event: CalendarEvent, existingConfig?: ConfiguracionUsuario): Promise<void> {
  const numericUserId = Number(userId);
  const payload = {
    id_usuario: numericUserId,
    clave: `${CALENDAR_EVENT_KEY_PREFIX}${event.id}`,
    valor: JSON.stringify(event),
    fecha_modificacion: new Date().toISOString(),
  };

  if (existingConfig?.id) {
    await tandemApi.configuracionesUsuarios.update(existingConfig.id, payload);
    return;
  }

  await tandemApi.configuracionesUsuarios.create(payload);
}

async function syncCalendarReminders(userId: string): Promise<void> {
  try {
    const events = await fetchCalendarEventsForUser(userId);
    await apiRequest('/api/routine-reminders/calendar/sync', {
      method: 'PUT',
      body: {
        userId: Number(userId),
        events,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });
  } catch (error) {
    console.error('Error syncing calendar reminders:', error);
  }
}

export interface DayRoutine { id: string; name: string; dayOfWeek: number | null; items: RoutineItem[]; date?: string }
const ROUTINES_CONFIG_KEY = 'routines.mi-dia';

function normalizeRoutinesPayload(payload: unknown): DayRoutine[] {
  if (!Array.isArray(payload)) return [];
  return payload.map((routine, index) => {
    const r = routine as Partial<DayRoutine>;
    return {
      id: String(r.id || `dr-${Date.now()}-${index}`),
      name: String(r.name || 'Mi dÃ­a'),
      dayOfWeek: typeof r.dayOfWeek === 'number' ? r.dayOfWeek : null,
      date: typeof r.date === 'string' ? r.date : undefined,
      items: Array.isArray(r.items)
        ? r.items.map((item, itemIndex) => {
            const it = item as Partial<RoutineItem>;
            return {
              id: String(it.id || `i-${Date.now()}-${index}-${itemIndex}`),
              time: String(it.time || '08:00'),
              title: String(it.title || ''),
              icon: String(it.icon || 'â­'),
              completed: Boolean(it.completed),
              reminders: Array.isArray(it.reminders) ? it.reminders.map(Number).filter(Number.isFinite) : [],
              category: String(it.category || 'maÃ±ana'),
            };
          })
        : [],
    };
  });
}

export async function fetchRoutinesForUser(userId: string): Promise<DayRoutine[]> {
  if (!isBackendUserId(userId)) return [];

  try {
    const numericUserId = Number(userId);
    const config = await getUserConfig(numericUserId, ROUTINES_CONFIG_KEY);
    if (!config?.valor) return [];
    return normalizeRoutinesPayload(JSON.parse(config.valor));
  } catch {
    return [];
  }
}

export async function saveRoutinesForUser(userId: string, routines: DayRoutine[]): Promise<DayRoutine[]> {
  if (!isBackendUserId(userId)) return routines;

  try {
    const numericUserId = Number(userId);
    const payload = {
      id_usuario: numericUserId,
      clave: ROUTINES_CONFIG_KEY,
      valor: JSON.stringify(routines),
      fecha_modificacion: new Date().toISOString(),
    };
    const config = await getUserConfig(numericUserId, ROUTINES_CONFIG_KEY);
    if (config?.id) await tandemApi.configuracionesUsuarios.update(config.id, payload);
    else await tandemApi.configuracionesUsuarios.create(payload);
    await apiRequest('/api/routine-reminders/sync', {
      method: 'PUT',
      body: { routines, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    });
    return routines;
  } catch (error) {
    throw error instanceof Error ? error : new Error('No se pudieron guardar las rutinas.');
  }
}

const CATEGORIES_CONFIG_KEY = 'routines.mi-dia.categories';

export async function fetchCustomCategoriesForUser(userId: string): Promise<{ customCategories: CustomCategory[]; hiddenPredefined: string[] }> {
  if (!isBackendUserId(userId)) return { customCategories: [], hiddenPredefined: [] };

  try {
    const numericUserId = Number(userId);
    const config = await getUserConfig(numericUserId, CATEGORIES_CONFIG_KEY);
    if (!config?.valor) return { customCategories: [], hiddenPredefined: [] };
    const parsed = JSON.parse(config.valor);
    // legacy: plain array of categories
    if (Array.isArray(parsed)) {
      return {
        customCategories: parsed.map((c: Partial<CustomCategory>) => ({
          id: String(c.id || `cc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`),
          name: String(c.name || 'Nueva sección'),
          icon: String(c.icon || '📋'),
        })),
        hiddenPredefined: [],
      };
    }
    // new: wrapped object
    if (typeof parsed === 'object' && parsed !== null) {
      const cats = Array.isArray(parsed.customCategories) ? parsed.customCategories : [];
      const hidden = Array.isArray(parsed.hiddenPredefined) ? parsed.hiddenPredefined : [];
      return {
        customCategories: cats.map((c: Partial<CustomCategory>) => ({
          id: String(c.id || `cc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`),
          name: String(c.name || 'Nueva sección'),
          icon: String(c.icon || '📋'),
        })),
        hiddenPredefined: hidden,
      };
    }
    return { customCategories: [], hiddenPredefined: [] };
  } catch {
    return { customCategories: [], hiddenPredefined: [] };
  }
}

export async function saveCustomCategoriesForUser(
  userId: string,
  customCategories: CustomCategory[],
  hiddenPredefined: string[],
): Promise<void> {
  if (!isBackendUserId(userId)) return;

  try {
    const numericUserId = Number(userId);
    const value = JSON.stringify({ customCategories, hiddenPredefined });
    const payload = {
      id_usuario: numericUserId,
      clave: CATEGORIES_CONFIG_KEY,
      valor: value,
      fecha_modificacion: new Date().toISOString(),
    };
    const config = await getUserConfig(numericUserId, CATEGORIES_CONFIG_KEY);
    if (config?.id) await tandemApi.configuracionesUsuarios.update(config.id, payload);
    else await tandemApi.configuracionesUsuarios.create(payload);
  } catch {
    // silent
  }
}

type BackendChatRow = DbChat & {
  avatar_url?: string | null;
  avatar_content_type?: string | null;
  avatar_actualizada_en?: string | null;
  id_otro_usuario?: number | null;
  nombre_otro_usuario?: string | null;
  apellido_otro_usuario?: string | null;
  ultimo_mensaje_contenido?: string | null;
  ultimo_mensaje_fecha?: string | null;
  cantidad_no_leidos?: number | null;
  cantidad_participantes?: number | null;
  participantes?: {
    id_usuario: number;
    nombre?: string | null;
    apellido?: string | null;
    id_tipo_usuario?: number | null;
    es_admin?: boolean | null;
  }[] | null;
};

function backendChatToConversation(chat: BackendChatRow, currentUserId: string): Conversation {
  const participants = Array.isArray(chat.participantes) ? chat.participantes : [];
  const participantIds = participants.length > 0
    ? participants.map((participant) => String(participant.id_usuario))
    : [currentUserId, chat.id_otro_usuario ? String(chat.id_otro_usuario) : `chat-${chat.id}`];
  const participantNames = participants.length > 0
    ? participants.map((participant) => [participant.nombre, participant.apellido].filter(Boolean).join(' ') || `Usuario #${participant.id_usuario}`)
    : ['Yo', [chat.nombre_otro_usuario, chat.apellido_otro_usuario].filter(Boolean).join(' ') || chat.nombre || 'Chat'];
  const adminIds = participants
    .filter((participant) => participant.es_admin)
    .map((participant) => String(participant.id_usuario));
  const isGroup = (chat.cantidad_participantes || participantIds.length) > 2;
  const otherParticipant = participants.find((participant) => String(participant.id_usuario) !== String(currentUserId));
  const directType: Conversation['type'] = otherParticipant?.id_tipo_usuario === 3 ? 'profesional' : 'tutor';

  return {
    id: String(chat.id),
    title: isGroup ? chat.nombre || 'Grupo' : undefined,
    description: chat.descripcion || undefined,
    participants: participantIds,
    participantNames,
    adminIds,
    lastMessage: chat.ultimo_mensaje_contenido || 'Sin mensajes todavía',
    lastMessageTime: formatChatTime(chat.ultimo_mensaje_fecha || chat.fecha_creacion),
    unreadCount: chat.cantidad_no_leidos || 0,
    avatar: isGroup ? chat.avatar_url || 'G' : '💬',
    type: isGroup ? 'grupo' : directType,
  };
}

function isImageAttachment(archivo: { url?: string; content_type?: string | null }) {
  return Boolean(
    archivo.content_type?.startsWith('image/') ||
    archivo.url?.match(/\.(png|jpe?g|gif|webp)(\?|$)/i)
  );
}

function backendMessageToChatMessage(message: DbMensaje & { archivos?: { id: number; url: string; nombre_archivo: string; content_type?: string | null; peso_bytes?: number | null }[] }): ChatMessage {
  const fileData = (message as any).archivos;
  const hasArchivos = Array.isArray(fileData) && fileData.length > 0;
  const isImage = hasArchivos && fileData.some(isImageAttachment);
  return {
    id: String(message.id),
    conversationId: String(message.id_chat),
    senderId: String(message.id_usuario_emisor),
    senderName: '',
    text: message.contenido || '',
    timestamp: formatChatTime(message.fecha_envio),
    read: true,
    type: hasArchivos ? (isImage ? 'image' : 'file') : 'text',
    archivos: hasArchivos ? fileData.map((a: { id: number; url: string; nombre_archivo: string; content_type?: string | null; peso_bytes?: number | null }) => ({ id: a.id, url: a.url, nombre_archivo: a.nombre_archivo, content_type: a.content_type || undefined, peso_bytes: a.peso_bytes || undefined })) : undefined,
    editedAt: (message as any).fecha_edicion || undefined,
    deletedAt: (message as any).fecha_eliminacion || undefined,
  };
}

export async function fetchConversationsForUser(userId: string): Promise<Conversation[]> {
  if (!isBackendUserId(userId)) return legacy.getConversationsForUser(userId);

  const token = getStoredAuthToken();
  if (token && isBackendUserId(userId)) {
    const chats = await apiRequest<BackendChatRow[]>(`/api/chats/usuario/${encodeURIComponent(userId)}`, { token });
    return chats.map((chat) => backendChatToConversation(chat, userId));
  }

  return apiFetchWithFallback<Conversation[]>([`/chat/conversations?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/conversations`]);
}

export async function fetchMyConversationsForUser(userId: string): Promise<Conversation[]> {
  const token = getStoredAuthToken();
  if (token && isBackendUserId(userId)) {
    const chats = await apiRequest<BackendChatRow[]>('/api/chats/me', { token }).catch(() => (
      apiRequest<BackendChatRow[]>(`/api/chats/usuario/${encodeURIComponent(userId)}`, { token })
    ));
    return chats.map((chat) => backendChatToConversation(chat, userId));
  }

  return fetchConversationsForUser(userId);
}

export async function syncMyConversationsForUser(userId: string, since?: string | null): Promise<{ serverTime: string; conversations: Conversation[]; fullSync: boolean }> {
  const token = getStoredAuthToken();
  if (token && isBackendUserId(userId)) {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    let fullSync = !since;
    const response = await apiRequest<{ serverTime: string; chats: BackendChatRow[] }>(`/api/chats/sync${query}`, { token }).catch(async () => {
      fullSync = true;
      return {
        serverTime: new Date().toISOString(),
        chats: await apiRequest<BackendChatRow[]>('/api/chats/me', { token }).catch(() => (
        apiRequest<BackendChatRow[]>(`/api/chats/usuario/${encodeURIComponent(userId)}`, { token })
        )),
      };
    });
    return {
      serverTime: response.serverTime,
      conversations: response.chats.map((chat) => backendChatToConversation(chat, userId)),
      fullSync,
    };
  }

  return {
    serverTime: new Date().toISOString(),
    conversations: await fetchConversationsForUser(userId),
    fullSync: true,
  };
}

export async function fetchMessagesForConversation(conversationId: string): Promise<ChatMessage[]> {
  const token = getStoredAuthToken();
  if (token && isBackendUserId(conversationId)) {
    const messages = await apiRequest<DbMensaje[]>(`/api/mensajes/chat/${encodeURIComponent(conversationId)}`, { token });
    return messages.map(backendMessageToChatMessage).reverse();
  }

  return apiFetchWithFallback<ChatMessage[]>([`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, `/conversations/${encodeURIComponent(conversationId)}/messages`]);
}

export async function fetchMessagesAfterConversation(conversationId: string, afterId: string, limit = 100): Promise<ChatMessage[]> {
  const token = getStoredAuthToken();
  if (token && isBackendUserId(conversationId) && isBackendUserId(afterId)) {
    const messages = await apiRequest<DbMensaje[]>(`/api/mensajes/chat/${encodeURIComponent(conversationId)}?afterId=${encodeURIComponent(afterId)}&limit=${encodeURIComponent(String(limit))}`, { token });
    return messages.map(backendMessageToChatMessage);
  }

  return [];
}

export async function fetchMessagesForConversationAsUser(conversationId: string, userId: string): Promise<ChatMessage[]> {
  const token = getStoredAuthToken();
  if (token && isBackendUserId(conversationId) && isBackendUserId(userId)) {
    const messages = await apiRequest<DbMensaje[]>(`/api/mensajes/chat/${encodeURIComponent(conversationId)}/usuario/${encodeURIComponent(userId)}`, { token });
    return messages.map(backendMessageToChatMessage).reverse();
  }

  return fetchMessagesForConversation(conversationId);
}

export async function sendMessage(conversationId: string, senderId: string, senderName: string, text: string, idArchivos?: number[]): Promise<ChatMessage> {
  const token = getStoredAuthToken();
  if (token && isBackendUserId(conversationId)) {
    const idTipoMensaje = idArchivos && idArchivos.length > 0 ? 2 : 1;
    const body: Record<string, unknown> = {
      id_tipo_mensaje: idTipoMensaje,
      contenido: text || '',
    };
    if (idArchivos && idArchivos.length > 0) {
      body.id_archivos = idArchivos;
    }
    const message = await apiRequest<DbMensaje>(`/api/mensajes/chat/${encodeURIComponent(conversationId)}`, {
      method: 'POST',
      token,
      body,
    });
    const chatMessage = backendMessageToChatMessage(message);
    return chatMessage;
  }

  return apiFetchWithFallback<ChatMessage>([`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, `/conversations/${encodeURIComponent(conversationId)}/messages`], {
    method: 'POST', body: JSON.stringify({ senderId, senderName, text, type: 'text' }),
  });
}

export async function updateMessage(messageId: string, text: string): Promise<void> {
  const token = getStoredAuthToken();
  if (!token || !isBackendUserId(messageId)) {
    throw new Error('No hay sesión backend activa para editar el mensaje.');
  }

  await apiRequest(`/api/mensajes/${encodeURIComponent(messageId)}`, {
    method: 'PUT',
    token,
    body: {
      contenido: text,
    },
  });
}

export async function deleteMessage(messageId: string): Promise<void> {
  const token = getStoredAuthToken();
  if (!token || !isBackendUserId(messageId)) {
    throw new Error('No hay sesión backend activa para eliminar el mensaje.');
  }

  await apiRequest(`/api/mensajes/${encodeURIComponent(messageId)}`, {
    method: 'DELETE',
    token,
  });
}

export async function markConversationRead(conversationId: string, messageId?: string): Promise<void> {
  const token = getStoredAuthToken();
  if (!token || !isBackendUserId(conversationId)) return;

  await apiRequest(`/api/participantes-chats/leer/${encodeURIComponent(conversationId)}`, {
    method: 'PUT',
    token,
    body: messageId && isBackendUserId(messageId) ? { id_mensaje: Number(messageId) } : {},
  });
}

export async function createDirectConversationWith(selfId: string, otherUserId: string): Promise<Conversation> {
  const token = getStoredAuthToken();
  if (!token || !isBackendUserId(otherUserId)) {
    throw new Error('No hay sesión backend activa para crear el chat.');
  }

  const chat = await apiRequest<BackendChatRow>('/api/chats/direct', {
    method: 'POST',
    token,
    body: {
      id_usuario_destino: Number(otherUserId),
      id_tipo_chat: 1,
    },
  });

  return backendChatToConversation({ ...chat, id_otro_usuario: Number(otherUserId) }, selfId);
}

export async function createGroupConversation(
  selfId: string,
  payload: { nombre: string; descripcion?: string; participantIds: string[] },
): Promise<Conversation> {
  const token = getStoredAuthToken();
  if (!token) {
    throw new Error('No hay sesión backend activa para crear el grupo.');
  }

  const response = await apiRequest<{ chat: BackendChatRow; participantes?: { id_usuario: number; es_admin?: boolean | null }[] }>('/api/chats/group', {
    method: 'POST',
    token,
    body: {
      nombre: payload.nombre,
      descripcion: payload.descripcion || null,
      participantes: payload.participantIds.map(Number).filter(Number.isFinite),
    },
  });

  const participantes = response.participantes?.map((participant) => ({ id_usuario: participant.id_usuario, es_admin: participant.es_admin })) || [];
  return backendChatToConversation({
    ...response.chat,
    participantes,
    cantidad_participantes: participantes.length,
  }, selfId);
}

export async function updateConversationDetails(
  conversationId: string,
  payload: { nombre?: string; descripcion?: string; participantIds?: string[]; adminIds?: string[] },
): Promise<Conversation> {
  const token = getStoredAuthToken();
  if (!token || !isBackendUserId(conversationId)) {
    throw new Error('No hay sesión backend activa para administrar el chat.');
  }

  const response = await apiRequest<{ chat: BackendChatRow; participantes?: { id_usuario: number; es_admin?: boolean | null }[] }>(`/api/chats/${encodeURIComponent(conversationId)}/manage`, {
    method: 'PATCH',
    token,
    body: {
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      participantes: payload.participantIds?.map(Number).filter(Number.isFinite),
      administradores: payload.adminIds?.map(Number).filter(Number.isFinite),
    },
  });

  const participantes = response.participantes?.map((participant) => ({ id_usuario: participant.id_usuario, es_admin: participant.es_admin })) || [];
  return backendChatToConversation({
    ...response.chat,
    participantes,
    cantidad_participantes: participantes.length,
  }, '');
}

export async function uploadChatAvatar(
  conversationId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Conversation> {
  const token = getStoredAuthToken();
  if (!token || !isBackendUserId(conversationId)) {
    throw new Error('No hay sesión backend activa para cambiar la foto del chat.');
  }

  const { apiUploadFile } = await import('@/services/api/client');
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiUploadFile<{ chat: BackendChatRow; participantes?: { id_usuario: number; es_admin?: boolean | null }[] }>(
    `/api/chats/${encodeURIComponent(conversationId)}/avatar`,
    formData,
    onProgress,
  );

  const participantes = response.participantes?.map((participant) => ({ id_usuario: participant.id_usuario, es_admin: participant.es_admin })) || [];
  return backendChatToConversation({
    ...response.chat,
    participantes,
    cantidad_participantes: participantes.length,
  }, '');
}

export async function hideConversationForMe(conversationId: string): Promise<void> {
  const token = getStoredAuthToken();
  if (!token || !isBackendUserId(conversationId)) {
    throw new Error('No hay sesión backend activa para eliminar el chat.');
  }

  await apiRequest(`/api/chats/${encodeURIComponent(conversationId)}/me`, {
    method: 'DELETE',
    token,
  });
}

export async function fetchChatContacts(): Promise<ChatContact[]> {
  const [usuarios, pertenecientes, avatares] = await Promise.all([
    tandemApi.usuarios.getAll(),
    tandemApi.pertenecientes.getAll(),
    tandemApi.avatares.getAll(),
  ]);
  const avatarByUsuarioId = new Map<number, string>();
  for (const a of avatares as DbAvatar[]) {
    const pp = (pertenecientes as DbPerteneciente[]).find(p => Number(p.id) === Number(a.id_perteneciente));
    if (pp) {
      const url = a.avatar_imagen_url || a.avatar_imagen_origen_url;
      if (url) avatarByUsuarioId.set(Number(pp.id_usuario), url);
    }
  }
  return (usuarios as Usuario[]).map((usuario) => {
    const role = backendRoleToLegacyRole(usuario.id_tipo_usuario);
    return {
      id: String(usuario.id),
      name: [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.nombre_usuario || usuario.correo || `Usuario #${usuario.id}`,
      avatar: avatarByUsuarioId.get(usuario.id) || (role === 'professional' ? '👩‍⚕️' : role === 'tutor' ? '👩' : '🙂'),
      role: role === 'professional' ? 'profesional' : role === 'tutor' ? 'tutor' : 'user',
      subtitle: `${role === 'professional' ? 'Profesional' : role === 'tutor' ? 'Tutor/a' : 'Usuario'} · @${usuario.nombre_usuario || usuario.correo || usuario.id} · ID ${usuario.id}`,
    };
  });
}

export async function fetchAllUsers(): Promise<User[]> {
  const usuarios = await tandemApi.usuarios.getAll();
  return usuarios.map(toLegacyUser).filter((user): user is User => user.role === 'user');
}

export async function fetchAllTutors(): Promise<Tutor[]> {
  const [usuarios, tutoresBackend] = await Promise.all([
    tandemApi.usuarios.getAll(),
    tandemApi.tutores.getAll(),
  ]);
  const usuarioById = new Map(usuarios.map((user) => [user.id, user]));

  return tutoresBackend.map((tutor) => {
    const legacyUser = toLegacyUser(usuarioById.get(tutor.id_usuario) || { id: tutor.id_usuario, id_tipo_usuario: 2 });
    return {
      ...(legacyUser as Tutor),
      id: String(tutor.id),
      relation: tutor.parentesco || '',
    };
  });
}

export async function fetchAllProfessionals(): Promise<Professional[]> {
  const [usuarios, profesionalesBackend] = await Promise.all([
    tandemApi.usuarios.getAll(),
    tandemApi.profesionales.getAll(),
  ]);
  const usuarioById = new Map(usuarios.map((user) => [user.id, user]));

  return profesionalesBackend.map((professional) => {
    const legacyUser = toLegacyUser(usuarioById.get(professional.id_usuario) || { id: professional.id_usuario, id_tipo_usuario: 3 });
    return {
      ...(legacyUser as Professional),
      id: String(professional.id),
      specialty: professional.especialidad || professional.profesion || '',
      description: professional.institucion || '',
    };
  });
}

export async function fetchLinkedPertenecientesForSupportUser(
  userId: string,
  role: 'professional' | 'tutor',
): Promise<User[]> {
  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId)) return [];

  const [
    usuarios,
    pertenecientes,
    saldos,
    avatares,
  ] = await Promise.all([
    tandemApi.usuarios.getAll(),
    tandemApi.pertenecientes.getAll(),
    tandemApi.saldosPuntos.getAll().catch(() => []),
    tandemApi.avatares.getAll().catch(() => []),
  ]);

  const usuariosById = new Map((usuarios as Usuario[]).map((item) => [Number(item.id), item]));
  const pertenecientesById = new Map((pertenecientes as DbPerteneciente[]).map((item) => [Number(item.id), item]));

  let linkedPertenecienteIds: number[] = [];

  if (role === 'professional') {
    const [profesionalesBackend, vinculos] = await Promise.all([
      tandemApi.profesionales.getAll(),
      tandemApi.vinculosProfesionalesPertenecientes.getAll(),
    ]);
    const profesional = (profesionalesBackend as DbProfesional[]).find((item) => Number(item.id_usuario) === numericUserId);
    if (!profesional) return [];
    linkedPertenecienteIds = (vinculos as DbVinculoProfesionalPerteneciente[])
      .filter((link) => Number(link.id_profesional) === Number(profesional.id))
      .filter((link) => Number(link.id_estado_vinculo) !== 3)
      .map((link) => Number(link.id_perteneciente));
  } else {
    const [tutoresBackend, vinculos] = await Promise.all([
      tandemApi.tutores.getAll(),
      tandemApi.vinculosTutorPertenecientes.getAll(),
    ]);
    const tutor = (tutoresBackend as DbTutor[]).find((item) => Number(item.id_usuario) === numericUserId);
    if (!tutor) return [];
    linkedPertenecienteIds = (vinculos as DbVinculoTutorPerteneciente[])
      .filter((link) => Number(link.id_tutor) === Number(tutor.id))
      .filter((link) => Number(link.id_estado_vinculo) !== 3)
      .map((link) => Number(link.id_perteneciente));
  }

  return Array.from(new Set(linkedPertenecienteIds))
    .map((id) => pertenecientesById.get(id))
    .filter((item): item is DbPerteneciente => Boolean(item))
    .map((perteneciente) => {
      const usuario = usuariosById.get(Number(perteneciente.id_usuario));
      if (!usuario) return null;
      const saldo = (saldos as DbSaldoPuntos[]).find((item) => Number(item.id_perteneciente) === Number(perteneciente.id));
      const avatar = (avatares as DbAvatar[]).find((item) => Number(item.id_perteneciente) === Number(perteneciente.id));
      return enrichPertenecienteUser(usuario, perteneciente, saldo?.saldo ?? 0, avatar?.nivel ?? 1);
    })
    .filter((item): item is User => Boolean(item));
}

export async function fetchAchievementsForUser(userId: string): Promise<Achievement[]> {
  if (isBackendUserId(userId)) {
    return (await fetchBackendAchievementDashboard(userId)).achievements;
  }

  return apiFetchWithFallback<Achievement[]>([`/achievements?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/achievements`]);
}

export async function fetchAchievementDashboardForUser(userId: string): Promise<AchievementDashboard> {
  if (isBackendUserId(userId)) {
    return fetchBackendAchievementDashboard(userId);
  }

  const achievements = await fetchAchievementsForUser(userId);
  return {
    achievements,
    stats: {
      points: achievements.filter((item) => item.unlocked).reduce((sum, item) => sum + item.points, 0),
      level: 1,
      completedActivities: 0,
      assignedActivities: 0,
      emotionDays: 0,
      avatarExperience: 0,
    },
  };
}

export async function fetchResourcesForUser(userId: string): Promise<Resource[]> {
  return apiFetchWithFallback<Resource[]>([`/resources?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/resources`]);
}

export interface PictogramCategory {
  id: string;
  name: string;
  total: number;
}

export async function fetchPictograms(query?: { category?: string; search?: string; language?: string; limit?: number; targetPertenecienteId?: string }): Promise<Pictogram[]> {
  const params = new URLSearchParams();
  if (query?.category && query.category !== 'todas') params.set('category', query.category);
  if (query?.search) params.set('search', query.search);
  if (query?.language) params.set('language', query.language);
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.targetPertenecienteId) params.set('targetPertenecienteId', query.targetPertenecienteId);
  const q = params.toString();
  return apiFetchWithFallback<Pictogram[]>([q ? `/api/pictograms?${q}` : '/api/pictograms', q ? `/pictograms?${q}` : '/pictograms']);
}

export async function fetchPictogramCategories(): Promise<PictogramCategory[]> {
  return apiFetchWithFallback<PictogramCategory[]>(['/api/pictograms/categories', '/pictograms/categories']);
}

export async function fetchFavoritePictograms(userId: string): Promise<Pictogram[]> {
  const q = new URLSearchParams({ userId }).toString();
  return apiRequest<Pictogram[]>(`/api/pictograms/favorites?${q}`);
}

export function getPictogramDownloadUrl(id: string): string {
  return `${API_BASE_URL.replace(/\/$/, '')}/api/pictograms/${encodeURIComponent(id)}/download`;
}

export async function savePictogram(id: string, userId: string): Promise<void> {
  await apiRequest(`/api/pictograms/${encodeURIComponent(id)}/save`, {
    method: 'POST',
    body: { userId },
  });
}

export async function deleteFavoritePictogram(id: string, userId: string): Promise<void> {
  const q = new URLSearchParams({ userId }).toString();
  await apiRequest(`/api/pictograms/${encodeURIComponent(id)}/save?${q}`, { method: 'DELETE' });
}

export async function fetchTutorById(id: string): Promise<Tutor | null> {
  try { return await apiFetchWithFallback<Tutor>([`/tutors/${encodeURIComponent(id)}`]); } catch { return null; }
}

export async function fetchProfessionalById(id: string): Promise<Professional | null> {
  try { return await apiFetchWithFallback<Professional>([`/professionals/${encodeURIComponent(id)}`]); } catch { return null; }
}

export async function fetchProfessionalSessions(idPerteneciente?: number): Promise<ProfessionalSession[]> {
  const query = idPerteneciente ? `?id_perteneciente=${encodeURIComponent(String(idPerteneciente))}` : '';
  return apiRequest<ProfessionalSession[]>(`/api/sesiones-profesionales${query}`, { token: getStoredAuthToken() });
}

export async function createProfessionalSession(payload: Omit<ProfessionalSession, 'id' | 'id_profesional'>): Promise<{ id: number }> {
  return apiRequest('/api/sesiones-profesionales', { method: 'POST', token: getStoredAuthToken(), body: payload });
}

export async function updateProfessionalSession(id: number, payload: Partial<ProfessionalSession>): Promise<{ rowsAffected: number }> {
  return apiRequest(`/api/sesiones-profesionales/${id}`, { method: 'PUT', token: getStoredAuthToken(), body: payload });
}

export async function deleteProfessionalSession(id: number): Promise<void> {
  await apiRequest(`/api/sesiones-profesionales/${id}`, { method: 'DELETE', token: getStoredAuthToken() });
}

export interface ResizeSessionSeriesResult {
  sessions: ProfessionalSession[];
  deletedSessionIds: number[];
  deletedNotesCount: number;
  completedSessionIds: number[];
}

export async function resizeSessionSeries(groupId: string, payload: { titulo?: string; count?: number; markPastAsCompleted?: boolean }): Promise<ResizeSessionSeriesResult> {
  return apiRequest(`/api/sesiones-profesionales/series/${encodeURIComponent(groupId)}`, {
    method: 'PUT', token: getStoredAuthToken(), body: payload,
  });
}

export async function fetchPrivateProfessionalNote(idSession: number): Promise<PrivateProfessionalNote | null> {
  try {
    return await apiRequest(`/api/sesiones-profesionales/${idSession}/private-note`, { token: getStoredAuthToken() });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function linkPrivateNoteDriveDocument(idSession: number, document: { google_file_id: string; nombre: string }): Promise<NonNullable<PrivateProfessionalNote['documento_drive']>> {
  return apiRequest(`/api/sesiones-profesionales/${idSession}/private-note/drive`, {
    method: 'PUT', token: getStoredAuthToken(), body: document,
  });
}

export async function unlinkPrivateNoteDriveDocument(idSession: number): Promise<void> {
  await apiRequest(`/api/sesiones-profesionales/${idSession}/private-note/drive`, { method: 'DELETE', token: getStoredAuthToken() });
}

export async function fetchProfessionalOwnProfile(): Promise<ProfessionalOwnProfile> {
  return apiRequest('/api/perfiles-profesionales/mine', { token: getStoredAuthToken() });
}

export async function fetchNoteTemplateFavorites(): Promise<string[]> {
  return apiRequest('/api/note-template-favorites', { token: getStoredAuthToken() });
}

export async function saveNoteTemplateFavorite(templateId: string): Promise<void> {
  await apiRequest(`/api/note-template-favorites/${encodeURIComponent(templateId)}`, {
    method: 'POST', token: getStoredAuthToken(),
  });
}

export async function deleteNoteTemplateFavorite(templateId: string): Promise<void> {
  await apiRequest(`/api/note-template-favorites/${encodeURIComponent(templateId)}`, {
    method: 'DELETE', token: getStoredAuthToken(),
  });
}

export async function saveProfessionalOwnProfile(payload: Record<string, unknown>): Promise<ProfessionalOwnProfile> {
  return apiRequest('/api/perfiles-profesionales/mine', { method: 'PUT', token: getStoredAuthToken(), body: payload });
}

export async function fetchProfessionalDirectory(): Promise<ProfessionalPublicProfile[]> {
  return apiRequest('/api/perfiles-profesionales/directory', { token: getStoredAuthToken() });
}

export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  try {
    const plans = await tandemApi.planesSuscripciones.getAll();
    return plans.map(toPricingPlan);
  } catch {
    return apiFetchWithFallback<PricingPlan[]>(['/pricing/plans', '/plans/pricing']);
  }
}

export async function fetchUserProfileDashboard(userId: string): Promise<UserProfileDashboard> {
  if (isBackendUserId(userId)) {
    return fetchBackendUserProfileDashboard(userId);
  }

  const plans = await fetchPricingPlans().catch(() => []);
  return {
    usuario: null,
    perteneciente: null,
    supportLevel: 'Sin registrar',
    autonomy: 'Sin registrar',
    canSelfManage: false,
    observation: '',
    points: 0,
    level: 1,
    experience: 0,
    tutors: [],
    professionals: [],
    plans,
  };
}

const PROFILE_PREFERENCES_KEY = 'profile.preferences';
const PROFILE_ACCESSIBILITY_KEY = 'profile.accessibility';
const ACCESSIBILITY_SETTINGS_KEY = 'accessibility.settings';

const defaultProfilePreferences: UserProfileSettings['preferences'] = {
  recibir_notificaciones: true,
  recordatorios_actividad: true,
  resumen_semanal: false,
  compartir_ubicacion: false,
  permitir_mensajes: true,
  mostrar_progreso_red_apoyo: true,
};

const defaultProfileAccessibility: UserProfileSettings['accessibility'] = {
  tamanio_texto: 'normal',
  contraste_alto: false,
  reducir_movimiento: false,
  pictogramas_grandes: false,
};

function parseJsonConfig<T extends object>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

async function upsertUserConfig(userId: number, key: string, value: unknown): Promise<void> {
  const now = new Date().toISOString();
  const payload = {
    id_usuario: userId,
    clave: key,
    valor: JSON.stringify(value),
    fecha_modificacion: now,
  };
  const config = await getUserConfig(userId, key);
  if (config?.id) await tandemApi.configuracionesUsuarios.update(config.id, payload);
  else await tandemApi.configuracionesUsuarios.create(payload);
}

async function getAccessibilityConfig(userId: number, key: string) {
  const rows = await tandemApi.configuracionesAccesibilidad.getAll();
  return rows.find(row => row.id_usuario === userId && row.clave === key);
}

async function upsertAccessibilityConfig(userId: number, key: string, value: unknown): Promise<void> {
  const now = new Date().toISOString();
  const payload = {
    id_usuario: userId,
    clave: key,
    valor: JSON.stringify(value),
    fecha_modificacion: now,
  };
  const config = await getAccessibilityConfig(userId, key);
  if (config?.id) await tandemApi.configuracionesAccesibilidad.update(config.id, payload);
  else await tandemApi.configuracionesAccesibilidad.create(payload);
}

export async function fetchUserProfileSettings(userId: string): Promise<UserProfileSettings> {
  if (!isBackendUserId(userId)) {
    return {
      usuario: null,
      perteneciente: null,
      supportLevels: [],
      autonomies: [],
      preferences: defaultProfilePreferences,
      accessibility: defaultProfileAccessibility,
    };
  }

  const idUsuario = Number(userId);
  const [
    usuario,
    perteneciente,
    supportLevels,
    autonomies,
    preferencesConfig,
    accessibilityConfig,
  ] = await Promise.all([
    tandemApi.usuarios.getById(idUsuario),
    fetchPertenecienteByUsuarioId(userId).catch(() => null),
    tandemApi.nivelesApoyos.getAll(),
    tandemApi.autonomiasOperativas.getAll(),
    getUserConfig(idUsuario, PROFILE_PREFERENCES_KEY),
    getAccessibilityConfig(idUsuario, PROFILE_ACCESSIBILITY_KEY),
  ]);

  return {
    usuario: usuario ? ({ ...usuario, contrasena_hash: undefined } as Omit<Usuario, 'contrasena_hash'>) : null,
    perteneciente,
    supportLevels,
    autonomies,
    preferences: parseJsonConfig(preferencesConfig?.valor, defaultProfilePreferences),
    accessibility: parseJsonConfig(accessibilityConfig?.valor, defaultProfileAccessibility),
  };
}

export async function saveUserProfileSettings(userId: string, payload: UserProfileSettingsPayload): Promise<void> {
  if (!isBackendUserId(userId)) throw new Error('El usuario no esta conectado al backend.');

  const idUsuario = Number(userId);
  const [currentUsuario, currentPerteneciente] = await Promise.all([
    tandemApi.usuarios.getById(idUsuario),
    fetchPertenecienteByUsuarioId(userId).catch(() => null),
  ]);

  await tandemApi.usuarios.update(idUsuario, {
    ...currentUsuario,
    ...payload.usuario,
    telefono: payload.usuario.telefono,
    fecha_nacimiento: payload.usuario.fecha_nacimiento || null,
  });

  if (currentPerteneciente?.id) {
    await tandemApi.pertenecientes.update(currentPerteneciente.id, {
      ...currentPerteneciente,
      ...payload.perteneciente,
      id_usuario: idUsuario,
    });
  } else {
    await tandemApi.pertenecientes.create({
      ...payload.perteneciente,
      id_usuario: idUsuario,
    });
  }

  await Promise.all([
    upsertUserConfig(idUsuario, PROFILE_PREFERENCES_KEY, payload.preferences),
    upsertAccessibilityConfig(idUsuario, PROFILE_ACCESSIBILITY_KEY, payload.accessibility),
  ]);
}

export async function saveOwnUserSettings(
  userId: string,
  payload: Pick<UserProfileSettingsPayload, 'usuario' | 'preferences'>,
): Promise<void> {
  if (!isBackendUserId(userId)) throw new Error('El usuario no esta conectado al backend.');

  const idUsuario = Number(userId);
  const currentUsuario = await tandemApi.usuarios.getById(idUsuario);

  await tandemApi.usuarios.update(idUsuario, {
    ...currentUsuario,
    ...payload.usuario,
    telefono: payload.usuario.telefono,
    fecha_nacimiento: payload.usuario.fecha_nacimiento || null,
  });

  await upsertUserConfig(idUsuario, PROFILE_PREFERENCES_KEY, payload.preferences);
}

export async function fetchAccessibilitySettings<T extends object>(userId: string, fallback: T): Promise<T> {
  if (!isBackendUserId(userId)) return fallback;

  const config = await getAccessibilityConfig(Number(userId), ACCESSIBILITY_SETTINGS_KEY);
  return parseJsonConfig(config?.valor, fallback);
}

export async function saveAccessibilitySettings(userId: string, settings: object): Promise<void> {
  if (!isBackendUserId(userId)) return;
  await upsertAccessibilityConfig(Number(userId), ACCESSIBILITY_SETTINGS_KEY, settings);
}

export async function fetchLegacyPricingPlans(): Promise<PricingPlan[]> {
  return apiFetchWithFallback<PricingPlan[]>(['/pricing/plans', '/plans/pricing']);
}

// legacy screens pending migration
export const resources: Resource[] = [];
export const achievements: Achievement[] = [];
export const pictograms: Pictogram[] = [];
export const pricingPlans: PricingPlan[] = [];
export const users: User[] = [];
export const tutors: Tutor[] = [];
export const professionals: Professional[] = [];
export const admins: Admin[] = [];
export const activities: Activity[] = [];
export const juanDailyRoutine: RoutineItem[] = [];
export const calendarEvents: CalendarEvent[] = [];
export const conversations: Conversation[] = [];
export const chatMessages: ChatMessage[] = [];
export const notifications: Notification[] = [];
export const emotionalRecords: EmotionalRecord[] = [];
export const objectives: Objective[] = [];
export const locations: Location[] = [];
export const recommendations: Recommendation[] = [];
export const getActivitiesForUser = (_: string): Activity[] => [];
export const getNotificationsForUser = (_: string): Notification[] => [];
export const getObjectivesForUser = (_: string): Objective[] => [];
export const getEmotionsForUser = (_: string): EmotionalRecord[] => [];
export const getLocationsForUser = (_: string): Location[] => [];
export const getRecommendationsForUser = (_: string): Recommendation[] => [];
export const getTutorById = (_: string): Tutor | undefined => undefined;
export const getProfessionalById = (_: string): Professional | undefined => undefined;
