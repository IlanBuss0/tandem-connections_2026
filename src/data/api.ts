import * as legacy from './mockData';
import { tandemApi } from '@/services/api';
import type { Actividad as DbActividad, ConfiguracionUsuario, Notificacion as DbNotificacion, Usuario } from '@/types/database';

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

function isBackendUserId(userId: string): boolean {
  return Number.isInteger(Number(userId));
}

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

async function fetchBackendAchievementDashboard(userId: string): Promise<AchievementDashboard> {
  const idUsuario = Number(userId);
  const [pertenecientes, assigned, saldos, avatares, configs] = await Promise.all([
    tandemApi.pertenecientes.getAll(),
    tandemApi.actividadesAsignadas.getAll(),
    tandemApi.saldosPuntos.getAll(),
    tandemApi.avatares.getAll(),
    tandemApi.configuracionesUsuarios.getAll(),
  ]);

  const perteneciente = pertenecientes.find((item) => item.id_usuario === idUsuario);
  const idPerteneciente = perteneciente?.id;
  const assignedForUser = idPerteneciente
    ? assigned.filter((item) => item.id_perteneciente === idPerteneciente)
    : [];
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

  return apiFetchWithFallback<EmotionalRecord[]>([`/emotions?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/emotions`]);
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
