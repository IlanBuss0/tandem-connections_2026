// ============================================================================
// useDb — Adaptador de lectura sobre la capa relacional normalizada.
// Permite a componentes nuevos consumir el modelo SQL exacto sin alterar la
// UI ni los componentes existentes (que siguen usando mockData legacy).
// ============================================================================
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  usuarioIdMap, getPerfilCompleto,
  getPertenecientesDeTutor, getPertenecientesDeProfesional,
  getActividadesAsignadasDePerteneciente, getSaldoPuntosDePerteneciente,
  pertenecientes, tutores, profesionales, administradores, usuarios,
  vinculosTutorPertenecientes, vinculosProfesionalPertenecientes,
  actividades, actividadesAsignadas, saldosPuntos, avatares,
} from '@/data/normalized';
import {
  estadosActividades, tiposActividades, nivelesApoyos, autonomiasOperativas,
  catalogNameById,
} from '@/data/catalogs';

/** Hook principal: devuelve el perfil SQL completo del usuario autenticado. */
export function useDbPerfil() {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user) return null;
    const idInt = usuarioIdMap.get(user.id);
    if (!idInt) return null;
    return getPerfilCompleto(idInt);
  }, [user]);
}

/** Hook genérico de catálogos y consultas tabulares. */
export function useDb() {
  return useMemo(() => ({
    // Tablas crudas
    tables: {
      usuarios, pertenecientes, tutores, profesionales, administradores,
      vinculosTutorPertenecientes, vinculosProfesionalPertenecientes,
      actividades, actividadesAsignadas, saldosPuntos, avatares,
    },
    // Catálogos
    catalogs: {
      estadosActividades, tiposActividades, nivelesApoyos, autonomiasOperativas,
    },
    // Funciones de consulta (estilo repository)
    query: {
      perfilCompleto: getPerfilCompleto,
      pertenecientesDeTutor: getPertenecientesDeTutor,
      pertenecientesDeProfesional: getPertenecientesDeProfesional,
      actividadesDePerteneciente: getActividadesAsignadasDePerteneciente,
      saldoDePerteneciente: getSaldoPuntosDePerteneciente,
      idIntDeLegacy: (legacyId: string) => usuarioIdMap.get(legacyId),
    },
    // Resolución de catálogos
    catalog: {
      estadoActividad: (id: number) => catalogNameById(estadosActividades, id),
      tipoActividad: (id: number) => catalogNameById(tiposActividades, id),
      nivelApoyo: (id: number) => catalogNameById(nivelesApoyos, id),
      autonomia: (id: number) => catalogNameById(autonomiasOperativas, id),
    },
  }), []);
}
