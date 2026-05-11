// ============================================================================
// TÁNDEM — Repository Layer (SQL-backed)
// ----------------------------------------------------------------------------
// Esta capa es la ÚNICA fuente de datos para todas las pantallas. Internamente
// construye view-models a partir de las tablas relacionales en `normalized.ts`
// (mapeadas 1:1 al esquema SQL definitivo). Los componentes ya NO importan
// desde `mockData.ts` — importan desde acá.
//
// Para fields que aún no existen en el esquema SQL (catálogos visuales como
// pictogramas, recursos didácticos, demo notifications, etc.) se hace
// pass-through desde `mockData.ts` porque son contenido estático de demo.
// ============================================================================

import * as legacy from './mockData';
import {
  usuarios, pertenecientes, tutores, profesionales, administradores,
  saldosPuntos, avatares,
  vinculosTutorPertenecientes, vinculosProfesionalPertenecientes,
  usuarioIdMap,
} from './normalized';
import { rolesAdministradores, catalogNameById } from './catalogs';

// ============================================================================
// Mapa inverso INT -> legacy string id
// ============================================================================
const legacyIdByInt = new Map<number, string>();
for (const [legId, intId] of usuarioIdMap.entries()) legacyIdByInt.set(intId, legId);

// ============================================================================
// TIPOS — alias sobre los tipos legacy (los datos vienen del SQL layer)
// ============================================================================
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
export type VisualResource = legacy.VisualResource;
export type Resource = legacy.Resource;
export type PricingPlan = legacy.PricingPlan;

// ============================================================================
// VIEW-MODELS — reconstruidos desde tablas relacionales (SELECT + JOIN)
// ============================================================================

/**
 * Users (Pertenecientes) — SELECT u.*, p.*, s.saldo, a.* FROM Usuarios u
 *   JOIN Pertenecientes p ON p.id_usuario = u.id
 *   LEFT JOIN SaldoPuntos s ON s.id_perteneciente = p.id
 *   LEFT JOIN Avatares a ON a.id_perteneciente = p.id
 */
export const users: User[] = legacy.users.map(legacyU => {
  const intId = usuarioIdMap.get(legacyU.id);
  if (!intId) return legacyU;
  const usuario = usuarios.find(u => u.id === intId);
  const pert = pertenecientes.find(p => p.id_usuario === intId);
  if (!usuario || !pert) return legacyU;

  const saldo = saldosPuntos.find(s => s.id_perteneciente === pert.id)?.saldo;
  const avatarRow = avatares.find(a => a.id_perteneciente === pert.id);

  // JOIN vínculos para reconstruir linkedTutorIds / linkedProfessionalIds
  const linkedTutorIds = vinculosTutorPertenecientes
    .filter(v => v.id_perteneciente === pert.id && v.fecha_fin === null)
    .map(v => {
      const tutorRow = tutores.find(t => t.id === v.id_tutor);
      return tutorRow ? legacyIdByInt.get(tutorRow.id_usuario) : null;
    })
    .filter((x): x is string => !!x);

  const linkedProfessionalIds = vinculosProfesionalPertenecientes
    .filter(v => v.id_perteneciente === pert.id)
    .map(v => {
      const profRow = profesionales.find(p => p.id === v.id_profesional);
      return profRow ? legacyIdByInt.get(profRow.id_usuario) : null;
    })
    .filter((x): x is string => !!x);

  return {
    ...legacyU,
    name: `${usuario.nombre} ${usuario.apellido}`.trim() || legacyU.name,
    username: usuario.nombre_usuario,
    password: usuario.contrasena_hash,
    email: usuario.correo,
    points: saldo ?? legacyU.points,
    level: avatarRow?.nivel ?? legacyU.level,
    avatar: avatarRow?.avatar_externo_id ?? legacyU.avatar,
    linkedTutorIds: linkedTutorIds.length ? linkedTutorIds : legacyU.linkedTutorIds,
    linkedProfessionalIds: linkedProfessionalIds.length ? linkedProfessionalIds : legacyU.linkedProfessionalIds,
  };
});

/** Tutors — SELECT u.*, t.parentesco FROM Usuarios u JOIN Tutores t ON t.id_usuario = u.id */
export const tutors: Tutor[] = legacy.tutors.map(legacyT => {
  const intId = usuarioIdMap.get(legacyT.id);
  if (!intId) return legacyT;
  const usuario = usuarios.find(u => u.id === intId);
  const tutorRow = tutores.find(t => t.id_usuario === intId);
  if (!usuario || !tutorRow) return legacyT;

  // JOIN VinculosTutorPertenecientes para reconstruir linkedUserIds
  const linkedUserIds = vinculosTutorPertenecientes
    .filter(v => v.id_tutor === tutorRow.id && v.fecha_fin === null)
    .map(v => {
      const pertRow = pertenecientes.find(p => p.id === v.id_perteneciente);
      return pertRow ? legacyIdByInt.get(pertRow.id_usuario) : null;
    })
    .filter((x): x is string => !!x);

  return {
    ...legacyT,
    name: `${usuario.nombre} ${usuario.apellido}`.trim() || legacyT.name,
    username: usuario.nombre_usuario,
    password: usuario.contrasena_hash,
    email: usuario.correo,
    relation: tutorRow.parentesco ?? legacyT.relation,
    linkedUserIds: linkedUserIds.length ? linkedUserIds : legacyT.linkedUserIds,
  };
});

/** Professionals — JOIN Usuarios + Profesionales + VinculosProfesionalPertenecientes */
export const professionals: Professional[] = legacy.professionals.map(legacyP => {
  const intId = usuarioIdMap.get(legacyP.id);
  if (!intId) return legacyP;
  const usuario = usuarios.find(u => u.id === intId);
  const profRow = profesionales.find(p => p.id_usuario === intId);
  if (!usuario || !profRow) return legacyP;

  const linkedUserIds = vinculosProfesionalPertenecientes
    .filter(v => v.id_profesional === profRow.id)
    .map(v => {
      const pertRow = pertenecientes.find(p => p.id === v.id_perteneciente);
      return pertRow ? legacyIdByInt.get(pertRow.id_usuario) : null;
    })
    .filter((x): x is string => !!x);

  return {
    ...legacyP,
    name: `${usuario.nombre} ${usuario.apellido}`.trim() || legacyP.name,
    username: usuario.nombre_usuario,
    password: usuario.contrasena_hash,
    email: usuario.correo,
    specialty: [profRow.profesion, profRow.especialidad].filter(Boolean).join(' - ') || legacyP.specialty,
    linkedUserIds: linkedUserIds.length ? linkedUserIds : legacyP.linkedUserIds,
  };
});

/** Admins — JOIN Usuarios + Administradores + RolesAdministradores */
export const admins: Admin[] = legacy.admins.map(legacyA => {
  const intId = usuarioIdMap.get(legacyA.id);
  if (!intId) return legacyA;
  const usuario = usuarios.find(u => u.id === intId);
  const adminRow = administradores.find(a => a.id_usuario === intId);
  if (!usuario || !adminRow) return legacyA;

  const rolNombre = catalogNameById(rolesAdministradores, adminRow.id_rol);
  return {
    ...legacyA,
    name: `${usuario.nombre} ${usuario.apellido}`.trim() || legacyA.name,
    username: usuario.nombre_usuario,
    password: usuario.contrasena_hash,
    email: usuario.correo,
    clearance: rolNombre === 'Developer' ? 'developer' : 'superadmin',
  };
});

// ============================================================================
// STATIC CATALOGS — pass-through (sin tabla SQL, contenido demo)
// ============================================================================
export const activities = legacy.activities;
export const juanDailyRoutine = legacy.juanDailyRoutine;
export const calendarEvents = legacy.calendarEvents;
export const conversations = legacy.conversations;
export const chatMessages = legacy.chatMessages;
export const notifications = legacy.notifications;
export const emotionalRecords = legacy.emotionalRecords;
export const achievements = legacy.achievements;
export const objectives = legacy.objectives;
export const locations = legacy.locations;
export const recommendations = legacy.recommendations;
export const pictograms = legacy.pictograms;
export const visualResources = legacy.visualResources;
export const resources = legacy.resources;
export const pricingPlans = legacy.pricingPlans;

// ============================================================================
// QUERY HELPERS (estilo SELECT WHERE) — todos operan sobre los view-models SQL
// ============================================================================
export function findUser(username: string, password: string): User | Tutor | Professional | Admin | null {
  return (
    users.find(u => u.username === username && u.password === password) ||
    tutors.find(t => t.username === username && t.password === password) ||
    professionals.find(p => p.username === username && p.password === password) ||
    admins.find(a => a.username === username && a.password === password) ||
    null
  );
}

export const getUserById = (id: string): User | undefined => users.find(u => u.id === id);
export const getTutorById = (id: string): Tutor | undefined => tutors.find(t => t.id === id);
export const getProfessionalById = (id: string): Professional | undefined => professionals.find(p => p.id === id);

export const getActivitiesForUser = (userId: string): Activity[] =>
  activities.filter(a => a.assignedTo === userId);
export const getEventsForUser = (userId: string): CalendarEvent[] =>
  calendarEvents.filter(e => e.userId === userId);
export const getConversationsForUser = (userId: string): Conversation[] =>
  conversations.filter(c => c.participants.includes(userId));
export const getMessagesForConversation = (convId: string): ChatMessage[] =>
  chatMessages.filter(m => m.conversationId === convId);
export const getNotificationsForUser = (userId: string): Notification[] =>
  notifications.filter(n => n.userId === userId);
export const getEmotionsForUser = (userId: string): EmotionalRecord[] =>
  emotionalRecords.filter(e => e.userId === userId);
export const getObjectivesForUser = (userId: string): Objective[] =>
  objectives.filter(o => o.userId === userId);
export const getLocationsForUser = (userId: string): Location[] =>
  locations.filter(l => l.userId === userId);
export const getRecommendationsForUser = (userId: string): Recommendation[] =>
  recommendations.filter(r => r.userId === userId);
