import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPerfilUsuario } from "@/services/db/perfil.service";

export function useDbPerfil() {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return null;

    return getPerfilUsuario(user.id);
  }, [user]);
}