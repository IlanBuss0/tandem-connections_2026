import { ArrowLeft, RotateCw } from 'lucide-react';

interface Props {
  activityTitle: string;
  stepNumber: number;
  stepText: string;
  onBack: () => void;
  /** Si no viene, el botón "Probar de nuevo" no se muestra. */
  onRetry?: () => void;
  /** Si no viene, el botón "Respirar un rato" no se muestra. */
  onCalm?: () => void;
}

const secondaryButton = 'flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-[#ede4f8] bg-white text-base font-bold text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function ShowSomeoneView({ activityTitle, stepNumber, stepText, onBack, onRetry, onCalm }: Props) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col gap-4 pb-20 lg:pb-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Volver a la actividad" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ede4f8] bg-white text-[#6b4c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft size={18} aria-hidden />
        </button>
        <p className="min-w-0 truncate text-sm font-bold text-[#8b7aa0]">{activityTitle}</p>
      </div>

      <div className="rounded-2xl border border-[#F3DDA0] bg-[#FFF1D9] p-4">
        <h2 className="font-heading text-2xl font-bold text-[#7A5200]">No pudimos avisar</h2>
        <p className="mt-1 text-base text-[#7A5200]">Buscá a alguien cerca y mostrale esta pantalla.</p>
      </div>

      <section className="rounded-[28px] border-[3px] border-[#E8705A] bg-white p-5 text-center">
        <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#9A3A24]"><span aria-hidden>🙋</span> Necesito ayuda</p>
        <p className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#2b2145]">{activityTitle}</p>
        <p className="mt-2 text-lg font-bold text-[#2b2145]">Paso {stepNumber}: {stepText}</p>
      </section>

      <div className="mt-auto space-y-3 pt-6">
        {onRetry && (
          <button type="button" onClick={onRetry} className={secondaryButton}>
            <RotateCw size={16} aria-hidden /> Probar de nuevo
          </button>
        )}
        {onCalm && (
          <button type="button" onClick={onCalm} className={secondaryButton}>
            <span aria-hidden>🌙</span> Respirar un rato
          </button>
        )}
        <button type="button" onClick={onBack} className="min-h-14 w-full rounded-full bg-[#6b4c9a] text-lg font-bold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Volver a la actividad
        </button>
      </div>
    </div>
  );
}
