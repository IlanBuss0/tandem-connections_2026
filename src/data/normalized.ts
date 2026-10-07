// ============================================================================
// TÁNDEM — Datos normalizados (tablas relacionales en memoria)
// ----------------------------------------------------------------------------
// Esta capa representa la BD relacional definida por el esquema SQL, derivada
// determinísticamente de los mocks legacy (mockData.ts). Los IDs string del
// modelo plano se mapean a INT autoincrementales.
//
// REGLA: la UI antigua sigue consumiendo mockData.ts. Esta capa nueva queda
// disponible para vistas/hooks que ya migran al esquema definitivo.
// ============================================================================
import {
  activities as legacyActivities,
} from './mockData';
import type {
  Usuario, Perteneciente, Tutor, Profesional, Administrador,
  VinculoTutorPerteneciente, VinculoProfesionalPerteneciente,
  Actividad, ActividadAsignada, SaldoPuntos, Avatar,
} from '@/types/database';
import {
  tiposUsuarios, nivelesApoyos, autonomiasOperativas,
  estadosVinculos, tiposActividades, estadosActividades,
  puntosOtorgados, rolesAdministradores, estadosValidacionesProfesionales,
  catalogIdByName,
} from './catalogs';

// ============================================================================
// Mapas de IDs string -> INT (estables y reproducibles)
// ============================================================================
export const usuarioIdMap = new Map<string, number>();
let _seq = 0;
const nextId = () => ++_seq;

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

// ============================================================================
// USUARIOS (clase base)
// ============================================================================
export const usuarios: Usuario[] = [];
export const pertenecientes: Perteneciente[] = [];
export const tutores: Tutor[] = [];
export const profesionales: Profesional[] = [];
export const administradores: Administrador[] = [];

const TIPO_PERT = catalogIdByName(tiposUsuarios, 'Perteneciente');
const TIPO_TUT = catalogIdByName(tiposUsuarios, 'Tutor');
const TIPO_PROF = catalogIdByName(tiposUsuarios, 'Profesional');
const TIPO_ADM = catalogIdByName(tiposUsuarios, 'Administrador');

const splitName = (full: string): [string, string] => {
  const parts = full.split(' ');
  return [parts.slice(0, -1).join(' ') || full, parts.slice(-1)[0] || ''];
};

const supportLevelToId = (lvl?: 'bajo' | 'medio' | 'alto'): number => {
  const map: Record<string, 'Bajo' | 'Medio' | 'Alto'> = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' };
  return catalogIdByName(nivelesApoyos, map[lvl ?? 'medio']);
};

// --- Pertenecientes ---------------------------------------------------------
// (sin datos estáticos: los usuarios ahora viven en el backend)

// --- Tutores ----------------------------------------------------------------
// (sin datos estáticos: los usuarios ahora viven en el backend)

// --- Profesionales ----------------------------------------------------------
// (sin datos estáticos: los usuarios ahora viven en el backend)

// --- Administradores --------------------------------------------------------
// (sin datos estáticos: los usuarios ahora viven en el backend)

// ============================================================================
// VÍNCULOS (Tutor-Perteneciente / Profesional-Perteneciente)
// ============================================================================
// VÍNCULOS (Tutor-Perteneciente / Profesional-Perteneciente)
// ============================================================================
export const vinculosTutorPertenecientes: VinculoTutorPerteneciente[] = [];
export const vinculosProfesionalPertenecientes: VinculoProfesionalPerteneciente[] = [];

// (sin datos estáticos: los vínculos ahora viven en el backend)

// ============================================================================
// PUNTOS Y AVATARES
// ============================================================================
export const saldosPuntos: SaldoPuntos[] = [];
export const avatares: Avatar[] = [];

// (sin datos estáticos: los saldos y avatares ahora viven en el backend)

// ============================================================================
// ACTIVIDADES (modelo base + asignaciones)
// ============================================================================
const tipoActividadIdByLegacy: Record<string, number> = {
  guiada: catalogIdByName(tiposActividades, 'Guiada'),
  juego: catalogIdByName(tiposActividades, 'Juego'),
  regulación: catalogIdByName(tiposActividades, 'Regulacion'),
  decisión: catalogIdByName(tiposActividades, 'Decision'),
};

const estadoActividadIdByLegacy: Record<string, number> = {
  pendiente: catalogIdByName(estadosActividades, 'Pendiente'),
  'en-progreso': catalogIdByName(estadosActividades, 'EnProgreso'),
  completada: catalogIdByName(estadosActividades, 'Completada'),
};

const PUNTO_MEDIO = catalogIdByName(puntosOtorgados, 'Medio');

export const actividades: Actividad[] = legacyActivities.map((a, i) => ({
  id: i + 1,
  id_tipo_actividad: tipoActividadIdByLegacy[a.type] ?? PUNTO_MEDIO,
  id_punto_otorgado: PUNTO_MEDIO,
  titulo: a.title, descripcion: a.description,
  es_integrada: true, activa: true,
}));

const actividadIdMap = new Map<string, number>(
  legacyActivities.map((a, i) => [a.id, i + 1]),
);

export const actividadesAsignadas: ActividadAsignada[] = [];
// (sin datos estáticos: las actividades asignadas ahora viven en el backend)

// ============================================================================
// HELPERS DE LECTURA (estilo SQL: getXxxById, joinXxx)
// ============================================================================

export const getUsuarioById = (id: number) => usuarios.find(u => u.id === id);
export const getUsuarioByLegacyId = (legacyId: string) => {
  const id = usuarioIdMap.get(legacyId);
  return id ? getUsuarioById(id) : undefined;
};

export const getPertenecienteByUsuario = (idUsuario: number) =>
  pertenecientes.find(p => p.id_usuario === idUsuario);

export const getTutorByUsuario = (idUsuario: number) =>
  tutores.find(t => t.id_usuario === idUsuario);

export const getProfesionalByUsuario = (idUsuario: number) =>
  profesionales.find(p => p.id_usuario === idUsuario);

export const getAdministradorByUsuario = (idUsuario: number) =>
  administradores.find(a => a.id_usuario === idUsuario);

/** Devuelve el perfil completo (Usuario + perfil concreto) según tipo. */
export const getPerfilCompleto = (idUsuario: number) => {
  const usuario = getUsuarioById(idUsuario);
  if (!usuario) return null;
  switch (usuario.id_tipo_usuario) {
    case TIPO_PERT:
      return { kind: 'perteneciente' as const, usuario, perteneciente: getPertenecienteByUsuario(idUsuario)! };
    case TIPO_TUT:
      return { kind: 'tutor' as const, usuario, tutor: getTutorByUsuario(idUsuario)! };
    case TIPO_PROF:
      return { kind: 'profesional' as const, usuario, profesional: getProfesionalByUsuario(idUsuario)! };
    case TIPO_ADM:
      return { kind: 'administrador' as const, usuario, administrador: getAdministradorByUsuario(idUsuario)! };
  }
  return null;
};

/** Pertenecientes vinculados a un tutor (PK INT). */
export const getPertenecientesDeTutor = (idTutor: number): Perteneciente[] =>
  vinculosTutorPertenecientes
    .filter(v => v.id_tutor === idTutor && v.fecha_fin === null)
    .map(v => pertenecientes.find(p => p.id === v.id_perteneciente)!)
    .filter(Boolean);

/** Pertenecientes en cartera de un profesional. */
export const getPertenecientesDeProfesional = (idProf: number): Perteneciente[] =>
  vinculosProfesionalPertenecientes
    .filter(v => v.id_profesional === idProf && v.fecha_resolucion !== null)
    .map(v => pertenecientes.find(p => p.id === v.id_perteneciente)!)
    .filter(Boolean);

export const getActividadesAsignadasDePerteneciente = (idPert: number): ActividadAsignada[] =>
  actividadesAsignadas.filter(a => a.id_perteneciente === idPert);

export const getSaldoPuntosDePerteneciente = (idPert: number): number =>
  saldosPuntos.find(s => s.id_perteneciente === idPert)?.saldo ?? 0;
