import {
  estadosActividades,
  tiposActividades,
  nivelesApoyos,
  autonomiasOperativas,
  catalogNameById,
} from "@/data/catalogs";

export const catalogsService = {
  estadosActividades,
  tiposActividades,
  nivelesApoyos,
  autonomiasOperativas,

  getEstadoActividad(id: number) {
    return catalogNameById(estadosActividades, id);
  },

  getTipoActividad(id: number) {
    return catalogNameById(tiposActividades, id);
  },

  getNivelApoyo(id: number) {
    return catalogNameById(nivelesApoyos, id);
  },

  getAutonomia(id: number) {
    return catalogNameById(autonomiasOperativas, id);
  },
};