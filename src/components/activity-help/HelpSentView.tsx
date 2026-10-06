import { Check } from 'lucide-react';
import { joinNames } from './useHelpRequest';

interface Props {
  sending: boolean;
  avisados: string[];
  activityTitle: string;
  stepNumber: number;
  stepText: string;
  planB?: string;
  onUsePlanB: () => void;
  onCalm: () => void;
  onBack: () => void;
}

export default function HelpSentView({ sending, avisados, activityTitle, stepNumber, stepText, planB, onUsePlanB, onCalm, onBack }: Props) {
  const cleanPlanB = planB?.trim();
  const many = avisados.length > 1;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center gap-4 pb-20 text-center lg:pb-6">
      {sending ? (
        <p role="status" className="mt-24 text-xl font-bold text-[#6b4c9a]">Avisando…</p>
      ) : (
        <>
          <span className="mt-6 flex h-[104px] w-[104px] items-center justify-center rounded-full bg-[#DCF5EA]" aria-hidden>
            <span className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#2FB585] text-white"><Check size={36} strokeWidth={3} /></span>
          </span>
          <h2 role="status" className="font-heading text-[30px] font-bold leading-tight text-[#6b4c9a]">Ya le avisamos a {joinNames(avisados)}</h2>
          <p className="text-base text-[#8b7aa0]">
            {many ? 'Saben' : 'Sabe'} que estás en <strong className="text-[#2b2145]">{activityTitle}</strong>, en el paso <strong className="text-[#2b2145]">{stepNumber}: {stepText}</strong>.
          </p>
          {cleanPlanB && (
            <div className="w-full rounded-[18px] border border-[#A8E3C9] bg-[#DCF5EA] p-4 text-left">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#0B6B4A]"><span aria-hidden>💡</span> Mientras tanto, podés probar</p>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug text-[#134E3A]">{cleanPlanB}</p>
              <button type="button" onClick={onUsePlanB} className="mt-3 h-[46px] w-full rounded-full bg-[#2FB585] text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Lo hago así
              </button>
            </div>
          )}
        </>
      )}

      <div className="mt-auto w-full space-y-3 pt-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8b7aa0]">Mientras esperás</p>
        <button type="button" onClick={onCalm} disabled={sending} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-[#ede4f8] bg-white text-base font-bold text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
          <span aria-hidden>🌙</span> Respirar un rato
        </button>
        <button type="button" onClick={onBack} className="min-h-14 w-full rounded-full bg-[#6b4c9a] text-lg font-bold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Volver a la actividad
        </button>
      </div>
    </div>
  );
}
