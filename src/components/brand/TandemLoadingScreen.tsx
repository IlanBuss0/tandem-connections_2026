import type { CSSProperties } from 'react';
import { TandemAnimatedLogo } from './TandemAnimatedLogo';

type TandemLoadingScreenProps = {
  /** Texto para lectores de pantalla (no se ve). */
  label?: string;
  /**
   * Umbral de aparición en ms: el isotipo recién se muestra pasado este tiempo,
   * así una carga muy corta no produce un parpadeo. No es una duración mínima.
   */
  delayMs?: number;
};

/**
 * Pantalla de carga de TÁNDEM: 100 % blanca, sin texto visible, con la M oficial
 * centrada y sus dos puntos saltando. Montarla solo mientras haya una carga real.
 */
export function TandemLoadingScreen({ label = 'Cargando TÁNDEM', delayMs = 150 }: TandemLoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="tandem-loading"
      style={{ '--tl-delay': `${delayMs}ms` } as CSSProperties}
    >
      <span className="sr-only">{label}</span>
      <TandemAnimatedLogo />
    </div>
  );
}
