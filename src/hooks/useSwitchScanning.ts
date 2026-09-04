import { useCallback, useEffect, useRef, useState } from 'react';
import { activate, initialScanState, tick, type ScanState } from '@/lib/scanEngine';

// Unica responsabilidad: enganchar la maquina de estados pura de
// scanEngine.ts con el DOM real (Sesion 22, item 45) — timer de barrido,
// resaltado visual, y activacion por barra espaciadora o boton grande.
// Recorre `[role="group"]` (el contrato fijado en PictogramGrid desde la
// Sesion 10) y sus hijos enfocables.
const SCAN_INTERVAL_MS = 1500;
const FOCUSABLE_SELECTOR = 'button, a[href], input, select, textarea';

function queryGroups(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="group"]')).filter(
    (g) => g.querySelector(FOCUSABLE_SELECTOR) !== null,
  );
}

function queryItems(group: HTMLElement): HTMLElement[] {
  return Array.from(group.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled'),
  );
}

export function useSwitchScanning(enabled: boolean) {
  const [state, setState] = useState<ScanState>(initialScanState());
  const highlightedRef = useRef<HTMLElement | null>(null);

  const clearHighlight = useCallback(() => {
    if (highlightedRef.current) {
      highlightedRef.current.style.removeProperty('outline');
      highlightedRef.current.style.removeProperty('outline-offset');
      highlightedRef.current = null;
    }
  }, []);

  // Timer del barrido automatico.
  useEffect(() => {
    if (!enabled) {
      clearHighlight();
      setState(initialScanState());
      return;
    }
    const timer = window.setInterval(() => {
      setState((prev) => {
        const sizes = queryGroups().map((g) => queryItems(g).length);
        return tick(prev, sizes);
      });
    }, SCAN_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, clearHighlight]);

  // Resaltado del grupo/item actual.
  useEffect(() => {
    if (!enabled) return;
    clearHighlight();

    const groups = queryGroups();
    const group = groups[state.groupIndex];
    if (!group) return;

    const target = state.level === 'group' ? group : queryItems(group)[state.itemIndex];
    if (!target) return;

    target.style.outline = '4px solid #6b4c9a';
    target.style.outlineOffset = '2px';
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    highlightedRef.current = target;
    // clearHighlight se llama al inicio del propio efecto y en cleanup no hace falta duplicar
  }, [state, enabled, clearHighlight]);

  const doActivate = useCallback(() => {
    const groups = queryGroups();
    const sizes = groups.map((g) => queryItems(g).length);
    const result = activate(state, sizes);

    if (result.select) {
      const group = groups[state.groupIndex];
      const item = group ? queryItems(group)[state.itemIndex] : null;
      item?.click();
    }
    setState(result.state);
  }, [state]);

  // Barra espaciadora como "switch" para quien usa teclado o un switch
  // fisico mapeado a una tecla.
  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        doActivate();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, doActivate]);

  useEffect(() => () => clearHighlight(), [clearHighlight]);

  return { activate: doActivate };
}
