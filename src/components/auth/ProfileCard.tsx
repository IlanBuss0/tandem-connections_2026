import type { MutableRefObject } from 'react';
import { motion, type Variants } from 'framer-motion';
import type { RegisterRole } from '@/services/api';
import { PROFILE_CONFIG, mascotLayoutId } from './authProfiles';
import { AUTH_EASE, SHARED_LAYOUT_TRANSITION } from './authMotion';

// Clases estáticas (Tailwind las necesita completas en el código fuente).
const CARD_TONE: Record<RegisterRole, { surface: string; ring: string }> = {
  perteneciente: { surface: 'bg-[var(--auth-lavender)] border-[#DDD0F7]', ring: 'focus-visible:ring-[#6F518E]' },
  tutor: { surface: 'bg-[var(--auth-cream)] border-[#F6DFBF]', ring: 'focus-visible:ring-[#B9792C]' },
  profesional: { surface: 'bg-[var(--auth-periwinkle)] border-[#CBD6FA]', ring: 'focus-visible:ring-[#4F63B8]' },
};

const fadeOnExit: Variants = { exit: { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } } };

type ProfileCardProps = {
  role: RegisterRole;
  onSelect: (role: RegisterRole) => void;
  /** Rol tocado, para que su tarjeta no se desvanezca mientras la mascota viaja al panel. */
  pickedRef: MutableRefObject<RegisterRole | null>;
  /** Activa la animación compartida de la mascota (solo desktop). */
  shared: boolean;
  disabled?: boolean;
};

/** La tarjeta completa es el botón: tocar el personaje abre el registro de ese perfil. */
export function ProfileCard({ role, onSelect, pickedRef, shared, disabled }: ProfileCardProps) {
  const profile = PROFILE_CONFIG[role];
  const tone = CARD_TONE[role];

  const variants: Variants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: AUTH_EASE } },
    // Se evalúa al salir: la tarjeta elegida conserva la mascota, las demás se desvanecen enteras.
    exit: () => ({ opacity: pickedRef.current === role ? 1 : 0, transition: { duration: 0.25, ease: 'easeIn' } }),
  };

  const imageClass =
    'aspect-square w-28 shrink-0 select-none object-contain sm:w-32 lg:-mx-4 lg:-mt-6 lg:-mb-8 lg:w-[calc(100%+2rem)] lg:max-w-[22rem]';

  return (
    <motion.button
      type="button"
      variants={variants}
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
      disabled={disabled}
      onClick={() => {
        pickedRef.current = role;
        onSelect(role);
      }}
      data-profile={role}
      className={`group relative flex w-full items-center gap-4 rounded-[2rem] p-4 text-left outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--auth-bg)] disabled:cursor-not-allowed disabled:opacity-60 lg:flex-col lg:gap-2 lg:px-8 lg:pb-9 lg:pt-8 lg:text-center ${tone.ring}`}
    >
      <motion.span
        variants={fadeOnExit}
        aria-hidden="true"
        className={`absolute inset-0 rounded-[2rem] border shadow-[0_6px_20px_rgba(75,53,102,0.07)] transition-shadow duration-200 group-hover:shadow-[0_18px_40px_rgba(75,53,102,0.16)] group-focus-visible:shadow-[0_18px_40px_rgba(75,53,102,0.16)] ${tone.surface}`}
      />

      {shared ? (
        <motion.img
          layoutId={mascotLayoutId(role)}
          transition={{ layout: SHARED_LAYOUT_TRANSITION }}
          src={profile.mascot}
          alt=""
          draggable={false}
          className={`relative ${imageClass}`}
        />
      ) : (
        <img src={profile.mascot} alt="" draggable={false} className={`relative ${imageClass}`} />
      )}

      <motion.span variants={fadeOnExit} className="relative block min-w-0 space-y-1">
        <span className="block font-heading text-2xl font-bold text-[var(--auth-ink)] lg:text-3xl">{profile.label}</span>
        <span className="block text-sm font-semibold text-[#6F518E]/80 lg:text-base">{profile.cardDescription}</span>
      </motion.span>
    </motion.button>
  );
}
