import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig, useIsPresent } from 'framer-motion';
import { screenVariants } from './authMotion';
import './auth.css';

/**
 * Contenedor de una pantalla de autenticación. Cuando la pantalla está saliendo
 * (AnimatePresence) queda inerte: no recibe foco, clics ni lectores de pantalla,
 * así los formularios nunca quedan bloqueados ni duplicados durante la animación.
 */
export function AuthScreen({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent();
  const inertProps = (isPresent ? {} : { inert: '' }) as Record<string, string>;

  return (
    <motion.div
      variants={screenVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      aria-hidden={isPresent ? undefined : true}
      className={`min-h-screen ${isPresent ? '' : 'pointer-events-none'}`}
      {...inertProps}
    >
      {children}
    </motion.div>
  );
}

/**
 * Apila la pantalla que sale y la que entra en la misma celda para que se
 * superpongan (necesario para que la ilustración viaje de una a otra).
 */
export function AuthScreenStack({ screenKey, children }: { screenKey: string; children: ReactNode }) {
  useEffect(() => {
    document.getElementById('root')?.scrollTo?.({ top: 0 });
  }, [screenKey]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="auth-theme grid min-h-screen overflow-x-clip [&>*]:col-start-1 [&>*]:row-start-1">
        <AnimatePresence>
          <AuthScreen key={screenKey}>{children}</AuthScreen>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/** Para páginas sueltas (recuperar contraseña, verificar correo, etc.). */
export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="auth-theme min-h-screen">
        <AuthScreen>{children}</AuthScreen>
      </div>
    </MotionConfig>
  );
}
