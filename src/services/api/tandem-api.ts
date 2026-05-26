import { CrudApiService } from "./crud";
import { apiRequest, unwrapApiData, type ApiEnvelope } from "./client";
import type {
  Administrador,
  AlcanceArchivo,
  Archivo,
  AuditoriaEvento,
  AutonomiaOperativa,
  Avatar,
  BeneficiarioSuscripcion,
  BloqueoUsuario,
  CalificacionActividad,
  CatalogoPermisoPerteneciente,
  CatalogoPermisoProfesional,
  Chat,
  CompraPuntos,
  ConfiguracionAccesibilidad,
  ConfiguracionUsuario,
  Contacto,
  DificultadActividad,
  Dispositivo,
  EntidadAfectadaAuditoria,
  EstadoActividad,
  EstadoContacto,
  EstadoPago,
  EstadoReporte,
  EstadoSuscripcion,
  EstadoValidacionProfesional,
  EstadoVinculo,
  EventoZonaSegura,
  EvaluacionAutonomia,
  FavoritoActividad,
  HistorialPermisoOtorgadoPerteneciente,
  HistorialPermisoOtorgadoProfesional,
  InventarioAvatar,
  ItemAvatar,
  Mensaje,
  MensajeArchivo,
  MovimientoPunto,
  NivelApoyo,
  Notificacion,
  PagoSuscripcion,
  PaquetePuntos,
  ParticipanteChat,
  Perteneciente,
  PerfilProfesional,
  PermisoArchivo,
  PermisoOtorgadoPerteneciente,
  PermisoOtorgadoProfesional,
  PlanSuscripcion,
  Profesional,
  PuntoOtorgado,
  ReporteUsuario,
  ResenaProfesional,
  RolAdministrador,
  SaldoPuntos,
  SesionProfesional,
  TipoActividad,
  TipoArchivo,
  TipoChat,
  TipoEventoAuditoria,
  TipoEventoZonaSegura,
  TipoItemAvatar,
  TipoMensaje,
  TipoMovimientoPunto,
  TipoNotificacion,
  TipoPermisoArchivo,
  TipoUsuario,
  Tutor,
  UbicacionActual,
  UbicacionHistorial,
  Usuario,
  ValidacionProfesional,
  VinculoProfesionalPerteneciente,
  VinculoTutorPerteneciente,
  ZonaSegura,
  Actividad,
  ActividadAsignada,
  ActividadPersonalizada,
} from "@/types/database";

export type AuthPayload = {
  user: Omit<Usuario, "contrasena_hash">;
  token: string;
};

export type LoginRequest = {
  correo?: string;
  nombre_usuario?: string;
  contrasena: string;
};

export type RegisterRequest = Partial<Usuario> & {
  contrasena?: string;
};

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthPayload> {
    const response = await apiRequest<ApiEnvelope<AuthPayload>>("/api/auth/login", {
      method: "POST",
      body: payload,
    });

    return unwrapApiData(response);
  },

  async register(payload: RegisterRequest): Promise<AuthPayload> {
    const response = await apiRequest<ApiEnvelope<AuthPayload>>("/api/auth/register", {
      method: "POST",
      body: payload,
    });

    return unwrapApiData(response);
  },

  async me(token: string): Promise<Omit<Usuario, "contrasena_hash">> {
    const response = await apiRequest<ApiEnvelope<Omit<Usuario, "contrasena_hash">>>(
      "/api/auth/me",
      { token }
    );

    return unwrapApiData(response);
  },
};

export const tandemApi = {
  auth: authApi,
  usuarios: new CrudApiService<Usuario>("/api/usuarios"),
  pertenecientes: new CrudApiService<Perteneciente>("/api/pertenecientes"),
  tutores: new CrudApiService<Tutor>("/api/tutores"),
  profesionales: new CrudApiService<Profesional>("/api/profesionales"),
  actividades: new CrudApiService<Actividad>("/api/actividades"),
  actividadesPersonalizadas: new CrudApiService<ActividadPersonalizada>("/api/actividades-personalizadas"),
  actividadesAsignadas: new CrudApiService<ActividadAsignada>("/api/actividades-asignadas"),
  favoritosActividades: new CrudApiService<FavoritoActividad>("/api/favoritos-actividades"),
  calificacionesActividades: new CrudApiService<CalificacionActividad>("/api/calificaciones-actividades"),
  avatares: new CrudApiService<Avatar>("/api/avatares"),
  saldosPuntos: new CrudApiService<SaldoPuntos>("/api/saldos-puntos"),
  movimientosPuntos: new CrudApiService<MovimientoPunto>("/api/movimientos-puntos"),
  evaluacionesAutonomias: new CrudApiService<EvaluacionAutonomia>("/api/evaluaciones-autonomias"),
  zonasSeguras: new CrudApiService<ZonaSegura>("/api/zonas-seguras"),
  inventariosAvatares: new CrudApiService<InventarioAvatar>("/api/inventarios-avatares"),
  itemsAvatares: new CrudApiService<ItemAvatar>("/api/items-avatares"),
  eventosZonasSeguras: new CrudApiService<EventoZonaSegura>("/api/eventos-zonas-seguras"),
  comprasPuntos: new CrudApiService<CompraPuntos>("/api/compras-puntos"),
  sesionesProfesionales: new CrudApiService<SesionProfesional>("/api/sesiones-profesionales"),
  dispositivos: new CrudApiService<Dispositivo>("/api/dispositivos"),
  ubicacionesActuales: new CrudApiService<UbicacionActual>("/api/ubicaciones-actuales"),
  ubicacionesHistoriales: new CrudApiService<UbicacionHistorial>("/api/ubicaciones-historiales"),
  notificaciones: new CrudApiService<Notificacion>("/api/notificaciones"),
  contactos: new CrudApiService<Contacto>("/api/contactos"),
  chats: new CrudApiService<Chat>("/api/chats"),
  participantesChats: new CrudApiService<ParticipanteChat>("/api/participantes-chats"),
  mensajes: new CrudApiService<Mensaje>("/api/mensajes"),
  bloqueosUsuarios: new CrudApiService<BloqueoUsuario>("/api/bloqueos-usuarios"),
  configuracionesUsuarios: new CrudApiService<ConfiguracionUsuario>("/api/configuraciones-usuarios"),
  configuracionesAccesibilidad: new CrudApiService<ConfiguracionAccesibilidad>("/api/configuraciones-accesibilidad"),
  reportesUsuarios: new CrudApiService<ReporteUsuario>("/api/reportes-usuarios"),
  alcancesArchivos: new CrudApiService<AlcanceArchivo>("/api/alcances-archivos"),
  archivos: new CrudApiService<Archivo>("/api/archivos"),
  auditoriasEventos: new CrudApiService<AuditoriaEvento>("/api/auditorias-eventos"),
  autonomiasOperativas: new CrudApiService<AutonomiaOperativa>("/api/autonomias-operativas"),
  beneficiariosSuscripciones: new CrudApiService<BeneficiarioSuscripcion>("/api/beneficiarios-suscripciones"),
  catalogosPermisosPertenecientes: new CrudApiService<CatalogoPermisoPerteneciente>("/api/catalogos-permisos-pertenecientes"),
  catalogosPermisosProfesionales: new CrudApiService<CatalogoPermisoProfesional>("/api/catalogos-permisos-profesionales"),
  dificultadesActividades: new CrudApiService<DificultadActividad>("/api/dificultades-actividades"),
  entidadesAfectadasAuditorias: new CrudApiService<EntidadAfectadaAuditoria>("/api/entidades-afectadas-auditorias"),
  estadosActividades: new CrudApiService<EstadoActividad>("/api/estados-actividades"),
  estadosContactos: new CrudApiService<EstadoContacto>("/api/estados-contactos"),
  estadosPagos: new CrudApiService<EstadoPago>("/api/estados-pagos"),
  estadosReportes: new CrudApiService<EstadoReporte>("/api/estados-reportes"),
  estadosSuscripciones: new CrudApiService<EstadoSuscripcion>("/api/estados-suscripciones"),
  estadosValidacionesProfesionales: new CrudApiService<EstadoValidacionProfesional>("/api/estados-validaciones-profesionales"),
  estadosVinculos: new CrudApiService<EstadoVinculo>("/api/estados-vinculos"),
  historialesPermisosOtorgadosPertenecientes: new CrudApiService<HistorialPermisoOtorgadoPerteneciente>("/api/historiales-permisos-otorgados-pertenecientes"),
  historialesPermisosOtorgadosProfesionales: new CrudApiService<HistorialPermisoOtorgadoProfesional>("/api/historiales-permisos-otorgados-profesionales"),
  mensajesArchivos: new CrudApiService<MensajeArchivo>("/api/mensajes-archivos"),
  nivelesApoyos: new CrudApiService<NivelApoyo>("/api/niveles-apoyos"),
  pagosSuscripciones: new CrudApiService<PagoSuscripcion>("/api/pagos-suscripciones"),
  paquetesPuntos: new CrudApiService<PaquetePuntos>("/api/paquetes-puntos"),
  perfilesProfesionales: new CrudApiService<PerfilProfesional>("/api/perfiles-profesionales"),
  permisosArchivos: new CrudApiService<PermisoArchivo>("/api/permisos-archivos"),
  permisosOtorgadosPertenecientes: new CrudApiService<PermisoOtorgadoPerteneciente>("/api/permisos-otorgados-pertenecientes"),
  permisosOtorgadosProfesionales: new CrudApiService<PermisoOtorgadoProfesional>("/api/permisos-otorgados-profesionales"),
  planesSuscripciones: new CrudApiService<PlanSuscripcion>("/api/planes-suscripciones"),
  puntosOtorgados: new CrudApiService<PuntoOtorgado>("/api/puntos-otorgados"),
  resenasProfesionales: new CrudApiService<ResenaProfesional>("/api/resenas-profesionales"),
  rolesAdministradores: new CrudApiService<RolAdministrador>("/api/roles-administradores"),
  tiposActividades: new CrudApiService<TipoActividad>("/api/tipos-actividades"),
  tiposArchivos: new CrudApiService<TipoArchivo>("/api/tipos-archivos"),
  tiposChats: new CrudApiService<TipoChat>("/api/tipos-chats"),
  tiposEventosAuditorias: new CrudApiService<TipoEventoAuditoria>("/api/tipos-eventos-auditorias"),
  tiposEventosZonasSeguras: new CrudApiService<TipoEventoZonaSegura>("/api/tipos-eventos-zonas-seguras"),
  tiposItemsAvatares: new CrudApiService<TipoItemAvatar>("/api/tipos-items-avatares"),
  tiposMensajes: new CrudApiService<TipoMensaje>("/api/tipos-mensajes"),
  tiposMovimientosPuntos: new CrudApiService<TipoMovimientoPunto>("/api/tipos-movimientos-puntos"),
  tiposNotificaciones: new CrudApiService<TipoNotificacion>("/api/tipos-notificaciones"),
  tiposPermisosArchivos: new CrudApiService<TipoPermisoArchivo>("/api/tipos-permisos-archivos"),
  tiposUsuarios: new CrudApiService<TipoUsuario>("/api/tipos-usuarios"),
  validacionesProfesionales: new CrudApiService<ValidacionProfesional>("/api/validaciones-profesionales"),
  vinculosProfesionalesPertenecientes: new CrudApiService<VinculoProfesionalPerteneciente>("/api/vinculos-profesionales-pertenecientes"),
  vinculosTutorPertenecientes: new CrudApiService<VinculoTutorPerteneciente>("/api/vinculos-tutor-pertenecientes"),
};

export type TandemApi = typeof tandemApi;
