import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Notification } from '@/data/api';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { helpReason, parseHelpMessage, type HelpReason } from '@/lib/helpAlerts';
import { tutorRelativeTime } from '@/lib/tutorHomeModel';

interface Props {
  /** Pendientes, la más nueva primero. Se muestra solo la primera. */
  alerts: Notification[];
  onWrite: (alert: Notification) => void;
  onDismiss: (alert: Notification) => void;
}

const REASON_STYLE: Record<HelpReason, { icon: string; iconBg: string; title: string; box: string; border: string; accent?: string }> = {
  ayuda: { icon: '🙋', iconBg: '#FDEDE8', title: '#9A3A24', box: '#FFF8F5', border: '#F6C3B5' },
  no_entiende: { icon: '❓', iconBg: '#DDF0FA', title: '#14587A', box: '#F2F9FD', border: '#DDF0FA' },
  pausa: { icon: '🌙', iconBg: '#EDE6FA', title: '#553588', box: '#F7F3FD', border: '#EDE6FA' },
  // Escaneo de la tarjeta de ayuda: aviso informativo, sin caja de color en el texto.
  tarjeta: { icon: '🪪', iconBg: '#DDF0FA', title: '#2B2145', box: 'transparent', border: '#EDE6FA', accent: '#6F4CA6' },
};

export default function HelpAlertBanner({ alerts, onWrite, onDismiss }: Props) {
  const { settings } = useAccessibility();
  const current = alerts[0];
  if (!current) return null;

  const reason = helpReason(current);
  const style = REASON_STYLE[reason];
  const still = settings.pauseAnimations || settings.reduceMotion;
  const others = alerts.length - 1;
  const time = tutorRelativeTime(current.timestamp);

  return (
    <div className="pointer-events-none fixed inset-x-3 top-[4.5rem] z-40 lg:inset-x-auto lg:right-6 lg:w-[400px]">
      {/* key por aviso: el role="alert" se anuncia al aparecer uno nuevo, no en cada render. */}
      <motion.div
        key={current.id}
        role="alert"
        aria-live="assertive"
        initial={still ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: still ? 0 : 0.2 }}
        className="pointer-events-auto relative rounded-[22px] border-[1.5px] bg-white p-3.5 shadow-[0_10px_30px_rgba(85,53,136,0.14)]"
        style={{ borderColor: style.border, ...(style.accent ? { borderLeftColor: style.accent, borderLeftWidth: 6 } : {}) }}
      >
        <button
          type="button"
          onClick={() => onDismiss(current)}
          aria-label="Cerrar aviso"
          className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-full text-[#8b7aa0] hover:bg-[#F1EAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
        >
          <X size={16} aria-hidden />
        </button>
        <div className="flex items-center gap-3 pr-8">
          <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-xl" style={{ backgroundColor: style.iconBg }} aria-hidden>{style.icon}</span>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight" style={{ color: style.title }}>{current.title}</p>
            <p className="text-xs text-[#8b7aa0]">{time ? time.charAt(0).toLowerCase() + time.slice(1) : ''}</p>
          </div>
        </div>
        <p className={`mt-3 rounded-2xl text-sm text-[#2b2145] ${reason === 'tarjeta' ? 'px-0 py-1' : 'px-3.5 py-3'}`} style={{ backgroundColor: style.box }}>
          {parseHelpMessage(current.message).map((part, index) => (
            <span key={index}>
              {part.breakBefore && <br />}
              {part.bold ? <strong>{part.text}</strong> : part.text}
            </span>
          ))}
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => onWrite(current)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#6F4CA6] text-sm font-bold text-white hover:bg-[#5f3f94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <span aria-hidden>💬</span> Escribirle
          </button>
          <button type="button" onClick={() => onDismiss(current)} className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#F1EAFB] text-sm font-bold text-[#553588] hover:bg-[#e9dff8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Listo
          </button>
        </div>
        {others > 0 && <p className="mt-2 text-center text-xs font-semibold text-[#8b7aa0]">+{others} {others === 1 ? 'aviso más' : 'avisos más'}</p>}
      </motion.div>
    </div>
  );
}
