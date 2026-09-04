import { useEffect, useState } from 'react';
import { fetchPictograms, type Pictogram } from '@/data/api';

// Unica responsabilidad: cards de causas comunes con pictograma, para
// completar mas rapido el "Que paso" de un registro emocional (Sesion 9,
// item 30 del roadmap). No reemplaza el campo de texto libre que ya
// existia — lo complementa: tocar una card la selecciona/deselecciona
// de forma independiente al texto.
//
// Lista fija y chica a proposito: son las causas mas comunes que
// aparecen en la practica de CAA (escuela, cambios, ruido...). Un picker
// generico de "elegir cualquier pictograma como causa" es una feature mas
// grande que no hace falta para el caso de uso real.
const COMMON_CAUSES = ['escuela', 'familia', 'cambio de planes', 'ruido', 'cansancio', 'amigos', 'tarea', 'salida'];

type EmotionCauseQuickPickerProps = {
  selected: string[];
  onToggle: (label: string) => void;
};

export default function EmotionCauseQuickPicker({ selected, onToggle }: EmotionCauseQuickPickerProps) {
  const [pictograms, setPictograms] = useState<Record<string, Pictogram | null>>({});

  useEffect(() => {
    let mounted = true;
    Promise.all(COMMON_CAUSES.map(async (cause) => {
      try {
        const results = await fetchPictograms({ search: cause, language: 'es', limit: 1 });
        return [cause, results[0] || null] as const;
      } catch {
        return [cause, null] as const;
      }
    })).then((entries) => {
      if (!mounted) return;
      setPictograms(Object.fromEntries(entries));
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {COMMON_CAUSES.map((cause) => {
        const picto = pictograms[cause];
        const isSelected = selected.includes(cause);
        return (
          <button
            key={cause}
            type="button"
            onClick={() => onToggle(cause)}
            aria-pressed={isSelected}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 text-[10px] font-medium leading-tight transition-all ${
              isSelected
                ? 'border-[#6b4c9a]/50 bg-[#f0e8fb] text-[#6b4c9a] shadow-sm'
                : 'border-[#ede4f8] bg-[#f8f4ff] text-[#6b4c9a] hover:border-[#6b4c9a]/40 hover:bg-[#f2ecfd]'
            }`}
          >
            {picto?.imageUrl ? (
              <img src={picto.imageUrl} alt="" className="h-6 w-6 shrink-0 object-contain" loading="lazy" />
            ) : (
              <span className="h-6 w-6 shrink-0" />
            )}
            <span className="min-w-0 text-center">{cause}</span>
          </button>
        );
      })}
    </div>
  );
}
