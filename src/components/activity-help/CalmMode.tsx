import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

const PHASE_MS = 4000;
const TOTAL_BREATHS = 5;

interface Props {
  onClose: () => void;
  /** Si no viene, el link "Avisarle a …" no se muestra. */
  onNotify?: () => void;
  /** Estado del aviso mandado desde acá; el Modo calma no se cierra al avisar. */
  notifyStatus?: 'idle' | 'sending' | 'sent' | 'failed';
  recipientLabel?: string;
}

export default function CalmMode({ onClose, onNotify, notifyStatus = 'idle', recipientLabel = 'quien te acompaña' }: Props) {
  const { settings } = useAccessibility();
  const systemReducedMotion = useReducedMotion();
  const still = settings.pauseAnimations || settings.reduceMotion || Boolean(systemReducedMotion);

  // tick par = tomando aire, impar = soltando. Cada 2 ticks es una respiración.
  const [tick, setTick] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), PHASE_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    titleRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const inhaling = tick % 2 === 0;
  const finished = tick >= TOTAL_BREATHS * 2;
  const breathNumber = Math.min(Math.floor(tick / 2) + 1, TOTAL_BREATHS);
  const doneBreaths = finished ? TOTAL_BREATHS : breathNumber;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calm-mode-title"
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-gradient-to-b from-[#F3EEFB] to-[#EAE1F8] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] [@media(max-height:500px)]:pb-3 [@media(max-height:500px)]:pt-3"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Volver a la actividad"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border [@media(max-height:500px)]:absolute [@media(max-height:500px)]:left-4 [@media(max-height:500px)]:top-3 border-[#ede4f8] bg-white text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft size={18} aria-hidden />
      </button>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center text-center">
        <h2 id="calm-mode-title" ref={titleRef} tabIndex={-1} className="mt-6 font-heading text-[28px] font-bold leading-tight text-[#4B3477] outline-none [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:text-[24px]">
          Vamos despacio
        </h2>
        <p className="mt-2 text-[15px] text-[#6E5C8C] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">Seguí el círculo con tu respiración. No hay apuro.</p>

        <motion.div
          className="relative mt-10 flex h-[250px] w-[250px] shrink-0 [@media(max-height:500px)]:mt-4 [@media(max-height:500px)]:h-[170px] [@media(max-height:500px)]:w-[170px] items-center justify-center rounded-full bg-[rgba(155,126,201,.16)]"
          animate={{ scale: still ? 1 : inhaling ? 1.12 : 1 }}
          transition={{ duration: still ? 0 : PHASE_MS / 1000, ease: 'easeInOut' }}
          aria-hidden
        >
          <div className="flex h-[198px] w-[198px] items-center justify-center rounded-full bg-[rgba(155,126,201,.24)] [@media(max-height:500px)]:h-[135px] [@media(max-height:500px)]:w-[135px]">
            <div className="h-[138px] w-[138px] rounded-full bg-[#9B7EC9] [@media(max-height:500px)]:h-[94px] [@media(max-height:500px)]:w-[94px]" />
          </div>
        </motion.div>
        {/* El texto va fuera del círculo animado para que no cambie de tamaño. */}
        <div aria-live="polite" className="relative z-10 -mt-[250px] flex h-[250px] w-[138px] flex-col items-center justify-center text-white [@media(max-height:500px)]:-mt-[170px] [@media(max-height:500px)]:h-[170px] [@media(max-height:500px)]:w-[110px]">
          <p className="font-heading text-[26px] font-bold leading-none [@media(max-height:500px)]:text-[19px]">{inhaling ? 'Tomá aire' : 'Soltá el aire'}</p>
          <p className="mt-1 text-sm font-bold [@media(max-height:500px)]:text-xs">{inhaling ? 'contá hasta 4' : 'despacito'}</p>
        </div>

        <div className="mt-6 flex items-center gap-3 [@media(max-height:500px)]:mt-3" aria-hidden>
          {Array.from({ length: TOTAL_BREATHS }, (_, index) => (
            <span key={index} className={`h-3 w-3 rounded-full ${index < doneBreaths ? 'bg-[#6b4c9a]' : 'bg-[#CFC0E8]'}`} />
          ))}
        </div>
        <p className="mt-2 text-sm text-[#6E5C8C] [@media(max-height:500px)]:mt-1">
          {finished ? 'Cuando quieras, seguimos' : `${breathNumber} de ${TOTAL_BREATHS} respiraciones`}
        </p>

        <div className="mt-auto w-full max-w-[360px] pt-10 [@media(max-height:500px)]:pt-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-14 [@media(max-height:500px)]:min-h-12 w-full rounded-full bg-[#6b4c9a] text-lg font-bold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Ya estoy mejor
          </button>
          {onNotify && (
            <button
              type="button"
              onClick={onNotify}
              disabled={notifyStatus === 'sending' || notifyStatus === 'sent'}
              className="mt-3 [@media(max-height:500px)]:mt-1 block min-h-12 w-full text-base font-bold text-[#6b4c9a] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:no-underline"
              aria-live="polite"
            >
              {notifyStatus === 'sending' && 'Avisando…'}
              {notifyStatus === 'sent' && 'Ya le avisamos ✓'}
              {notifyStatus === 'failed' && 'No pudimos avisar'}
              {notifyStatus === 'idle' && `Avisarle a ${recipientLabel}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
