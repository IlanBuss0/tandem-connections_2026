import { useEffect, useState } from 'react';
import { fetchPictograms, type Pictogram } from '@/data/api';

// Unica responsabilidad: chips de causas comunes con pictograma, para
// completar mas rapido el "Que paso" de un registro emocional (Sesion 9,
// item 30 del roadmap). No reemplaza el campo de texto libre que ya
// existia — lo complementa: tocar un chip agrega esa palabra al texto.
//
// Lista fija y chica a proposito: son las causas mas comunes que
// aparecen en la practica de CAA (escuela, cambios, ruido...). Un picker
// generico de "elegir cualquier pictograma como causa" es una feature mas
// grande que no hace falta para el caso de uso real.
const COMMON_CAUSES = ['escuela', 'familia', 'cambio de planes', 'ruido', 'cansancio', 'amigos', 'tarea', 'salida'];

export default function EmotionCauseQuickPicker({ onPick }: { onPick: (label: string) => void }) {
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
    <div className="flex flex-wrap gap-1.5">
      {COMMON_CAUSES.map((cause) => {
        const picto = pictograms[cause];
        return (
          <button
            key={cause}
            type="button"
            onClick={() => onPick(cause)}
            className="flex items-center gap-1 rounded-full border border-[#ede4f8] bg-[#faf8ff] py-1 pl-1 pr-2.5 text-xs text-[#6b4c9a] hover:border-[#6b4c9a]/40 hover:bg-[#f5f0ff]"
          >
            {picto?.imageUrl ? (
              <img src={picto.imageUrl} alt="" className="h-5 w-5 object-contain" loading="lazy" />
            ) : (
              <span className="h-5 w-5" />
            )}
            {cause}
          </button>
        );
      })}
    </div>
  );
}
