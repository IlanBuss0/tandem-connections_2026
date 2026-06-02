// ============================================================================
// TÁNDEM — Modelo de datos relacional (mapeo 1:1 con esquema SQL de producción)
// ----------------------------------------------------------------------------
// Convenciones de tipos:
//   INT / SMALLINT / TINYINT / BIGINT   -> number
//   VARCHAR / NVARCHAR                  -> string
//   BIT                                 -> boolean
//   DATE / DATETIME                     -> string (ISO 8601)
//   DECIMAL                             -> number
// Toda relación FK se expresa con el campo `id_xxx: number`.
// ============================================================================

// ===================== CATÁLOGOS / ENUMERADOS ===============================
// Cada catálogo se modela con (a) interface fila y (b) tipo literal de nombre.

export interface CatalogRow {
  id: number;
  nombre: string;
  orden: number;
}

// --- Tipos literales de los catálogos ---------------------------------------

export type TipoUsuarioNombre =
  | 'Perteneciente'
  | 'Tutor'
  | 'Profesional'
  | 'Administrador';

export type EstadoSuscripcionNombre =
  | 'Activa'
  | 'Pendiente'
  | 'Cancelada'
  | 'Vencida';

export type NivelApoyoNombre = 'Bajo' | 'Medio' | 'Alto';
export type AutonomiaOperativaNombre = 'Autogestionada' | 'Asistida' | 'Tutelada';

export type EstadoVinculoNombre =
  | 'Pendiente'
  | 'Activo'
  | 'Rechazado'
  | 'Finalizado';

export type TipoActividadNombre =
  | 'Guiada'
  | 'Juego'
  | 'Regulacion'
  | 'Decision'
  | 'Personalizada';

export type EstadoActividadNombre =
  | 'Pendiente'
  | 'EnProgreso'
  | 'Completada'
  | 'Cancelada';

export type DificultadActividadNombre = 'Facil' | 'Medio' | 'Avanzado';

export type RolAdministradorNombre = 'Developer' | 'SuperAdmin' | 'Soporte';

export type EstadoValidacionProfesionalNombre =
  | 'Pendiente'
  | 'Aprobado'
  | 'Rechazado';

export type TipoItemAvatarNombre =
  | 'Sombrero'
  | 'Cara'
  | 'Ropa'
  | 'Accesorio'
  | 'Fondo'
  | 'Mascota';

export type TipoMovimientoPuntoNombre =
  | 'Ganado'
  | 'Gastado'
  | 'CompraPaquete'
  | 'Ajuste';

export type EstadoPagoNombre = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Reembolsado';

export type TipoChatNombre = 'Directo' | 'Grupo' | 'Soporte';
export type TipoMensajeNombre = 'Texto' | 'Imagen' | 'Archivo' | 'Audio' | 'Sistema';
export type EstadoContactoNombre = 'Pendiente' | 'Aceptado' | 'Rechazado' | 'Bloqueado';

export type TipoArchivoNombre = 'Imagen' | 'Documento' | 'Audio' | 'Video' | 'Otro';
export type TipoPermisoArchivoNombre = 'Lectura' | 'Escritura' | 'Administracion';
export type AlcanceArchivoNombre = 'Privado' | 'Usuario' | 'Chat' | 'Publico';

export type TipoNotificacionNombre =
  | 'Sistema'
  | 'Actividad'
  | 'Vinculo'
  | 'Pago'
  | 'Mensaje'
  | 'ZonaSegura';

export type EstadoReporteNombre = 'Abierto' | 'EnRevision' | 'Resuelto' | 'Descartado';
export type TipoEventoZonaSeguraNombre = 'Entrada' | 'Salida';

export type PermisoPertenecienteNombre =
  | 'EditarPerfil'
  | 'CompletarActividades'
  | 'EnviarMensajes'
  | 'CrearActividadesPropias'
  | 'CompartirUbicacion'
  | 'GastarPuntos';

export type PermisoProfesionalNombre =
  | 'AsignarActividades'
  | 'CrearActividadesPersonalizadas'
  | 'VerHistorial'
  | 'AgendarSesiones'
  | 'EditarPerfilProfesional';

export type TipoEventoAuditoriaNombre =
  | 'Login'
  | 'Logout'
  | 'CrearEntidad'
  | 'ActualizarEntidad'
  | 'EliminarEntidad'
  | 'CambioPermisos';

export type EntidadAfectadaAuditoriaNombre =
  | 'Usuario'
  | 'Perteneciente'
  | 'Actividad'
  | 'Suscripcion'
  | 'Mensaje'
  | 'Archivo';

export type PuntoOtorgadoNombre = 'Bajo' | 'Medio' | 'Alto' | 'Bonus';

// --- Filas tipadas (todas extienden CatalogRow) -----------------------------

export interface TipoUsuario extends CatalogRow { nombre: TipoUsuarioNombre }
export interface EstadoSuscripcion extends CatalogRow { nombre: EstadoSuscripcionNombre }
export interface TipoEventoAuditoria extends CatalogRow { nombre: TipoEventoAuditoriaNombre }
export interface EntidadAfectadaAuditoria extends CatalogRow { nombre: EntidadAfectadaAuditoriaNombre }
export interface NivelApoyo extends CatalogRow { nombre: NivelApoyoNombre }
export interface AutonomiaOperativa extends CatalogRow { nombre: AutonomiaOperativaNombre }
export interface CatalogoPermisoPerteneciente extends CatalogRow { nombre: PermisoPertenecienteNombre }
export interface CatalogoPermisoProfesional extends CatalogRow { nombre: PermisoProfesionalNombre }
export interface EstadoVinculo extends CatalogRow { nombre: EstadoVinculoNombre }
export interface TipoActividad extends CatalogRow { nombre: TipoActividadNombre }
export interface EstadoActividad extends CatalogRow { nombre: EstadoActividadNombre }
export interface PuntoOtorgado extends CatalogRow { nombre: PuntoOtorgadoNombre }
export interface DificultadActividad extends CatalogRow { nombre: DificultadActividadNombre }
export interface RolAdministrador extends CatalogRow { nombre: RolAdministradorNombre }
export interface EstadoValidacionProfesional extends CatalogRow { nombre: EstadoValidacionProfesionalNombre }
export interface TipoItemAvatar extends CatalogRow { nombre: TipoItemAvatarNombre }
export interface TipoMovimientoPunto extends CatalogRow { nombre: TipoMovimientoPuntoNombre }
export interface EstadoPago extends CatalogRow { nombre: EstadoPagoNombre }
export interface TipoChat extends CatalogRow { nombre: TipoChatNombre }
export interface TipoMensaje extends CatalogRow { nombre: TipoMensajeNombre }
export interface EstadoContacto extends CatalogRow { nombre: EstadoContactoNombre }
export interface TipoArchivo extends CatalogRow { nombre: TipoArchivoNombre }
export interface TipoPermisoArchivo extends CatalogRow { nombre: TipoPermisoArchivoNombre }
export interface AlcanceArchivo extends CatalogRow { nombre: AlcanceArchivoNombre }
export interface TipoNotificacion extends CatalogRow { nombre: TipoNotificacionNombre }
export interface EstadoReporte extends CatalogRow { nombre: EstadoReporteNombre }
export interface TipoEventoZonaSegura extends CatalogRow { nombre: TipoEventoZonaSeguraNombre }

// ============================================================================
// USUARIOS Y PERFILES
// ============================================================================

export interface Usuario {
  id: number;
  id_tipo_usuario: number;          // FK -> TiposUsuarios.id
  nombre_usuario: string;            // UNIQUE
  contrasena_hash: string;
  nombre: string;
  apellido: string;
  correo: string;                    // UNIQUE
  telefono: number | null;
  fecha_nacimiento: string | null;   // ISO date
  fecha_ingreso: string;             // ISO date
  activo: boolean;
}

export interface Perteneciente {
  id: number;
  id_usuario: number;                          // FK UNIQUE
  id_nivel_apoyo: number;
  id_autonomia_operativa: number;
  puede_autogestionarse: boolean;
  observacion_general: string | null;
}

export interface Tutor {
  id: number;
  id_usuario: number;          // FK UNIQUE
  parentesco: string | null;
}

export interface Profesional {
  id: number;
  id_usuario: number;                  // FK UNIQUE
  profesion: string;
  especialidad: string | null;
  matricula: string;                   // UNIQUE
  institucion: string | null;
  id_estado_validacion: number;
}

export interface Administrador {
  id: number;
  id_usuario: number;          // FK UNIQUE
  id_rol: number;
}

// ============================================================================
// CONFIGURACIÓN GENERAL Y ACCESIBILIDAD
// ============================================================================

export interface ConfiguracionUsuario {
  id: number;
  id_usuario: number;
  clave: string;
  valor: string;
  fecha_modificacion: string; // DATETIME ISO
}

export interface ConfiguracionAccesibilidad {
  id: number;
  id_usuario: number;
  clave: string;
  valor: string;
  fecha_modificacion: string;
}

// ============================================================================
// PERMISOS DEL PERTENECIENTE Y PROFESIONAL
// ============================================================================

export interface PermisoOtorgadoPerteneciente {
  id: number;
  id_perteneciente: number;
  id_permiso_perteneciente: number;
  habilitado: boolean;
  id_usuario_modificador: number;
  fecha_modificacion: string;
}

export interface HistorialPermisoOtorgadoPerteneciente {
  id: number;
  id_perteneciente: number;
  id_permiso_perteneciente: number;
  habilitado_anterior: boolean | null;
  habilitado_nuevo: boolean;
  id_usuario_modificador: number;
  motivo: string | null;
  fecha_modificacion: string;
}

export interface PermisoOtorgadoProfesional {
  id: number;
  id_vinculo_profesional_perteneciente: number;
  id_permiso_profesional: number;
  habilitado: boolean;
  id_usuario_modificador: number;
  fecha_modificacion: string;
}

export interface HistorialPermisoOtorgadoProfesional {
  id: number;
  id_vinculo_profesional_perteneciente: number;
  id_permiso_profesional: number;
  habilitado_anterior: boolean | null;
  habilitado_nuevo: boolean;
  id_usuario_modificador: number;
  motivo: string | null;
  fecha_modificacion: string;
}

// ============================================================================
// VÍNCULOS
// ============================================================================

export interface VinculoTutorPerteneciente {
  id: number;
  id_tutor: number;
  id_perteneciente: number;
  es_tutor_principal: boolean;
  id_estado_vinculo: number;
  fecha_alta: string;
  fecha_fin: string | null;
  id_usuario_creador: number | null;
}

export interface VinculoProfesionalPerteneciente {
  id: number;
  id_profesional: number;
  id_perteneciente: number;
  id_estado_vinculo: number;
  requiere_aprobacion_tutor: boolean;
  fue_aprobado_por_tutor: boolean;
  id_tutor_aprobador: number | null;
  fecha_solicitud: string;
  fecha_resolucion: string | null;
}

// ============================================================================
// VALIDACIONES Y EVALUACIONES
// ============================================================================

export interface ValidacionProfesional {
  id: number;
  id_profesional: number;
  numero_matricula: string;
  titulo_profesional: string;
  documento_dni_url: string | null;
  id_estado_validacion: number;
  observacion: string | null;
  id_administrador_validador: number | null;
  fecha_validacion: string | null;
}

export interface EvaluacionAutonomia {
  id: number;
  id_perteneciente: number;
  id_profesional: number | null;
  id_nivel_apoyo_anterior: number | null;
  id_nivel_apoyo_nuevo: number;
  id_autonomia_operativa_anterior: number | null;
  id_autonomia_operativa_nueva: number;
  puede_autogestionarse_nuevo: boolean;
  observacion: string | null;
  fecha_evaluacion: string;
}

// ============================================================================
// AVATAR Y PUNTOS
// ============================================================================

export interface Avatar {
  id: number;
  id_perteneciente: number;
  nivel: number;
  experiencia: number;
  avatar_api: string | null;
  avatar_externo_id: string | null;
  avatar_json: string | null;
}

export interface ItemAvatar {
  id: number;
  id_tipo_item_avatar: number;
  nombre: string;
  codigo_item_externo: string | null;
  precio_punto: number;
  requiere_cantidad_actividad: number | null;
  requiere_id_dificultad_actividad: number | null;
  activo: boolean;
}

export interface InventarioAvatar {
  id: number;
  id_avatar: number;
  id_item_avatar: number;
  equipado: boolean;
  fecha_obtencion: string;
}

export interface SaldoPuntos {
  id: number;
  id_perteneciente: number;
  saldo: number;
}

export interface MovimientoPunto {
  id: number;
  id_perteneciente: number;
  id_tipo_movimiento_punto: number;
  cantidad: number;
  descripcion: string | null;
  fecha_movimiento: string;
}

// ============================================================================
// ACTIVIDADES
// ============================================================================

export interface Actividad {
  id: number;
  id_tipo_actividad: number;
  id_punto_otorgado: number;
  titulo: string;
  descripcion: string | null;
  es_integrada: boolean;
  activa: boolean;
}

export interface ActividadPersonalizada {
  id: number;
  id_actividad_base: number | null;
  id_tipo_actividad: number;
  id_punto_otorgado: number;
  id_usuario_creador: number;
  titulo: string;
  descripcion: string | null;
  fecha_creacion: string;
  activa: boolean;
}

export interface ActividadAsignada {
  id: number;
  id_actividad: number | null;
  id_actividad_personalizada: number | null;
  id_perteneciente: number;
  id_usuario_asignador: number;
  id_estado_actividad: number;
  fecha_asignacion: string;
  fecha_completada: string | null;
}

export interface FavoritoActividad {
  id: number;
  id_perteneciente: number;
  id_actividad: number | null;
  id_actividad_personalizada: number | null;
  fecha_marcado: string;
}

export interface CalificacionActividad {
  id: number;
  id_perteneciente: number;
  id_actividad: number | null;
  id_actividad_personalizada: number | null;
  puntaje_usuario: number; // 1..5
  id_dificultad_actividad: number | null;
  fecha_calificacion: string;
}

// ============================================================================
// SESIONES
// ============================================================================

export interface SesionProfesional {
  id: number;
  id_profesional: number;
  id_perteneciente: number;
  fecha_sesion: string;
  nota_sesion: string | null;
  recomendacion: string | null;
}

// ============================================================================
// SUSCRIPCIONES Y PAGOS
// ============================================================================

export interface PlanSuscripcion {
  id: number;
  nombre_plan: string;
  descripcion: string | null;
  precio_mensual: number | null;
  precio_anual: number | null;
  activo: boolean;
}

export interface Suscripcion {
  id: number;
  id_usuario_contratante: number;
  id_plan_suscripcion: number;
  id_estado_suscripcion: number;
  fecha_inicio: string;
  fecha_fin: string | null;
}

export interface BeneficiarioSuscripcion {
  id: number;
  id_suscripcion: number;
  id_usuario_beneficiario: number;
}

export interface PagoSuscripcion {
  id: number;
  id_suscripcion: number;
  id_estado_pago: number;
  monto: number;
  comprobante_url: string | null;
  pagado: boolean;
  fecha_pago: string;
}

export interface PaquetePuntos {
  id: number;
  nombre: string;
  cantidad_punto: number;
  precio: number;
  activo: boolean;
}

export interface CompraPuntos {
  id: number;
  id_usuario: number;
  id_perteneciente: number;
  id_paquete_punto: number;
  id_estado_pago: number;
  comprobante_url: string | null;
  pagado: boolean;
  fecha_compra: string;
}

// ============================================================================
// CONTACTOS
// ============================================================================

export interface Contacto {
  id: number;
  id_usuario_menor: number;     // < id_usuario_mayor
  id_usuario_mayor: number;
  id_usuario_solicitante: number;
  id_estado_contacto: number;
  fecha_solicitud: string;
  fecha_resolucion: string | null;
}

// ============================================================================
// CHATS
// ============================================================================

export interface Chat {
  id: number;
  id_tipo_chat: number;
  nombre: string | null;
  descripcion?: string | null;
  fecha_creacion: string;
  activo: boolean;
}

export interface ParticipanteChat {
  id: number;
  id_chat: number;
  id_usuario: number;
  fecha_ingreso: string;
  fecha_salida: string | null;
}

export interface Mensaje {
  id: number;
  id_chat: number;
  id_usuario_emisor: number;
  id_tipo_mensaje: number;
  contenido: string | null;
  fecha_envio: string;
  eliminado: boolean;
}

// ============================================================================
// ARCHIVOS
// ============================================================================

export interface Archivo {
  id: number;
  id_usuario_creador: number;
  id_tipo_archivo: number;
  nombre_archivo: string;
  url: string;
  fecha_subida: string;
  activo: boolean;
}

export interface MensajeArchivo {
  id: number;
  id_mensaje: number;
  id_archivo: number;
}

export interface PermisoArchivo {
  id: number;
  id_archivo: number;
  id_alcance_archivo: number;
  id_tipo_permiso_archivo: number;
  id_usuario: number | null;
  id_chat: number | null;
}

// ============================================================================
// GEOLOCALIZACIÓN
// ============================================================================

export interface Dispositivo {
  id: number;
  id_usuario: number;
  nombre: string | null;
  identificador_dispositivo: string | null;
  activo: boolean;
  fecha_alta: string;
}

export interface UbicacionActual {
  id: number;
  id_dispositivo: number;     // UNIQUE
  latitud: number;
  longitud: number;
  fecha_registro: string;
}

export interface UbicacionHistorial {
  id: number;
  id_dispositivo: number;
  latitud: number;
  longitud: number;
  fecha_registro: string;
}

export interface ZonaSegura {
  id: number;
  id_perteneciente: number;
  id_tutor_creador: number;
  nombre: string;
  latitud: number;
  longitud: number;
  radio_metro: number;
  notificar_entrada: boolean;
  notificar_salida: boolean;
  activa: boolean;
}

export interface EventoZonaSegura {
  id: number;
  id_zona_segura: number;
  id_dispositivo: number;
  id_tipo_evento_zona_segura: number;
  fecha_evento: string;
}

// ============================================================================
// TIENDA / PERFIL PROFESIONAL
// ============================================================================

export interface PerfilProfesional {
  id: number;
  id_profesional: number;     // UNIQUE
  descripcion: string | null;
  experiencia: string | null;
  precio_sesion: number | null;
  informacion_precio: string | null;
  visible_en_tienda: boolean;
}

export interface ResenaProfesional {
  id: number;
  id_profesional: number;
  id_usuario: number;
  puntaje: number;            // 0..5
  comentario: string | null;
  fecha_resena: string;
}

// ============================================================================
// NOTIFICACIONES
// ============================================================================

export interface Notificacion {
  id: number;
  id_usuario_destino: number;
  id_usuario_actor: number | null;
  id_tipo_notificacion: number;
  titulo: string;
  cuerpo: string | null;
  leida: boolean;
  fecha_creacion: string;
  fecha_lectura: string | null;
}

// ============================================================================
// SEGURIDAD, BLOQUEOS Y REPORTES
// ============================================================================

export interface BloqueoUsuario {
  id: number;
  id_usuario_bloqueador: number;
  id_usuario_bloqueado: number;
  motivo: string | null;
  activo: boolean;
  fecha_bloqueo: string;
}

export interface ReporteUsuario {
  id: number;
  id_usuario_reportante: number;
  id_usuario_reportado: number | null;
  id_mensaje: number | null;
  id_archivo: number | null;
  id_estado_reporte: number;
  motivo: string;
  detalle: string | null;
  fecha_reporte: string;
}

// ============================================================================
// AUDITORÍA
// ============================================================================

export interface AuditoriaEvento {
  id: number;
  id_usuario_actor: number | null;
  id_tipo_evento_auditoria: number;
  id_entidad_afectada_auditoria: number;
  id_entidad_afectada: number;
  descripcion: string | null;
  fecha_evento: string;
}

// ============================================================================
// AGREGADOS / VISTAS PARA UI (no son tablas, son tipos derivados convenientes)
// ============================================================================

/** Usuario completo con su perfil concreto, listo para consumir desde la UI. */
export type PerfilCompletoPerteneciente = {
  usuario: Usuario;
  perteneciente: Perteneciente;
};
export type PerfilCompletoTutor = { usuario: Usuario; tutor: Tutor };
export type PerfilCompletoProfesional = { usuario: Usuario; profesional: Profesional };
export type PerfilCompletoAdministrador = { usuario: Usuario; administrador: Administrador };

export type PerfilCompleto =
  | ({ kind: 'perteneciente' } & PerfilCompletoPerteneciente)
  | ({ kind: 'tutor' } & PerfilCompletoTutor)
  | ({ kind: 'profesional' } & PerfilCompletoProfesional)
  | ({ kind: 'administrador' } & PerfilCompletoAdministrador);
