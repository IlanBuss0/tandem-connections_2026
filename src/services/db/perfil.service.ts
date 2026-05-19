import {
  getPerfilCompleto,
  usuarioIdMap,
} from "@/data/normalized";

export const getPerfilUsuario = (legacyId: string) => {
  const idInt = usuarioIdMap.get(legacyId);

  if (!idInt) return null;

  return getPerfilCompleto(idInt);
};