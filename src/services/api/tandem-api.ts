import { CrudApiService } from "./crud";
import { apiRequest, apiUploadFile, clearDefaultAuthToken, unwrapApiData, type ApiEnvelope } from "./client";
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
  ResultadoActividadPersonalizada,
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
  token?: string;
  accessToken?: string;
  expiresAt?: string;
  professionalVerification?: {
    status: string;
    reviewStatus: string;
    messageCode: string;
  };
};

export type LoginRequest = {
  correo?: string;
  nombre_usuario?: string;
  contrasena: string;
};

export type RegisterRole = "perteneciente" | "tutor" | "profesional";

export type RefepsProfessional =
  | {
      nombre: string | null;
      apellido: string | null;
      dni: string | null;
      matricula: string | number;
      profesion: string | null;
      jurisdiccion: string | null;
      habilitado: boolean;
      estado: string | null;
      especialidades: string[];
    }
  | Record<string, never>;

export type RefepsSearchResult = {
  found: boolean;
  ambiguous: boolean;
  results: RefepsProfessional[];
};

export type ProfessionalDniVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "MANUAL_REVIEW"
  | "NOT_FOUND"
  | "DATA_MISMATCH"
  | "VERIFICATION_ERROR";

export type ProfessionalDniVerificationResult = {
  status: ProfessionalDniVerificationStatus;
  reviewStatus: ProfessionalDniVerificationStatus;
  verified: boolean;
  reason: string | null;
  messageCode: string;
  dni?: {
    nombre: string | null;
    apellido: string | null;
    dni: string | null;
    confidence: number;
    structureScore?: number;
    detectedFields?: string[];
  } | null;
};

export type ProfessionalDniVerificationRequest = {
  nombre: string;
  apellido: string;
  matricula: string;
  dniFrente: File;
};

export interface TutorAccount {
  id: number;
  id_tutor: number;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | number | null;
  parentesco: string | null;
  email_verificado: boolean;
}

export type RegisterRequest = Pick<
  Usuario,
  "nombre_usuario" | "nombre" | "apellido" | "correo"
> &
  Partial<Pick<Usuario, "telefono" | "fecha_nacimiento">> & {
    contrasena: string;
    rol: RegisterRole;
    // Solo para rol "tutor"
    parentesco?: string;
    // Solo para rol "profesional"
    profesion?: string;
    matricula?: string;
    especialidad?: string;
    institucion?: string;
    dniFrente?: File;
  };

function authFormData(payload: Partial<RegisterRequest> & { accessToken?: string }): FormData {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (key === "dniFrente" && value instanceof File) {
      formData.append("dni_frente", value);
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthPayload> {
    const response = await apiRequest<ApiEnvelope<AuthPayload>>("/api/auth/login", {
      method: "POST",
      body: payload,
    });

    const data = unwrapApiData(response);
    return data;
  },

  async register(payload: RegisterRequest): Promise<AuthPayload> {
    if (payload.rol === "profesional") {
      const response = await apiUploadFile<ApiEnvelope<AuthPayload>>(
        "/api/auth/register",
        authFormData(payload),
      );
      return unwrapApiData(response);
    }

    const response = await apiRequest<ApiEnvelope<AuthPayload>>("/api/auth/register", {
      method: "POST",
      body: payload,
    });

    const data = unwrapApiData(response);
    return data;
  },

  async refresh(): Promise<AuthPayload> {
    const response = await apiRequest<ApiEnvelope<AuthPayload>>("/api/auth/refresh", {
      method: "POST",
    });
    const data = unwrapApiData(response);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      clearDefaultAuthToken();
    }
  },

  async me(token?: string | null): Promise<Omit<Usuario, "contrasena_hash">> {
    const response = await apiRequest<ApiEnvelope<Omit<Usuario, "contrasena_hash">>>(
      "/api/auth/me",
      token ? { token } : {}
    );

    return unwrapApiData(response);
  },

  async google(payload: { accessToken: string; rol?: RegisterRole } & Partial<RegisterRequest>): Promise<AuthPayload> {
    if (payload.rol === "profesional") {
      const response = await apiUploadFile<ApiEnvelope<AuthPayload>>(
        "/api/auth/google",
        authFormData(payload),
      );
      return unwrapApiData(response);
    }

    const response = await apiRequest<ApiEnvelope<AuthPayload>>("/api/auth/google", {
      method: "POST",
      body: payload,
    });

    return unwrapApiData(response);
  },

  async verifyProfessionalDni(payload: ProfessionalDniVerificationRequest): Promise<ProfessionalDniVerificationResult> {
    const response = await apiUploadFile<ApiEnvelope<ProfessionalDniVerificationResult>>(
      "/api/auth/verify-professional-dni",
      authFormData(payload),
    );
    return unwrapApiData(response);
  },

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    const response = await apiRequest<ApiEnvelope<{ verified: boolean }>>(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
    );

    return unwrapApiData(response);
  },

  async resendVerification(): Promise<{ sent: boolean }> {
    const response = await apiRequest<ApiEnvelope<{ sent: boolean }>>("/api/auth/resend-verification", {
      method: "POST",
    });

    return unwrapApiData(response);
  },

  async forgotPassword(correo: string): Promise<{ sent: boolean }> {
    const response = await apiRequest<ApiEnvelope<{ sent: boolean }>>("/api/auth/forgot-password", { method: "POST", body: { correo } });
    return unwrapApiData(response);
  },

  async resetPassword(payload: { token: string; contrasena_nueva: string }): Promise<{ changed: boolean }> {
    const response = await apiRequest<ApiEnvelope<{ changed: boolean }>>("/api/auth/reset-password", { method: "POST", body: payload });
    return unwrapApiData(response);
  },

  async getTutorAccount(): Promise<TutorAccount> {
    const response = await apiRequest<ApiEnvelope<TutorAccount>>("/api/auth/tutor-account");
    return unwrapApiData(response);
  },

  async updateTutorAccount(payload: Pick<TutorAccount, "nombre" | "apellido" | "correo" | "telefono" | "parentesco"> & { contrasena_actual?: string }): Promise<TutorAccount> {
    const response = await apiRequest<ApiEnvelope<TutorAccount>>("/api/auth/tutor-account", {
      method: "PATCH",
      body: payload,
    });
    return unwrapApiData(response);
  },

  async changePassword(payload: { contrasena_actual: string; contrasena_nueva: string }): Promise<{ changed: boolean }> {
    const response = await apiRequest<ApiEnvelope<{ changed: boolean }>>("/api/auth/password", {
      method: "PATCH",
      body: payload,
    });
    return unwrapApiData(response);
  },

  async changeEmail(payload: { contrasena_actual: string; correo_nuevo: string }): Promise<{ correo: string; email_verificado: boolean }> {
    const response = await apiRequest<ApiEnvelope<{ correo: string; email_verificado: boolean }>>("/api/auth/email", {
      method: "PATCH",
      body: payload,
    });
    return unwrapApiData(response);
  },
};

class NotificationApiService {
  getMine(): Promise<Notificacion[]> {
    return apiRequest<Notificacion[]>("/api/notificaciones/mine");
  }

  async markRead(notificationId: number): Promise<void> {
    await apiRequest(`/api/notificaciones/${encodeURIComponent(String(notificationId))}/read`, {
      method: "PATCH",
    });
  }

  async markAllRead(): Promise<void> {
    await apiRequest("/api/notificaciones/read-all", {
      method: "PATCH",
    });
  }
}

class RefepsApiService {
  async searchByMatricula(matricula: string): Promise<RefepsSearchResult> {
    const response = await apiRequest<{
      ok: boolean;
      data: RefepsSearchResult;
    }>("/api/refeps/search-refeps", {
      method: "POST",
      body: { matricula },
      cacheTtlMs: 0,
    });
    return unwrapApiData(response?.data ?? response);
  }
}

class CustomActivityApiService extends CrudApiService<ActividadPersonalizada> {
  getResults(id: number): Promise<ResultadoActividadPersonalizada[]> {
    return apiRequest<ResultadoActividadPersonalizada[]>(`/api/actividades-personalizadas/${encodeURIComponent(String(id))}/resultados`);
  }
}

class AssignedActivityApiService extends CrudApiService<ActividadAsignada> {
  complete(id: number, score?: number): Promise<ActividadAsignada> {
    return apiRequest<ActividadAsignada>(`/api/actividades-asignadas/${encodeURIComponent(String(id))}/completar`, {
      method: 'POST',
      body: score === undefined ? {} : { puntaje: score },
    });
  }
}

class FileApiService extends CrudApiService<Archivo> {
  constructor() {
    super("/api/archivos");
  }

  upload(file: File, onProgress?: (pct: number) => void, signal?: AbortSignal): Promise<{ id: number; url: string; nombre_archivo: string; content_type: string; peso_bytes: number }> {
    const formData = new FormData();
    formData.append("file", file);
    return apiUploadFile("/api/archivos/upload", formData, onProgress, signal);
  }

  uploadWithType(file: File, idTipoArchivo: number, onProgress?: (pct: number) => void, signal?: AbortSignal): Promise<{ id: number; url: string; nombre_archivo: string; content_type: string; peso_bytes: number }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("id_tipo_archivo", String(idTipoArchivo));
    return apiUploadFile("/api/archivos/upload", formData, onProgress, signal);
  }
}

export const tandemApi = {
  auth: authApi,
  refeps: new RefepsApiService(),
  usuarios: new CrudApiService<Usuario>("/api/usuarios"),
  pertenecientes: new CrudApiService<Perteneciente>("/api/pertenecientes"),
  tutores: new CrudApiService<Tutor>("/api/tutores"),
  profesionales: new CrudApiService<Profesional>("/api/profesionales"),
  actividades: new CrudApiService<Actividad>("/api/actividades"),
  actividadesPersonalizadas: new CustomActivityApiService("/api/actividades-personalizadas"),
  actividadesAsignadas: new AssignedActivityApiService("/api/actividades-asignadas"),
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
  notificaciones: new NotificationApiService(),
  contactos: new CrudApiService<Contacto>("/api/contactos"),
  chats: new CrudApiService<Chat>("/api/chats"),
  participantesChats: new CrudApiService<ParticipanteChat>("/api/participantes-chats"),
  mensajes: new CrudApiService<Mensaje>("/api/mensajes"),
  bloqueosUsuarios: new CrudApiService<BloqueoUsuario>("/api/bloqueos-usuarios"),
  configuracionesUsuarios: new CrudApiService<ConfiguracionUsuario>("/api/configuraciones-usuarios"),
  configuracionesAccesibilidad: new CrudApiService<ConfiguracionAccesibilidad>("/api/configuraciones-accesibilidad"),
  reportesUsuarios: new CrudApiService<ReporteUsuario>("/api/reportes-usuarios"),
  alcancesArchivos: new CrudApiService<AlcanceArchivo>("/api/alcances-archivos"),
  archivos: new FileApiService(),
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
