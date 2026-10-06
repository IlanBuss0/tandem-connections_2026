import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { isSpeechSupported, speakText } from '@/lib/speech';

interface Props {
  activityTitle: string;
  stepNumber: number;
  totalSteps: number;
  stepText: string;
  previousStepText?: string;
  nextStepText?: string;
  recipientLabel: string;
  /** Mismo pictograma que muestra la actividad (StepIcon). */
  icon: ReactNode;
  onBack: () => void;
  onContinue: () => void;
  onAskForHelp: () => void;
}

export default function StepExplainView({ activityTitle, stepNumber, totalSteps, stepText, previousStepText, nextStepText, recipientLabel, icon, onBack, onContinue, onAskForHelp }: Props) {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 pb-20 lg:pb-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Volver a la actividad" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ede4f8] bg-white text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft size={18} aria-hidden />
        </button>
        <p className="min-w-0 truncate text-sm font-bold text-[#8b7aa0]">{activityTitle}</p>
      </div>
      <h2 className="font-heading text-3xl font-bold leading-tight text-[#6b4c9a]">Este paso, más despacio</h2>

      {previousStepText && (
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-[#ede4f8] bg-white/60 px-4 py-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8b7aa0]">Recién</span>
          <span className="min-w-0 text-sm text-[#8b7aa0]"><span aria-hidden>✓ </span>{previousStepText}</span>
        </div>
      )}

      <section className="flex flex-col items-center gap-4 rounded-[28px] border-2 border-[#6b4c9a] bg-white p-5 text-center shadow-sm" aria-label={`Paso ${stepNumber} de ${totalSteps}`}>
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8b7aa0]">Paso {stepNumber} de {totalSteps} · Ahora</p>
        <span className="flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-3xl bg-[#6b4c9a]/10 text-7xl">{icon}</span>
        <p className="text-[22px] font-bold leading-snug text-[#2b2145]">{stepText}</p>
        {isSpeechSupported() && (
          <button
            type="button"
            onClick={() => void speakText(stepText)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#ede4f8] bg-[#f3eefc] text-base font-bold text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span aria-hidden>🔊</span> Escuchar el paso
          </button>
        )}
      </section>

      {nextStepText && (
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-[#ede4f8] bg-white/60 px-4 py-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8b7aa0]">Después</span>
          <span className="min-w-0 text-sm text-[#8b7aa0]">{nextStepText}</span>
        </div>
      )}

      <p className="pt-2 text-center text-lg font-bold text-[#2b2145]">¿Ahora sí?</p>
      <button type="button" onClick={onContinue} className="min-h-14 w-full rounded-full bg-[#6b4c9a] text-lg font-bold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        Sí, sigo
      </button>
      <button type="button" onClick={onAskForHelp} className="min-h-14 w-full rounded-full border border-[#ede4f8] bg-white text-base font-bold text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        No, avisale a {recipientLabel}
      </button>
    </div>
  );
}
