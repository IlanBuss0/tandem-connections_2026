import * as legacy from './mockData';
import { tandemApi } from '@/services/api';
import type {
  Actividad as DbActividad,
  ActividadAsignada as DbActividadAsignada,
  ActividadPersonalizada as DbActividadPersonalizada,
  AutonomiaOperativa as DbAutonomiaOperativa,
  Avatar as DbAvatar,
  ConfiguracionUsuario,
  EstadoActividad as DbEstadoActividad,
  EstadoVinculo as DbEstadoVinculo,
  NivelApoyo as DbNivelApoyo,
  Notificacion as DbNotificacion,
  Perteneciente as DbPerteneciente,
  PlanSuscripcion as DbPlanSuscripcion,
  Profesional as DbProfesional,
  SaldoPuntos as DbSaldoPuntos,
  Tutor as DbTutor,
  Usuario,
  VinculoProfesionalPerteneciente as DbVinculoProfesionalPerteneciente,
  VinculoTutorPerteneciente as DbVinculoTutorPerteneciente,
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
  if (isBackendUserId(userId)) {
    const config = await getUserConfig(Number(userId), CALENDAR_CONFIG_KEY);
    if (!config?.valor) return [];
    return normalizeCalendarEventsPayload(JSON.parse(config.valor), userId);
  }

  return apiFetchWithFallback<CalendarEvent[]>([`/calendar/events?userId=${encodeURIComponent(userId)}`, `/users/${encodeURIComponent(userId)}/calendar/events`]);
}

export async function createCalendarEvent(userId: string, data: Omit<CalendarEvent, 'id' | 'userId'>): Promise<CalendarEvent> {
  if (isBackendUserId(userId)) {
    const events = await fetchCalendarEventsForUser(userId);
    const created: CalendarEvent = {
      ...data,
      id: `ce-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
    };
    await saveCalendarEventsForUser(userId, [...events, created]);
    return created;
  }

  return apiFetchWithFallback<CalendarEvent>([`/calendar/events`, `/users/${encodeURIComponent(userId)}/calendar/events`], { method: 'POST', body: JSON.stringify({ ...data, userId }) });
}

export async function updateCalendarEvent(eventId: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const config = await findCalendarConfigByEventId(eventId);
  if (config) {
    const userId = String(config.id_usuario);
    const events = normalizeCalendarEventsPayload(JSON.parse(config.valor || '[]'), userId);
    const previous = events.find(event => event.id === eventId);
    if (!previous) throw new Error(`No se encontro el evento ${eventId}.`);
    const updated = { ...previous, ...patch, id: previous.id, userId: previous.userId };
    await saveCalendarEventsForUser(userId, events.map(event => event.id === eventId ? updated : event));
    return updated;
  }

  return apiFetchWithFallback<CalendarEvent>([`/calendar/events/${encodeURIComponent(eventId)}`], { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const config = await findCalendarConfigByEventId(eventId);
  if (config) {
    const userId = String(config.id_usuario);
    const events = normalizeCalendarEventsPayload(JSON.parse(config.valor || '[]'), userId);
    await saveCalendarEventsForUser(userId, events.filter(event => event.id !== eventId));
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

const CALENDAR_CONFIG_KEY = 'calendar.events';

async function getUserConfig(userId: number, key: string): Promise<ConfiguracionUsuario | undefined> {
  const rows = await tandemApi.configuracionesUsuarios.getAll();
  return rows.find(row => row.id_usuario === userId && row.clave === key);
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
      } as CalendarEvent;
    })
    .filter((event): event is CalendarEvent => Boolean(event));
}

function calendarTypeColor(type: CalendarEvent['type']): string {
  const colors: Record<CalendarEvent['type'], string> = {
    terapia: 'hsl(270 40% 75%)',
    escuela: 'hsl(210 70% 55%)',
    personal: 'hsl(30 80% 60%)',
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
  if (config?.id) await tandemApi.configuracionesUsuarios.update(config.id, payload);
  else await tandemApi.configuracionesUsuarios.create(payload);
}

async function findCalendarConfigByEventId(eventId: string): Promise<ConfiguracionUsuario | undefined> {
  const rows = await tandemApi.configuracionesUsuarios.getAll();
  return rows.find(row => {
    if (row.clave !== CALENDAR_CONFIG_KEY || !row.valor) return false;
    try {
      return normalizeCalendarEventsPayload(JSON.parse(row.valor), String(row.id_usuario))
        .some(event => event.id === eventId);
    } catch {
      return false;
    }
  });
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