import { useEffect, useState } from 'react';
import { Eye, Pencil, X } from 'lucide-react';
import {
  fetchRoutinesForUser,
  saveRoutinesForUser,
  rememberPictogramChoice,
  type DayRoutine,
  type RoutineItem,
  type Pictogram,
} from '@/data/api';
import RoutinePictogram from '@/components/RoutinePictogram';
import RoutinePictogramPicker from '@/components/RoutinePictogramPicker';
import TutorUsageTimeline from '@/components/TutorUsageTimeline';
import VocabularyReportView from '@/components/VocabularyReportView';
import PatternsReportView from '@/components/PatternsReportView';
import EvolutionReportView from '@/components/EvolutionReportView';

// Unica responsabilidad: que un tutor vea "Mi dia" de un perteneciente
// exactamente como lo ve esa persona (item 11 del roadmap, "vista previa"),
// y pueda corregir el pictograma de un paso puntual (item 12, circuito de
// correccion ⭐). La correccion queda guardada en el vocabulario personal
// DEL PERTENECIENTE (Sesion 2), no del tutor, asi que la proxima vez que
// esa persona vea ese mismo texto -en cualquier pantalla- ya sale bien.
//
// Deliberadamente de solo lectura para todo lo que NO es el pictograma: no
// es un editor de rutinas para tutores (eso es una feature mas grande y
// mas riesgosa, con el problema de escrituras concurrentes con la persona
// editando su propia rutina al mismo tiempo). Corregir un pictograma es
// una escritura chica y acotada: solo toca esos 5 campos de ESE item.
export default function TutorRoutinePictogramReview({ targetUsuarioId, targetName }: { targetUsuarioId: string; targetName?: string }) {
  const [routines, setRoutines] = useState<DayRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [correctingItemId, setCorrectingItemId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchRoutinesForUser(targetUsuarioId)
      .then((rows) => { if (mounted) setRoutines(rows); })
      .catch(() => { if (mounted) setRoutines([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [targetUsuarioId]);

  const applyCorrection = async (routineId: string, item: RoutineItem, picto: Pictogram) => {
    const patch: Partial<RoutineItem> = {
      pictogramId: picto.id,
      pictogramImageUrl: picto.imageUrl,
      pictogramName: picto.name,
      pictogramConfidence: 'alta',
      pictogramResolvedFor: item.title,
    };
    const next = routines.map((r) => r.id !== routineId ? r : {
      ...r,
      items: r.items.map((it) => it.id === item.id ? { ...it, ...patch } : it),
    });
    setRoutines(next);
    setCorrectingItemId(null);

    await saveRoutinesForUser(targetUsuarioId, next).catch(() => undefined);
    await rememberPictogramChoice(item.title, picto.id, targetUsuarioId);
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-[#8b7aa0]">Cargando…</p>;
  }

  if (routines.length === 0) {
    return <p className="py-8 text-center text-sm text-[#8b7aa0]">{(targetName || 'Esta persona')} todavía no cargó ningún día en "Mi día".</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-xs text-[#6b4c9a]">
        <Eye size={14} className="shrink-0" />
        Así ve {targetName || 'esta persona'} sus pasos en modo pictograma. Tocá "Corregir" para cambiar uno.
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-[#4a4a5a]">Actividad reciente</h3>
        <TutorUsageTimeline targetUsuarioId={targetUsuarioId} />
      </div>

      <div className="flex flex-wrap gap-2">
        <VocabularyReportView targetUsuarioId={targetUsuarioId} />
        <PatternsReportView targetUsuarioId={targetUsuarioId} />
        <EvolutionReportView targetUsuarioId={targetUsuarioId} />
      </div>

      {routines.map((routine) => (
        <div key={routine.id} className="space-y-2">
          <h3 className="text-sm font-bold text-[#4a4a5a]">{routine.name}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {routine.items.map((item) => (
              <div key={item.id} className="relative flex flex-col items-center gap-1.5 rounded-2xl border border-[#ede4f8] bg-white p-3 text-center">
                <RoutinePictogram item={item} size="lg" />
                <span className="text-xs font-medium text-[#4a4a5a]">{item.pictogramLabel || item.title}</span>
                <span className="text-[10px] text-[#8b7aa0]">{item.time}</span>
                <button
                  type="button"
                  onClick={() => setCorrectingItemId(correctingItemId === item.id ? null : item.id)}
                  className="mt-1 flex items-center gap-1 rounded-full border border-[#6b4c9a]/30 px-2 py-1 text-[10px] font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff]"
                >
                  {correctingItemId === item.id ? <X size={10} /> : <Pencil size={10} />}
                  {correctingItemId === item.id ? 'Cancelar' : 'Corregir'}
                </button>
                {correctingItemId === item.id && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-2xl border border-[#ede4f8] bg-white p-2 shadow-lg">
                    <RoutinePictogramPicker onSelect={(picto) => applyCorrection(routine.id, item, picto)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
