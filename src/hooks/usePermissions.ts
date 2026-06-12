import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  EDITAR_PERFIL_PROFESIONAL: 'EditarPerfilProfesional',
} as const;

export function isPermissionEnabled(
  permisos: Record<string, EffectivePermission> | undefined,
  permiso: string,
  fallback = false,
) {
  return permisos?.[permiso]?.habilitado ?? fallback;
}

async function loadContext(
  setContext: (ctx: PermissionContext | null) => void,
  setLoading: (v: boolean) => void,
  setError: (e: string | null) => void,
  cancelledRef: { current: boolean },
) {
  if (cancelledRef.current) return;
  setLoading(true);
  try {
    const next = await fetchPermissionContext();
    if (cancelledRef.current) return;
    setContext(next);
    setError(null);
  } catch (err) {
    if (cancelledRef.current) return;
    setContext(null);
    setError(err instanceof Error ? err.message : 'No se pudieron cargar los permisos.');
  } finally {
    if (!cancelledRef.current) setLoading(false);
  }
}

export function usePermissionContext() {
  const [context, setContext] = useState<PermissionContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const refetch = useCallback(() => {
    loadContext(setContext, setLoading, setError, cancelledRef);
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    loadContext(setContext, setLoading, setError, cancelledRef);

    const handler = () => {
      loadContext(setContext, setLoading, setError, cancelledRef);
    };
    window.addEventListener('permisos:updated', handler);

    return () => {
      cancelledRef.current = true;
      window.removeEventListener('permisos:updated', handler);
    };
  }, [refetch]);

  return useMemo(
    () => ({ context, loading, error, refetch }),
    [context, loading, error, refetch],
  );
}
