import type { Variants } from 'framer-motion';

export const AUTH_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Variantes compartidas por todas las pantallas de autenticación.
 * Duraciones entre 200 y 450 ms. `prefers-reduced-motion` se respeta con
 * <MotionConfig reducedMotion="user"> (desactiva desplazamientos y layout).
 */
export const screenVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
  exit: {},
};

/** Bloque de contenido (logo, títulos, formulario, tarjetas). */
export const partVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: AUTH_EASE } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

/** Fondo del panel ilustrado: solo opacidad para no distorsionar la animación compartida. */
export const panelVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: AUTH_EASE } },
  exit: { opacity: 0, transition: { duration: 0.28, ease: 'easeIn' } },
};

export const SHARED_LAYOUT_TRANSITION = { duration: 0.55, ease: AUTH_EASE };
