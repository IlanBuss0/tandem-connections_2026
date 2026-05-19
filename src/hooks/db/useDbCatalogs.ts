import { useMemo } from "react";

import {
  estadosActividades,
  tiposActividades,
  nivelesApoyos,
  autonomiasOperativas,
} from "@/data/catalogs";

export function useDbCatalogs() {
  return useMemo(() => {
    return {
      estadosActividades,
      tiposActividades,
      nivelesApoyos,
      autonomiasOperativas,
    };
  }, []);
}