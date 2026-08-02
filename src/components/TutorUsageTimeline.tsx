import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Heart, HelpingHand, Mic, Wand2 } from 'lucide-react';
import { fetchUsageEvents, type UsageEventRecord, type UsageEventType } from '@/data/usageApi';

// Unica responsabilidad: mostrarle al tutor un timeline chico de lo ultimo
// que hizo el perteneciente (Sesion 9) — el consumidor visible del registro
// de uso, para que la sesion no quede totalmente invisible. Es deliberadamente
// simple (lista, no grafico): los graficos de patrones/tendencias son el
// bloque F completo (Sesion 19-21), que necesita mas datos acumulados para
// no mentir con conclusiones apuradas.
const TYPE_LABEL: Record<UsageEventType, string> = {
  rutina_paso_completado: 'Completó un paso de su rutina',
  emocion_registrada: 'Registró una emoción',
  pictograma_elegido: 'Eligió un pictograma a mano',
  pictograma_corregido: 'Le corrigieron un pictograma',
  tarjeta_autonomia_usada: 'Usó una tarjeta de autonomía',
  enunciado_hablado: 'Dijo una frase con el comunicador',
};

const TYPE_ICON: Record<UsageEventType, typeof Activity> = {
  rutina_paso_completado: CheckCircle2,
  emocion_registrada: Heart,
  pictograma_elegido: Wand2,
  pictograma_corregido: Wand2,
  tarjeta_autonomia_usada: HelpingHand,
  enunciado_hablado: Mic,
};

function describe(event: UsageEventRecord): string {
  const title = event.valor?.title as string | undefined;
  const emotion = event.valor?.emotion as string | undefined;
  const cardLabel = event.valor?.label as string | undefined;
  if (event.tipo_evento === 'rutina_paso_completado' && title) return title;
  if (event.tipo_evento === 'emocion_registrada' && emotion) return emotion;
  if (event.tipo_evento === 'tarjeta_autonomia_usada' && cardLabel) return `"${cardLabel}"`;
  const utteranceText = event.valor?.text as string | undefined;
  if (event.tipo_evento === 'enunciado_hablado' && utteranceText) return `"${utteranceText}"`;
  return TYPE_LABEL[event.tipo_evento];
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function TutorUsageTimeline({ targetUsuarioId }: { targetUsuarioId: string }) {
  const [events, setEvents] = useState<UsageEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchUsageEvents(targetUsuarioId, { limit: 20 })
      .then((rows) => { if (mounted) setEvents(rows); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [targetUsuarioId]);

  if (loading) return <p className="py-4 text-center text-xs text-[#8b7aa0]">Cargando actividad…</p>;
  if (events.length === 0) return <p className="py-4 text-center text-xs text-[#8b7aa0]">Todavía no hay actividad registrada.</p>;

  return (
    <div className="space-y-1.5">
      {events.map((event) => {
        const Icon = TYPE_ICON[event.tipo_evento] || Activity;
        return (
          <div key={event.id} className="flex items-center gap-2.5 rounded-xl border border-[#ede4f8] bg-white px-3 py-2">
            <Icon size={14} className="shrink-0 text-[#6b4c9a]" />
            <span className="flex-1 truncate text-xs text-[#4a4a5a]">{describe(event)}</span>
            <span className="shrink-0 text-[10px] text-[#8b7aa0]">{formatWhen(event.ocurrido_en)}</span>
          </div>
        );
      })}
    </div>
  );
}
