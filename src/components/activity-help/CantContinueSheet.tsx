import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { AgendaSheet } from '@/components/agenda/AgendaSheet';
import { helpRecipientLabel } from './helpRecipientLabel';

interface Props {
  planB?: string;
  assignedByName?: string;
  recipientLabel: string;
  onClose: () => void;
  onUsePlanB: () => void;
  onNeedHelp: () => void;
  onNotUnderstand: () => void;
  /** Si no viene, la opción de pausa no se muestra. */
  onPause?: () => void;
}

function OptionRow({ icon, iconBg, title, subtitle, onClick }: { icon: string; iconBg: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-4 rounded-[20px] border border-[#ede4f8] bg-[#faf8ff] px-4 py-3 text-left transition hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: iconBg }} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-[#2b2145]">{title}</span>
        <span className="block text-sm text-[#8b7aa0]">{subtitle}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-[#8b7aa0]" aria-hidden />
    </button>
  );
}

export default function CantContinueSheet({ planB, assignedByName, recipientLabel, onClose, onUsePlanB, onNeedHelp, onNotUnderstand, onPause }: Props): ReactNode {
  const cleanPlanB = planB?.trim();
  return (
    <AgendaSheet title="¿Qué necesitás?" subtitle="Elegí una. Está bien trabarse." onClose={onClose}>
      {cleanPlanB && (
        <div className="rounded-[18px] border border-[#A8E3C9] bg-[#DCF5EA] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#0B6B4A]">
            <span aria-hidden>💡</span> Otra forma de hacerlo
          </p>
          <p className="mt-1.5 text-[15px] font-semibold leading-snug text-[#134E3A]">{cleanPlanB}</p>
          <button
            type="button"
            onClick={onUsePlanB}
            className="mt-3 h-[46px] w-full rounded-full bg-[#2FB585] text-base font-bold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Lo hago así
          </button>
          {assignedByName && <p className="mt-2 text-center text-sm text-[#0B6B4A]">Te lo dejó {helpRecipientLabel(assignedByName, 'tutor')}</p>}
        </div>
      )}
      <div className="space-y-3">
        <OptionRow icon="🙋" iconBg="#FDEDE8" title="Necesito ayuda" subtitle={`Le aviso a ${recipientLabel}`} onClick={onNeedHelp} />
        <OptionRow icon="❓" iconBg="#DDF0FA" title="No entiendo este paso" subtitle="Te lo muestro más despacio" onClick={onNotUnderstand} />
        {onPause && <OptionRow icon="🌙" iconBg="#EDE6FA" title="Necesito una pausa" subtitle="Respiramos un rato" onClick={onPause} />}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mx-auto block min-h-12 px-4 text-base font-bold text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Volver a la actividad
      </button>
    </AgendaSheet>
  );
}
