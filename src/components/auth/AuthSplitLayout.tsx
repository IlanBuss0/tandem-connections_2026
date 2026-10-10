import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { AuthLogo } from './AuthLogo';
import { AuthIllustrationPanel } from './AuthIllustrationPanel';
import type { AuthPanelContent } from './authProfiles';
import { partVariants } from './authMotion';
import { useIsDesktop } from './useIsDesktop';

type AuthSplitLayoutProps = {
  title: string;
  subtitle?: string;
  panel: AuthPanelContent;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Pantalla con formulario: en desktop dos columnas (formulario + panel ilustrado);
 * en mobile conserva la estructura de siempre (volver, logo, formulario).
 */
export function AuthSplitLayout({ title, subtitle, panel, onBack, children, footer }: AuthSplitLayoutProps) {
  const isDesktop = useIsDesktop();

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-2 lg:gap-6 lg:p-5">
      <section className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-8 py-10 md:max-w-[620px] md:px-10 md:py-14 lg:min-h-0 lg:max-w-none lg:px-10 lg:py-6">
        <div className="mx-auto flex w-full flex-1 flex-col lg:max-w-[540px] lg:justify-center">
          <motion.div variants={partVariants} className="flex flex-col">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Volver"
                className="order-1 mb-10 flex h-11 w-11 items-center justify-center gap-2 rounded-full text-[#6F518E] transition hover:bg-[#C9A7EB]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F518E] lg:order-2 lg:mb-6 lg:h-10 lg:w-auto lg:self-start lg:px-3 lg:pr-4 lg:text-sm lg:font-bold"
              >
                <ArrowLeft size={24} className="lg:h-[18px] lg:w-[18px]" />
                <span className="hidden lg:inline">Volver</span>
              </button>
            )}
            <AuthLogo className="order-2 mx-auto mb-10 w-[224px] md:w-[280px] lg:order-1 lg:mx-0 lg:mb-8 lg:w-[210px]" />
          </motion.div>

          <motion.div variants={partVariants} className="mb-8 space-y-2 text-center lg:text-left">
            <h1 className="text-[1.75rem] font-bold leading-tight text-[var(--auth-ink)] lg:text-4xl">{title}</h1>
            {subtitle && <p className="text-sm font-medium text-[#6F518E]/80 md:text-base">{subtitle}</p>}
          </motion.div>

          <motion.div variants={partVariants}>{children}</motion.div>

          {footer && (
            <motion.div variants={partVariants} className="mt-auto pt-10 lg:pt-8">
              {footer}
            </motion.div>
          )}
        </div>
      </section>

      <aside className="hidden lg:block" aria-hidden="true">
        {isDesktop && (
          <div className="sticky top-5 h-[calc(100vh-2.5rem)]">
            <AuthIllustrationPanel {...panel} />
          </div>
        )}
      </aside>
    </div>
  );
}
