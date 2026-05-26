import * as legacy from './mockData';

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

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');

type BackendEnvelope<T> = { ok?: boolean; data?: T };

function unwrapBackendResponse<T>(payload: T | BackendEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as BackendEnvelope<T>).data as T;
  }
  return payload as T;
}

async function apiFetchWithFallback<T>(paths: string[], init?: RequestInit): Promise<T> {
  let last: unknown = null;
  for (const p of paths) {
    try {
      const res = await fetch(`${API_BASE}${p}`, {
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
        ...init,
      });
      if (!res.ok) {
        last = new Error(`HTTP ${res.status} on ${p}`);
        continue;
      }
      return unwrapBackendResponse<T>(await res.json());
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error('Request failed');
}

type BackendUser = {
  id: number;
  id_tipo_usuario?: number;
  nombre_usuario?: string;
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  activo?: boolean;
};

type BackendCatalog = { id: number; nombre?: string; orden?: number };
type BackendPerteneciente = {
  id: number;
  id_usuario: number;
  id_nivel_apoyo?: number | null;
  id_autonomia_operativa?: number | null;
  puede_autogestionarse?: boolean;
  observacion_general?: string | null;
};
type BackendActividadAsignada = {
  id: number;
  id_actividad?: number | null;
  id_actividad_personalizada?: number | null;
  id_perteneciente: number;
  id_usuario_asignador?: number | null;
  id_estado_actividad?: number | null;
  fecha_asignacion?: string | null;
  fecha_completada?: string | null;
};
type BackendActividad = {
  id: number;
  titulo?: string;
  descripcion?: string | null;
  activa?: boolean;
};
type BackendActividadPersonalizada = {
  id: number;
  titulo?: string;
  descripcion?: string | null;
  activa?: boolean;
};
type BackendNotificacion = {
  id: number;
  id_usuario_destino: number;
  titulo?: string;
  cuerpo?: string | null;
  leida?: boolean;
  fecha_creacion?: string | null;
};
type BackendSaldoPunto = { id: number; id_perteneciente: number; saldo: number };
type BackendAvatar = { id: number; id_perteneciente: number; nivel?: number; experiencia?: number };

function normalizeRole(typeName?: string): UserRole {
  const name = (typeName || '').toLowerCase();
  if (name.includes('admin')) return 'admin';
  if (name.includes('tutor')) return 'tutor';
  if (name.includes('profesional')) return 'professional';
  return 'user';
}

function normalizeUser(user: BackendUser, typeName?: string): User {
  const fullName = `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.nombre_usuario || `Usuario ${user.id}`;
  return {
    id: String(user.id),
    username: user.nombre_usuario || String(user.id),
    password: '',
    name: fullName,
    role: normalizeRole(typeName),
    email: user.correo || '',
    avatar: '',
    points: 0,
    streak: 0,
    level: 1,
    plan: 'free',
    onboarded: true,
  };
}

function isCompletedStatus(status?: BackendCatalog, assigned?: BackendActividadAsignada) {
  const name = (status?.nombre || '').toLowerCase();
  return Boolean(assigned?.fecha_completada || name.includes('complet') || name.includes('finaliz'));
}

function formatBackendDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(date);
}

async function fetchList<T>(path: string): Promise<T[]> {
  try {
    return await apiFetchWithFallback<T[]>([path]);
  } catch {
    return [];
  }
}

export async function findUser(username: string, password: string): Promise<User | Tutor | Professional | Admin | null> {
  try {
    const login = await apiFetchWithFallback<{ user: BackendUser; token: string }>(['/auth/login'], {
      method: 'POST',
      body: JSON.stringify({
        nombre_usuario: username,
        correo: username.includes('@') ? username : undefined,
        contrasena: password,
      }),
    });
    if (!login?.user) return null;

    const tipos = await fetchList<BackendCatalog>('/tipos-usuarios');
    const tipo = tipos.find(t => Number(t.id) === Number(login.user.id_tipo_usuario));
    return normalizeUser(login.user, tipo?.nombre);
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
  perteneciente: BackendPerteneciente | null;
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
  const perteneciente = await apiFetchWithFallback<BackendPerteneciente | null>([`/pertenecientes/usuario/${encodeURIComponent(userId)}`]);
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
    fetchList<BackendActividadAsignada>('/actividades-asignadas'),
    fetchList<BackendActividad>('/actividades'),
    fetchList<BackendActividadPersonalizada>('/actividades-personalizadas'),
    fetchList<BackendCatalog>('/estados-actividades'),
    fetchList<BackendNotificacion>('/notificaciones'),
    fetchList<BackendSaldoPunto>('/saldos-puntos'),
    fetchList<BackendAvatar>('/avatares'),
    fetchList<BackendCatalog>('/niveles-apoyos'),
    fetchList<BackendCatalog>('/autonomias-operativas'),
  ]);

  const activitiesById = new Map(actividades.map(a => [Number(a.id), a]));
  const customById = new Map(personalizadas.map(a => [Number(a.id), a]));
  const statusById = new Map(estados.map(e => [Number(e.id), e]));
  const saldo = saldos.find(s => Number(s.id_perteneciente) === Number(perteneciente.id));
  const avatar = avatares.find(a => Number(a.id_perteneciente) === Number(perteneciente.id));
  const supportLevel = nivelesApoyo.find(n => Number(n.id) === Number(perteneciente.id_nivel_apoyo));
  const autonomy = autonomias.find(a => Number(a.id) === Number(perteneciente.id_autonomia_operativa));

  return {
    perteneciente,
    supportLevel: supportLevel?.nombre || 'Sin registrar',
    autonomy: autonomy?.nombre || 'Sin registrar',
    canSelfManage: Boolean(perteneciente.puede_autogestionarse),
    points: saldo?.saldo ?? 0,
    level: avatar?.nivel ?? 1,
    experience: avatar?.experiencia ?? 0,
    activities: asignadas
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
    notifications: notificaciones
      .filter(n => Number(n.id_usuario_destino) === Number(userId))
      .map(n => ({
        id: String(n.id),
        userId,
        title: n.titulo || 'Notificacion',
        message: n.cuerpo || '',
        type: 'info',
        icon: 'bell',
        read: Boolean(n.leida),
        timestamp: formatBackendDate(n.fecha_creacion),
      } as Notification)),
  };
}

export async function fetchActivitiesForUser(userId: string): Promise<Activity[]> {
  return apiFetchWithFallback<Activity[]>([`/activities?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/activities`]);
}
export async function fetchNotificationsForUser(userId: string): Promise<Notification[]> {
  return apiFetchWithFallback<Notification[]>([`/notifications?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/notifications`]);
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
export async function fetchRoutinesForUser(userId: string): Promise<DayRoutine[]> {
  return apiFetchWithFallback<DayRoutine[]>([`/routines?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/routines`]);
}
export async function saveRoutinesForUser(userId: string, routines: DayRoutine[]): Promise<DayRoutine[]> {
  return apiFetchWithFallback<DayRoutine[]>([`/routines/bulk`, `/users/${encodeURIComponent(userId)}/routines`], { method: 'PUT', body: JSON.stringify({ userId, routines }) });
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
export async function fetchAllUsers(): Promise<User[]> { return apiFetchWithFallback<User[]>(['/users']); }
export async function fetchAllTutors(): Promise<Tutor[]> { return apiFetchWithFallback<Tutor[]>(['/tutors']); }
export async function fetchAllProfessionals(): Promise<Professional[]> { return apiFetchWithFallback<Professional[]>(['/professionals']); }


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
