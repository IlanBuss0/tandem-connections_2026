import { useMemo, useState } from 'react';
import { ChevronRight, Check, X, Compass } from 'lucide-react';
import type { RoutineItem } from '@/data/api';
import { useRoutines } from '@/contexts/RoutinesContext';
import RoutinePictogram from '@/components/RoutinePictogram';
import SpeakButton from '@/components/SpeakButton';

// Unica responsabilidad: guiar UN paso a la vez (Sesion 18, item 31) — a
// diferencia de la grilla de "Mi dia" (que muestra TODOS los pasos juntos,
// pensada para tener panorama), este modo achica la pantalla a una sola
// cosa: la que hay que hacer ahora. Menos pasos visibles a la vez = menos
// sobrecarga en el momento de hacer las cosas, no de planificarlas.
export default function GuidedRoutineMode({ routineId, items }: { routineId: string; items: RoutineItem[] }) {
  const { toggleItem } = useRoutines();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const pending = useMemo(() => items.filter((it) => !it.completed), [items]);
  const current = pending[index] || null;

  const start = () => {
    setIndex(0);
    setOpen(true);
  };

  const markDoneAndNext = () => {
    if (!current) return;
    toggleItem(routineId, current.id);
    // No se avanza el indice: al completarse, `current` sale de `pending`
    // y el siguiente pendiente ocupa el mismo indice solo.
    if (pending.length <= 1) setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={pending.length === 0}
        className="flex items-center gap-1.5 rounded-full border border-[#ede4f8] bg-white px-3 py-2 text-xs font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Compass size={14} /> Modo guiado
      </button>
    );
  }

  if (!current) {
    setOpen(false);
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#ede4f8] p-4">
        <span className="text-xs font-semibold text-[#8b7aa0]">Paso {index + 1} de {pending.length}</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-full p-2 text-[#8b7aa0] hover:bg-[#f5f0ff]">
          <X size={22} />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <RoutinePictogram item={current} size="lg" />
        <h2 className="text-center text-2xl font-bold text-[#4a4a5a]">{current.pictogramLabel || current.title}</h2>
        <SpeakButton text={current.pictogramLabel || current.title} size={20} />
      </div>
      <div className="border-t border-[#ede4f8] p-4">
        <button
          type="button"
          onClick={markDoneAndNext}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#6b4c9a] py-4 text-base font-bold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95"
        >
          <Check size={20} /> Listo, siguiente <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
