// ============================================================================
// TÁNDEM — Seeds de catálogos (mapean tablas TiposXxx / EstadosXxx del SQL)
// ============================================================================
import type {
  TipoUsuario, EstadoSuscripcion, TipoEventoAuditoria, EntidadAfectadaAuditoria,
  NivelApoyo, AutonomiaOperativa, CatalogoPermisoPerteneciente, CatalogoPermisoProfesional,
  EstadoVinculo, TipoActividad, EstadoActividad, PuntoOtorgado, DificultadActividad,
  RolAdministrador, EstadoValidacionProfesional, TipoItemAvatar, TipoMovimientoPunto,
  EstadoPago, TipoChat, TipoMensaje, EstadoContacto, TipoArchivo, TipoPermisoArchivo,
  AlcanceArchivo, TipoNotificacion, EstadoReporte, TipoEventoZonaSegura,
} from '@/types/database';

// Helper para construir filas con autoincrement.
const seed = <T extends { nombre: string }>(rows: T[]): (T & { id: number; orden: number })[] =>
  rows.map((r, i) => ({ ...r, id: i + 1, orden: i + 1 }));

export const tiposUsuarios: TipoUsuario[] = seed([
  { nombre: 'Perteneciente' as const },
  { nombre: 'Tutor' as const },
  { nombre: 'Profesional' as const },
  { nombre: 'Administrador' as const },
]) as TipoUsuario[];

export const estadosSuscripciones: EstadoSuscripcion[] = seed([
  { nombre: 'Activa' as const }, { nombre: 'Pendiente' as const },
  { nombre: 'Cancelada' as const }, { nombre: 'Vencida' as const },
]) as EstadoSuscripcion[];

export const nivelesApoyos: NivelApoyo[] = seed([
  { nombre: 'Bajo' as const }, { nombre: 'Medio' as const }, { nombre: 'Alto' as const },
]) as NivelApoyo[];

export const autonomiasOperativas: AutonomiaOperativa[] = seed([
  { nombre: 'Autogestionada' as const }, { nombre: 'Asistida' as const }, { nombre: 'Tutelada' as const },
]) as AutonomiaOperativa[];

export const catalogoPermisosPertenecientes: CatalogoPermisoPerteneciente[] = seed([
  { nombre: 'EditarPerfil' as const }, { nombre: 'CompletarActividades' as const },
  { nombre: 'EnviarMensajes' as const }, { nombre: 'CrearActividadesPropias' as const },
  { nombre: 'CompartirUbicacion' as const }, { nombre: 'GastarPuntos' as const },
]) as CatalogoPermisoPerteneciente[];

export const catalogoPermisosProfesionales: CatalogoPermisoProfesional[] = seed([
  { nombre: 'AsignarActividades' as const }, { nombre: 'CrearActividadesPersonalizadas' as const },
  { nombre: 'VerHistorial' as const }, { nombre: 'AgendarSesiones' as const },
  { nombre: 'EditarPerfilProfesional' as const },
]) as CatalogoPermisoProfesional[];

export const estadosVinculos: EstadoVinculo[] = seed([
  { nombre: 'Pendiente' as const }, { nombre: 'Activo' as const },
  { nombre: 'Rechazado' as const }, { nombre: 'Finalizado' as const },
]) as EstadoVinculo[];

export const tiposActividades: TipoActividad[] = seed([
  { nombre: 'Guiada' as const }, { nombre: 'Juego' as const },
  { nombre: 'Regulacion' as const }, { nombre: 'Decision' as const },
  { nombre: 'Personalizada' as const },
]) as TipoActividad[];

export const estadosActividades: EstadoActividad[] = seed([
  { nombre: 'Pendiente' as const }, { nombre: 'EnProgreso' as const },
  { nombre: 'Completada' as const }, { nombre: 'Cancelada' as const },
]) as EstadoActividad[];

export const puntosOtorgados: PuntoOtorgado[] = seed([
  { nombre: 'Bajo' as const }, { nombre: 'Medio' as const },
  { nombre: 'Alto' as const }, { nombre: 'Bonus' as const },
]) as PuntoOtorgado[];

export const dificultadesActividades: DificultadActividad[] = seed([
  { nombre: 'Facil' as const }, { nombre: 'Medio' as const }, { nombre: 'Avanzado' as const },
]) as DificultadActividad[];

export const rolesAdministradores: RolAdministrador[] = seed([
  { nombre: 'Developer' as const }, { nombre: 'SuperAdmin' as const }, { nombre: 'Soporte' as const },
]) as RolAdministrador[];

export const estadosValidacionesProfesionales: EstadoValidacionProfesional[] = seed([
  { nombre: 'Pendiente' as const }, { nombre: 'Aprobado' as const }, { nombre: 'Rechazado' as const },
]) as EstadoValidacionProfesional[];

export const tiposItemsAvatares: TipoItemAvatar[] = seed([
  { nombre: 'Sombrero' as const }, { nombre: 'Cara' as const }, { nombre: 'Ropa' as const },
  { nombre: 'Accesorio' as const }, { nombre: 'Fondo' as const }, { nombre: 'Mascota' as const },
]) as TipoItemAvatar[];

export const tiposMovimientosPuntos: TipoMovimientoPunto[] = seed([
  { nombre: 'Ganado' as const }, { nombre: 'Gastado' as const },
  { nombre: 'CompraPaquete' as const }, { nombre: 'Ajuste' as const },
]) as TipoMovimientoPunto[];

export const estadosPagos: EstadoPago[] = seed([
  { nombre: 'Pendiente' as const }, { nombre: 'Aprobado' as const },
  { nombre: 'Rechazado' as const }, { nombre: 'Reembolsado' as const },
]) as EstadoPago[];

export const tiposChats: TipoChat[] = seed([
  { nombre: 'Directo' as const }, { nombre: 'Grupo' as const }, { nombre: 'Soporte' as const },
]) as TipoChat[];

export const tiposMensajes: TipoMensaje[] = seed([
  { nombre: 'Texto' as const }, { nombre: 'Imagen' as const }, { nombre: 'Archivo' as const },
  { nombre: 'Audio' as const }, { nombre: 'Sistema' as const },
]) as TipoMensaje[];

export const estadosContactos: EstadoContacto[] = seed([
  { nombre: 'Pendiente' as const }, { nombre: 'Aceptado' as const },
  { nombre: 'Rechazado' as const }, { nombre: 'Bloqueado' as const },
]) as EstadoContacto[];

export const tiposArchivos: TipoArchivo[] = seed([
  { nombre: 'Imagen' as const }, { nombre: 'Documento' as const },
  { nombre: 'Audio' as const }, { nombre: 'Video' as const }, { nombre: 'Otro' as const },
]) as TipoArchivo[];

export const tiposPermisosArchivos: TipoPermisoArchivo[] = seed([
  { nombre: 'Lectura' as const }, { nombre: 'Escritura' as const },
  { nombre: 'Administracion' as const },
]) as TipoPermisoArchivo[];

export const alcancesArchivos: AlcanceArchivo[] = seed([
  { nombre: 'Privado' as const }, { nombre: 'Usuario' as const },
  { nombre: 'Chat' as const }, { nombre: 'Publico' as const },
]) as AlcanceArchivo[];

export const tiposNotificaciones: TipoNotificacion[] = seed([
  { nombre: 'Sistema' as const }, { nombre: 'Actividad' as const },
  { nombre: 'Vinculo' as const }, { nombre: 'Pago' as const },
  { nombre: 'Mensaje' as const }, { nombre: 'ZonaSegura' as const },
]) as TipoNotificacion[];

export const estadosReportes: EstadoReporte[] = seed([
  { nombre: 'Abierto' as const }, { nombre: 'EnRevision' as const },
  { nombre: 'Resuelto' as const }, { nombre: 'Descartado' as const },
]) as EstadoReporte[];

export const tiposEventosZonasSeguras: TipoEventoZonaSegura[] = seed([
  { nombre: 'Entrada' as const }, { nombre: 'Salida' as const },
]) as TipoEventoZonaSegura[];

export const tiposEventosAuditorias: TipoEventoAuditoria[] = seed([
  { nombre: 'Login' as const }, { nombre: 'Logout' as const },
  { nombre: 'CrearEntidad' as const }, { nombre: 'ActualizarEntidad' as const },
  { nombre: 'EliminarEntidad' as const }, { nombre: 'CambioPermisos' as const },
]) as TipoEventoAuditoria[];

export const entidadesAfectadasAuditorias: EntidadAfectadaAuditoria[] = seed([
  { nombre: 'Usuario' as const }, { nombre: 'Perteneciente' as const },
  { nombre: 'Actividad' as const }, { nombre: 'Suscripcion' as const },
  { nombre: 'Mensaje' as const }, { nombre: 'Archivo' as const },
]) as EntidadAfectadaAuditoria[];

// =====================  Helpers de catálogo  ================================

export const catalogIdByName = <T extends { id: number; nombre: string }>(
  rows: T[], nombre: T['nombre'],
): number => rows.find(r => r.nombre === nombre)?.id ?? 0;

export const catalogNameById = <T extends { id: number; nombre: string }>(
  rows: T[], id: number,
): T['nombre'] | undefined => rows.find(r => r.id === id)?.nombre;
