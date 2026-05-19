import {
  usuarioIdMap,
  getPerfilCompleto,
} from "@/data/normalized";

import type { PerfilCompleto } from "@/types/perfil.types";

export const getPerfilUsuario = (
  legacyId: string
): PerfilCompleto | null => {
  const idInt = usuarioIdMap.get(legacyId);

  if (!idInt) {
    return null;
  }

  return getPerfilCompleto(idInt);
};