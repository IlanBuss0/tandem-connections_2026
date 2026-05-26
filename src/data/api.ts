import * as legacy from './mockData';
import { tandemApi } from '@/services/api';
import type {
  Actividad as DbActividad,
  ActividadAsignada as DbActividadAsignada,
  ActividadPersonalizada as DbActividadPersonalizada,
  AutonomiaOperativa as DbAutonomiaOperativa,
  Avatar as DbAvatar,
  EstadoActividad as DbEstadoActividad,
  NivelApoyo as DbNivelApoyo,
  Notificacion as DbNotificacion,
  Perteneciente as DbPerteneciente,
  SaldoPuntos as DbSaldoPuntos,
  Usuario,
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
export type CalendarEvent = legacy.CalendarEvent;
export type Conversation = legacy.Conversation;
export type ChatMessage = legacy.ChatMessage;
export type Notification = legacy.Notification;
export type EmotionalRecord = legacy.EmotionalRecord;
export type Achievement = legacy.Achievement;
export type Objective = legacy.Objective;
export type Location = legacy.Location;
export type Recommendation = legacy.Recommendation;
export type Pictogram = legacy.Pictogram;
export type Resource = legacy.Resource;
export type PricingPlan = legacy.PricingPlan;

async function apiFetchWithFallback<T>(paths: string[], init?: RequestInit): Promise<T> {
  let last: unknown = null;
  for (const p of paths) {
    try {
      const res = await fetch(`${((import.meta as any).env?.VITE_BACKEND_URL || (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')}${p}`, {
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
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

function toLegacyUser(user: Partial<Usuario>): User | Tutor | Professional | Admin {
  const role = backendRoleToLegacyRole(user.id_tipo_usuario);
  const base = {
    id: String(user.id ?? ''),
    username: user.nombre_usuario ?? user.correo ?? '',
    password: '',
    name: [user.nombre, user.apellido].filter(Boolean).join(' ') || user.nombre_usuario || user.correo || 'Usuario',
    email: user.correo ?? '',
    avatar: '🙂',
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

function toLegacyActivity(activity: DbActividad, userId?: string): Activity {
  const typeById: Record<number, ActivityType> = {
    1: 'guiada',
    2: 'juego',
    3: 'regulaciÃ³n',
    4: 'decisiÃ³n',
    5: 'guiada',
  };

  return {
    id: String(activity.id),
    title: activity.titulo,
    category: 'autonomÃ­a personal',
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

function toLegacyNotification(notification: DbNotificacion): Notification {
  return {
    id: String(notification.id),
    userId: String(notification.id_usuario_destino),
    title: notification.titulo,
    message: notification.cuerpo || '',
    type: 'reminder',
    icon: '!',
    read: notification.leida,
    timestamp: notification.fecha_creacion,
  } as Notification;
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

export async function findUser(username: string, password: string): Promise<User | Tutor | Professional | Admin | null> {
  try {
    const auth = await tandemApi.auth.login({
      nombre_usuario: username,
      correo: username.includes('@') ? username : undefined,
      contrasena: password,
    });

    localStorage.setItem('tandem_auth_token', auth.token);
    return toLegacyUser(auth.user);
  } catch {
    return null;
  }
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

export async function fetchPertenecienteHome(userId: string): Promise<PertenecienteHomeData> {
  const perteneciente = await apiFetchWithFallback<DbPerteneciente | null>([`/api/pertenecientes/usuario/${encodeURIComponent(userId)}`]);
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
    personalizadas,
    estados,
    notificaciones,
    saldos,
    avatares,
    nivelesApoyo,
    autonomias,
  ] = await Promise.all([
    tandemApi.actividadesAsignadas.getAll(),
    tandemApi.actividades.getAll(),
    tandemApi.actividadesPersonalizadas.getAll(),
    tandemApi.estadosActividades.getAll(),
    tandemApi.notificaciones.getAll(),
    tandemApi.saldosPuntos.getAll(),
    tandemApi.avatares.getAll(),
    tandemApi.nivelesApoyos.getAll(),
    tandemApi.autonomiasOperativas.getAll(),
  ]);

  const activitiesById = new Map((actividades as DbActividad[]).map(a => [Number(a.id), a]));
  const customById = new Map((personalizadas as DbActividadPersonalizada[]).map(a => [Number(a.id), a]));
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
        title: n.titulo || 'Notificacion',
        message: n.cuerpo || '',
        type: 'reminder',
        icon: '!',
        read: Boolean(n.leida),
        timestamp: formatBackendDate(n.fecha_creacion),
      } as Notification)),
  };
}

export async function fetchActivitiesForUser(userId: string): Promise<Activity[]> {
  try {
    const rows = await tandemApi.actividades.getAll();
    return rows.map((row) => toLegacyActivity(row, userId));
  } catch {
    return apiFetchWithFallback<Activity[]>([`/activities?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/activities`]);
  }
}
export async function fetchNotificationsForUser(userId: string): Promise<Notification[]> {
  try {
    const numericUserId = Number(userId);
    const rows = await tandemApi.notificaciones.getAll();
    return rows
      .filter((row) => Number.isNaN(numericUserId) || row.id_usuario_destino === numericUserId)
      .map(toLegacyNotification);
  } catch {
    return apiFetchWithFallback<Notification[]>([`/notifications?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/notifications`]);
  }
}
export async function fetchObjectivesForUser(userId: string): Promise<Objective[]> {
  return apiFetchWithFallback<Objective[]>([`/objectives?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/objectives`]);
}
export async function fetchCalendarEventsForUser(userId: string): Promise<CalendarEvent[]> {
  return apiFetchWithFallback<CalendarEvent[]>([`/calendar/events?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/calendar/events`]);
}
export async function createCalendarEvent(userId: string, data: Omit<CalendarEvent, 'id' | 'userId'>): Promise<CalendarEvent> {
  return apiFetchWithFallback<CalendarEvent>([`/calendar/events`, `/users/${encodeURIComponent(userId)}/calendar/events`], { method: 'POST', body: JSON.stringify({ ...data, userId }) });
}
export async function updateCalendarEvent(eventId: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
  return apiFetchWithFallback<CalendarEvent>([`/calendar/events/${encodeURIComponent(eventId)}`], { method: 'PATCH', body: JSON.stringify(patch) });
}
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  await apiFetchWithFallback<unknown>([`/calendar/events/${encodeURIComponent(eventId)}`], { method: 'DELETE' });
}

export async function fetchEmotionRecordsForUser(userId: string): Promise<EmotionalRecord[]> {
  return apiFetchWithFallback<EmotionalRecord[]>([`/emotions?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/emotions`]);
}
export async function createEmotionRecord(userId: string, payload: Omit<EmotionalRecord, 'id' | 'userId'>): Promise<EmotionalRecord> {
  return apiFetchWithFallback<EmotionalRecord>([`/emotions`, `/users/${encodeURIComponent(userId)}/emotions`], { method: 'POST', body: JSON.stringify({ ...payload, userId }) });
}
export async function deleteEmotionRecord(recordId: string): Promise<void> {
  await apiFetchWithFallback<unknown>([`/emotions/${encodeURIComponent(recordId)}`], { method: 'DELETE' });
}

export interface DayRoutine { id: string; name: string; dayOfWeek: number | null; items: RoutineItem[] }
const ROUTINES_CONFIG_KEY = 'routines.mi-dia';

function normalizeRoutinesPayload(payload: unknown): DayRoutine[] {
  if (!Array.isArray(payload)) return [];
  return payload.map((routine, index) => {
    const r = routine as Partial<DayRoutine>;
    return {
      id: String(r.id || `dr-${Date.now()}-${index}`),
      name: String(r.name || 'Mi dÃ­a'),
      dayOfWeek: typeof r.dayOfWeek === 'number' ? r.dayOfWeek : null,
      items: Array.isArray(r.items)
        ? r.items.map((item, itemIndex) => {
            const it = item as Partial<RoutineItem>;
            return {
              id: String(it.id || `i-${Date.now()}-${index}-${itemIndex}`),
              time: String(it.time || '08:00'),
              title: String(it.title || ''),
              icon: String(it.icon || 'â­'),
              completed: Boolean(it.completed),
              category: String(it.category || 'maÃ±ana'),
            };
          })
        : [],
    };
  });
}

export async function fetchRoutinesForUser(userId: string): Promise<DayRoutine[]> {
  try {
    const numericUserId = Number(userId);
    const rows = await tandemApi.configuracionesUsuarios.getAll();
    const config = rows.find(row => row.id_usuario === numericUserId && row.clave === ROUTINES_CONFIG_KEY);
    if (!config?.valor) return [];
    return normalizeRoutinesPayload(JSON.parse(config.valor));
  } catch {
    return apiFetchWithFallback<DayRoutine[]>([`/routines?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/routines`]);
  }
}
export async function saveRoutinesForUser(userId: string, routines: DayRoutine[]): Promise<DayRoutine[]> {
  try {
    const numericUserId = Number(userId);
    const payload = {
      id_usuario: numericUserId,
      clave: ROUTINES_CONFIG_KEY,
      valor: JSON.stringify(routines),
      fecha_modificacion: new Date().toISOString(),
    };
    const rows = await tandemApi.configuracionesUsuarios.getAll();
    const config = rows.find(row => row.id_usuario === numericUserId && row.clave === ROUTINES_CONFIG_KEY);
    if (config?.id) await tandemApi.configuracionesUsuarios.update(config.id, payload);
    else await tandemApi.configuracionesUsuarios.create(payload);
    return routines;
  } catch {
    return apiFetchWithFallback<DayRoutine[]>([`/routines/bulk`, `/users/${encodeURIComponent(userId)}/routines`], { method: 'PUT', body: JSON.stringify({ userId, routines }) });
  }
}

export async function fetchConversationsForUser(userId: string): Promise<Conversation[]> {
  return apiFetchWithFallback<Conversation[]>([`/chat/conversations?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/conversations`]);
}
export async function fetchMessagesForConversation(conversationId: string): Promise<ChatMessage[]> {
  return apiFetchWithFallback<ChatMessage[]>([`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, `/conversations/${encodeURIComponent(conversationId)}/messages`]);
}
export async function sendMessage(conversationId: string, senderId: string, senderName: string, text: string): Promise<ChatMessage> {
  return apiFetchWithFallback<ChatMessage>([`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, `/conversations/${encodeURIComponent(conversationId)}/messages`], {
    method: 'POST', body: JSON.stringify({ senderId, senderName, text, type: 'text' }),
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


export async function fetchAchievementsForUser(userId: string): Promise<Achievement[]> {
  return apiFetchWithFallback<Achievement[]>([`/achievements?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/achievements`]);
}
export async function fetchResourcesForUser(userId: string): Promise<Resource[]> {
  return apiFetchWithFallback<Resource[]>([`/resources?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/resources`]);
}
export async function fetchPictograms(query?: { category?: string; search?: string }): Promise<Pictogram[]> {
  const params = new URLSearchParams();
  if (query?.category && query.category !== 'todas') params.set('category', query.category);
  if (query?.search) params.set('search', query.search);
  const q = params.toString();
  return apiFetchWithFallback<Pictogram[]>([q ? `/pictograms?${q}` : '/pictograms']);
}
export async function fetchTutorById(id: string): Promise<Tutor | null> {
  try { return await apiFetchWithFallback<Tutor>([`/tutors/${encodeURIComponent(id)}`]); } catch { return null; }
}
export async function fetchProfessionalById(id: string): Promise<Professional | null> {
  try { return await apiFetchWithFallback<Professional>([`/professionals/${encodeURIComponent(id)}`]); } catch { return null; }
}
export async function fetchPricingPlans(): Promise<PricingPlan[]> {
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
