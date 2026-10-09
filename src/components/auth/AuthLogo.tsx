import { TANDEM_LOGO_SRC } from './authProfiles';

/** Logo completo oficial de TÁNDEM. No se recompone con la M ni con texto. */
export function AuthLogo({ className = '' }: { className?: string }) {
  return <img src={TANDEM_LOGO_SRC} alt="Tándem" draggable={false} className={`h-auto select-none ${className}`} />;
}
