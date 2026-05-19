import { getActividadesAsignadasDePerteneciente } from "@/data/normalized";

export function useDbActividades(id: number) {
  return getActividadesAsignadasDePerteneciente(id);
}