export const ACTIVE_TAB_KEY = "tandem_active_tab";

/** Se llama en cada login/registro (cualquier metodo) para que la sesion
 * nueva siempre arranque en el inicio, en vez de heredar la ultima pestaña
 * que haya quedado guardada de una sesion anterior en el mismo navegador. */
export function resetActiveTabToHome() {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, "home");
  } catch {
    // Si localStorage no esta disponible, no hay nada persistido que resetear.
  }
}
