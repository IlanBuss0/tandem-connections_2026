import type { CSSProperties } from 'react';
import mLayer from '@/assets/auth/tandem-m.png';
import dot1Layer from '@/assets/auth/tandem-dot-1.png';
import dot2Layer from '@/assets/auth/tandem-dot-2.png';
import './tandem-logo.css';

type TandemAnimatedLogoProps = {
  /** Ancho del isotipo (cualquier unidad CSS). Por defecto se adapta a la pantalla. */
  size?: string | number;
  /** false deja el isotipo quieto (misma geometría y colores). */
  animated?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Isotipo oficial de TÁNDEM: la M permanece quieta y sus dos puntos celestes
 * saltan de forma alternada. Es decorativo; el estado accesible lo expone
 * quien lo usa (ver TandemLoadingScreen).
 */
export function TandemAnimatedLogo({ size, animated = true, className = '', style }: TandemAnimatedLogoProps) {
  const sizeStyle = size === undefined ? undefined : ({ '--tl-size': typeof size === 'number' ? `${size}px` : size } as CSSProperties);

  return (
    <div
      className={`tandem-logo ${className}`}
      data-animated={animated}
      style={{ ...sizeStyle, ...style }}
      aria-hidden="true"
    >
      <img className="tandem-logo__layer" src={mLayer} alt="" draggable={false} decoding="async" />
      <img className="tandem-logo__layer tandem-logo__dot tandem-logo__dot--1" src={dot1Layer} alt="" draggable={false} decoding="async" />
      <img className="tandem-logo__layer tandem-logo__dot tandem-logo__dot--2" src={dot2Layer} alt="" draggable={false} decoding="async" />
    </div>
  );
}
