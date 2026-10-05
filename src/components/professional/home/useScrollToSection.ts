import { useCallback } from 'react';
import { animate } from 'framer-motion';
import { EASE, useHomeReducedMotion } from './homeTokens';

const OFFSET = 12;

function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

/** Sube a una sección dejándola 12 px debajo del header (420 ms; sin movimiento si se detuvieron las animaciones). */
export function useScrollToSection() {
  const reduce = useHomeReducedMotion();
  return useCallback((id: string) => {
    const target = document.getElementById(id);
    const container = target && scrollParent(target);
    if (!target || !container) return;
    const top = container.scrollTop + target.getBoundingClientRect().top - container.getBoundingClientRect().top - OFFSET;
    if (reduce) { container.scrollTop = top; return; }
    animate(container.scrollTop, top, { duration: 0.42, ease: EASE, onUpdate: value => { container.scrollTop = value; } });
  }, [reduce]);
}
