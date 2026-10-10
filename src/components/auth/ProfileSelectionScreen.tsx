import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { RegisterRole } from '@/services/api';
import { AuthLogo } from './AuthLogo';
import { ProfileCard } from './ProfileCard';
import { AuthLinkButton, Feedback, TermsText } from './AuthFormControls';
import { PROFILE_ORDER } from './authProfiles';
import { partVariants } from './authMotion';
import { useIsDesktop } from './useIsDesktop';

type ProfileSelectionScreenProps = {
  onSelect: (role: RegisterRole) => void;
  onBack: () => void;
  onHaveAccount: () => void;
  subtitle: string;
  error?: string;
  disabled?: boolean;
};

/**
 * Selección de tipo de cuenta. Sin layout dividido: logo, título y tres tarjetas
 * que son botones completos (sin flechas, sin "continuar", sin estado seleccionado).
 */
export function ProfileSelectionScreen({ onSelect, onBack, onHaveAccount, subtitle, error, disabled }: ProfileSelectionScreenProps) {
  const isDesktop = useIsDesktop();
  const pickedRef = useRef<RegisterRole | null>(null);

  return (
    <div className="flex min-h-screen flex-col px-6 py-8 md:px-10 lg:py-10">
      <motion.div variants={partVariants} className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center gap-2 rounded-full text-[#6F518E] transition hover:bg-[#C9A7EB]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F518E] lg:h-10 lg:w-auto lg:px-3 lg:pr-4 lg:text-sm lg:font-bold"
        >
          <ArrowLeft size={24} className="lg:h-[18px] lg:w-[18px]" />
          <span className="hidden lg:inline">Volver</span>
        </button>
        <AuthLogo className="w-[200px] md:w-[240px] lg:w-[250px]" />
      </motion.div>

      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col justify-center py-8">
        <motion.div variants={partVariants} className="mb-8 space-y-3 text-center lg:mb-10">
          <h1 className="text-[1.75rem] font-bold leading-tight text-[var(--auth-ink)] md:text-4xl lg:text-5xl">¿Qué cuenta querés crear?</h1>
          <p className="text-sm font-medium text-[#6F518E]/80 md:text-lg">{subtitle}</p>
        </motion.div>

        {error && (
          <div className="mx-auto mb-6 w-full max-w-xl">
            <Feedback message={error} />
          </div>
        )}

        <div className="mx-auto grid w-full max-w-xl gap-4 lg:max-w-none lg:grid-cols-3 lg:gap-8">
          {PROFILE_ORDER.map(role => (
            <ProfileCard key={role} role={role} onSelect={onSelect} pickedRef={pickedRef} shared={isDesktop} disabled={disabled} />
          ))}
        </div>
      </div>

      <motion.div variants={partVariants} className="space-y-6 pt-4">
        <AuthLinkButton onClick={onHaveAccount} className="mx-auto block">Ya tengo cuenta</AuthLinkButton>
        <TermsText />
      </motion.div>
    </div>
  );
}
