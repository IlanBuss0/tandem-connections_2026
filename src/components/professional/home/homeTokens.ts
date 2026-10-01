import { useReducedMotion } from 'framer-motion';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Sin movimiento si el sistema lo pide o el perfil motor detuvo las animaciones. */
export function useHomeReducedMotion() {
  const system = useReducedMotion();
  const { settings } = useAccessibility();
  return Boolean(system || settings.reduceMotion);
}

export const RowTitle = 'text-[14px] font-bold leading-[1.35] text-[#2B2145]';
export const RowText = 'mt-[3px] text-[12.5px] leading-[1.45] text-[#675E78]';
export const Divider = 'border-t border-[#EFE7F9]';

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? words[words.length - 1][0] : '')).toLocaleUpperCase('es-AR');
}
