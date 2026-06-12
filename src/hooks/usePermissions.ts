import { useEffect, useMemo, useState } from 'react';
import {
  fetchPermissionContext,
  type EffectivePermission,
  type PermissionContext,
} from '@/data/api';

export const PERTENECIENTE_PERMISSIONS = {
  EDITAR_PERFIL: 'EditarPerfil',
  EDITAR_PERFIL_SENSIBLE: 'EditarPerfilSensible',
  COMPLETAR_ACTIVIDADES: 'CompletarActividades',
  ENVIAR_MENSAJES: 'EnviarMensajes',
  CHATEAR_CON_PROFESIONAL: 'ChatearConProfesional',
  CREAR_ACTIVIDADES_PROPIAS: 'CrearActividadesPropias',
  COMPARTIR_UBICACION: 'CompartirUbicacion',
  GASTAR_PUNTOS: 'GastarPuntos',
  USAR_MI_DIA: 'UsarMiDia',
  USAR_CALENDARIO: 'UsarCalendario',
  REGISTRAR_EMOCIONES: 'RegistrarEmociones',
  USAR_PICTOGRAMAS: 'UsarPictogramas',
} as const;

export const PROFESIONAL_PERMISSIONS = {
  ASIGNAR_ACTIVIDADES: 'AsignarActividades',
  CREAR_ACTIVIDADES_PERSONALIZADAS: 'CrearActividadesPersonalizadas',
  VER_HISTORIAL: 'VerHistorial',
  VER_UBICACION: 'VerUbicacion',
  AGENDAR_SESIONES: 'AgendarSesiones',
  ENVIAR_MENSAJES: 'EnviarMensajes',
} as const;

export function isPermissionEnabled(
  permisos: Record<string, EffectivePermission> | undefined,
  permiso: string,
  fallback = false,
) {
  return permisos?.[permiso]?.habilitado ?? fallback;
}

export function usePermissionContext() {
  const [context, setContext] = useState<PermissionContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPermissionContext()
      .then(next => {
        if (cancelled) return;
        setContext(next);
        setError(null);
      })
      .catch(err => {
        if (cancelled) return;
        setContext(null);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los permisos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ context, loading, error }), [context, loading, error]);
}
