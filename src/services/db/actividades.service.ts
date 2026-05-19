import { getActividadesAsignadasDePerteneciente } from "@/data/normalized";

import type { ActividadAsignada } from "@/types/actividad.types";

export const getActividadesDePerteneciente = (
  pertenecienteId: number
): ActividadAsignada[] => {
  return getActividadesAsignadasDePerteneciente(pertenecienteId);
};