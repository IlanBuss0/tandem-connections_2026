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
  users as legacyUsers,
  tutors as legacyTutors,
  professionals as legacyProfessionals,
  admins as legacyAdmins,
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
for (const u of legacyUsers) {
  const id = nextId();
  usuarioIdMap.set(u.id, id);
  const [nombre, apellido] = splitName(u.name);
  usuarios.push({
    id, id_tipo_usuario: TIPO_PERT,
    nombre_usuario: u.username, contrasena_hash: u.password,
    nombre, apellido, correo: u.email, telefono: null,
    fecha_nacimiento: null, fecha_ingreso: today(), activo: true,
  });
  pertenecientes.push({
    id: pertenecientes.length + 1, id_usuario: id,
    id_nivel_apoyo: supportLevelToId(u.supportLevel),
    id_autonomia_operativa: catalogIdByName(autonomiasOperativas,
      u.supportLevel === 'bajo' ? 'Autogestionada' : u.supportLevel === 'alto' ? 'Tutelada' : 'Asistida'),
    puede_autogestionarse: u.supportLevel === 'bajo',
    observacion_general: u.bio ?? null,
  });
}

// --- Tutores ----------------------------------------------------------------
for (const t of legacyTutors) {
  const id = nextId();
  usuarioIdMap.set(t.id, id);
  const [nombre, apellido] = splitName(t.name);
  usuarios.push({
    id, id_tipo_usuario: TIPO_TUT,
    nombre_usuario: t.username, contrasena_hash: t.password,
    nombre, apellido, correo: t.email,
    telefono: Number((t.phone || '').replace(/\D/g, '')) || null,
    fecha_nacimiento: null, fecha_ingreso: today(), activo: true,
  });
  tutores.push({ id: tutores.length + 1, id_usuario: id, parentesco: t.relation });
}

// --- Profesionales ----------------------------------------------------------
const ESTADO_VAL_APROBADO = catalogIdByName(estadosValidacionesProfesionales, 'Aprobado');
for (const p of legacyProfessionals) {
  const id = nextId();
  usuarioIdMap.set(p.id, id);
  const [nombre, apellido] = splitName(p.name);
  usuarios.push({
    id, id_tipo_usuario: TIPO_PROF,
    nombre_usuario: p.username, contrasena_hash: p.password,
    nombre, apellido, correo: p.email,
    telefono: Number((p.phone || '').replace(/\D/g, '')) || null,
    fecha_nacimiento: null, fecha_ingreso: today(), activo: true,
  });
  profesionales.push({
    id: profesionales.length + 1, id_usuario: id,
    profesion: p.specialty.split(' - ')[0] ?? p.specialty,
    especialidad: p.specialty.split(' - ')[1] ?? null,
    matricula: `MAT-${p.id.toUpperCase()}`,
    institucion: null,
    id_estado_validacion: ESTADO_VAL_APROBADO,
  });
}

// --- Administradores --------------------------------------------------------
for (const a of legacyAdmins) {
  const id = nextId();
  usuarioIdMap.set(a.id, id);
  const [nombre, apellido] = splitName(a.name);
  usuarios.push({
    id, id_tipo_usuario: TIPO_ADM,
    nombre_usuario: a.username, contrasena_hash: a.password,
    nombre, apellido, correo: a.email, telefono: null,
    fecha_nacimiento: null, fecha_ingreso: today(), activo: true,
  });
  administradores.push({
    id: administradores.length + 1, id_usuario: id,
    id_rol: catalogIdByName(rolesAdministradores,
      a.clearance === 'developer' ? 'Developer' : 'SuperAdmin'),
  });
}

// ============================================================================
// VÍNCULOS (Tutor-Perteneciente / Profesional-Perteneciente)
// ============================================================================
export const vinculosTutorPertenecientes: VinculoTutorPerteneciente[] = [];
export const vinculosProfesionalPertenecientes: VinculoProfesionalPerteneciente[] = [];

const ESTADO_VINC_ACTIVO = catalogIdByName(estadosVinculos, 'Activo');
const pertByUsuarioId = new Map(pertenecientes.map(p => [p.id_usuario, p.id]));
const tutorByUsuarioId = new Map(tutores.map(t => [t.id_usuario, t.id]));
const profByUsuarioId = new Map(profesionales.map(p => [p.id_usuario, p.id]));

for (const t of legacyTutors) {
  const tutorPK = tutorByUsuarioId.get(usuarioIdMap.get(t.id)!);
  if (!tutorPK) continue;
  t.linkedUserIds.forEach((uId, idx) => {
    const pertPK = pertByUsuarioId.get(usuarioIdMap.get(uId)!);
    if (!pertPK) return;
    vinculosTutorPertenecientes.push({
      id: vinculosTutorPertenecientes.length + 1,
      id_tutor: tutorPK, id_perteneciente: pertPK,
      es_tutor_principal: idx === 0,
      id_estado_vinculo: ESTADO_VINC_ACTIVO,
      fecha_alta: today(), fecha_fin: null,
      id_usuario_creador: null,
    });
  });
}

for (const p of legacyProfessionals) {
  const profPK = profByUsuarioId.get(usuarioIdMap.get(p.id)!);
  if (!profPK) continue;
  p.linkedUserIds.forEach(uId => {
    const pertPK = pertByUsuarioId.get(usuarioIdMap.get(uId)!);
    if (!pertPK) return;
    vinculosProfesionalPertenecientes.push({
      id: vinculosProfesionalPertenecientes.length + 1,
      id_profesional: profPK, id_perteneciente: pertPK,
      id_estado_vinculo: ESTADO_VINC_ACTIVO,
      requiere_aprobacion_tutor: true, fue_aprobado_por_tutor: true,
      id_tutor_aprobador: null,
      fecha_solicitud: today(), fecha_resolucion: today(),
    });
  });
}

// ============================================================================
// PUNTOS Y AVATARES (saldo derivado de legacy points)
// ============================================================================
export const saldosPuntos: SaldoPuntos[] = legacyUsers.map((u, i) => ({
  id: i + 1,
  id_perteneciente: pertByUsuarioId.get(usuarioIdMap.get(u.id)!)!,
  saldo: u.points,
}));

export const avatares: Avatar[] = legacyUsers.map((u, i) => ({
  id: i + 1,
  id_perteneciente: pertByUsuarioId.get(usuarioIdMap.get(u.id)!)!,
  nivel: u.level, experiencia: u.points,
  avatar_api: 'emoji', avatar_externo_id: u.avatar, avatar_json: null,
}));

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

export const actividadesAsignadas: ActividadAsignada[] = legacyActivities
  .filter(a => !!a.assignedTo)
  .map((a, i) => {
    const pertPK = pertByUsuarioId.get(usuarioIdMap.get(a.assignedTo!)!);
    return {
      id: i + 1,
      id_actividad: actividadIdMap.get(a.id)!,
      id_actividad_personalizada: null,
      id_perteneciente: pertPK!,
      id_usuario_asignador: pertPK ? (
        // Asume primer tutor vinculado como asignador, sino el propio usuario
        usuarios.find(u => u.id_tipo_usuario === TIPO_TUT)?.id ?? usuarios[0].id
      ) : usuarios[0].id,
      id_estado_actividad: estadoActividadIdByLegacy[a.status] ?? estadoActividadIdByLegacy.pendiente,
      fecha_asignacion: today(),
      fecha_completada: a.status === 'completada' ? today() : null,
    };
  })
  .filter(a => !!a.id_perteneciente);

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
