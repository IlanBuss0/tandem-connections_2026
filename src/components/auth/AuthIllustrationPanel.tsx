import { motion } from 'framer-motion';
import type { AuthPanelContent } from './authProfiles';
import { panelVariants, partVariants, SHARED_LAYOUT_TRANSITION } from './authMotion';

/**
 * Panel derecho de las pantallas con formulario (solo desktop).
 * El fondo se desvanece por separado de la ilustración para que, cuando hay
 * animación compartida, la mascota viaje desde la tarjeta sin perder opacidad.
 */
export function AuthIllustrationPanel({ mascot, message, tone, layoutId }: AuthPanelContent) {
  return (
    <div className="relative flex h-full min-h-[560px] items-center justify-center px-10 py-12">
      <motion.div
        variants={panelVariants}
        data-tone={tone}
        aria-hidden="true"
        className="auth-panel absolute inset-0 rounded-[2rem] shadow-[0_10px_40px_rgba(75,53,102,0.07)]"
      />

      <div className="relative z-10 flex w-full flex-col items-center">
        {layoutId ? (
          <motion.img
            layoutId={layoutId}
            transition={{ layout: SHARED_LAYOUT_TRANSITION }}
            src={mascot}
            alt=""
            draggable={false}
            className="-mt-10 -mb-6 aspect-square w-[min(100%,38rem,62vh)] select-none object-contain"
          />
        ) : (
          <motion.img
            variants={partVariants}
            src={mascot}
            alt=""
            draggable={false}
            className="-mt-10 -mb-6 aspect-square w-[min(100%,38rem,62vh)] select-none object-contain"
          />
        )}

        <motion.p
          variants={partVariants}
          className="max-w-[26rem] whitespace-pre-line text-center font-heading text-3xl font-bold leading-tight text-[var(--auth-ink)] xl:text-4xl"
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}
