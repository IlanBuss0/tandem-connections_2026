import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { fetchPatternsReport, type PatternsReport } from '@/data/usageApi';

const EVENT_TYPE_LABEL: Record<string, string> = {
  medico: 'eventos médicos',
  terapia: 'terapia',
  escuela: 'la escuela',
  personal: 'eventos personales',
  social: 'eventos sociales',
  familiar: 'eventos familiares',
};

function labelForType(type: string): string {
  return EVENT_TYPE_LABEL[type] || `eventos de "${type}"`;
}

// Unica responsabilidad: mostrar deteccion de patrones (Sesion 20, item 41
// ⭐) y si anticipar con la historia social ayuda (item 43). Mismo patron
// on-demand-toggle que VocabularyReportView. Regla de honestidad: si el
// backend no encuentra nada con piso minimo de datos, se dice explicitamente
// que todavia no hay suficiente informacion — nunca se inventa un patron.
export default function PatternsReportView({ targetUsuarioId }: { targetUsuarioId: string }) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<PatternsReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || report) return;
    setLoading(true);
    fetchPatternsReport(targetUsuarioId).then(setReport).finally(() => setLoading(false));
  }, [open, report, targetUsuarioId]);

  const hasNothing = report && report.eventTypePatterns.length === 0 && !report.anticipationSupport;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${open ? 'border-transparent bg-[#6b4c9a] text-white' : 'border-[#ede4f8] text-[#6b4c9a] hover:bg-[#f5f0ff]'}`}
      >
        <Sparkles size={14} /> Patrones detectados
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3">
          {loading && <p className="py-2 text-center text-xs text-[#8b7aa0]">Calculando…</p>}
          {!loading && hasNothing && (
            <p className="py-2 text-center text-xs text-[#8b7aa0]">Todavía no hay suficientes datos acumulados para detectar patrones con confianza.</p>
          )}
          {!loading && report && report.eventTypePatterns.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-bold text-[#4a4a5a]">Puede haber una relación</p>
              <ul className="space-y-1">
                {report.eventTypePatterns.map((p) => (
                  <li key={p.type} className="rounded-xl bg-white px-2 py-1.5 text-xs text-[#4a4a5a]">
                    Cuando hay {labelForType(p.type)}, suele registrarse una emoción difícil ({Math.round(p.negativeRatio * 100)}% de {p.sampleSize} veces).
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!loading && report?.anticipationSupport && (
            <div>
              <p className="mb-1 text-xs font-bold text-[#4a4a5a]">¿Ayuda anticipar con la historia social?</p>
              <p className="rounded-xl bg-white px-2 py-1.5 text-xs text-[#4a4a5a]">
                {report.anticipationSupport.helps
                  ? `Sí: cuando se vio la historia social antes, el ánimo fue mejor (${Math.round(report.anticipationSupport.viewedPositiveRatio * 100)}% vs ${Math.round(report.anticipationSupport.notViewedPositiveRatio * 100)}%).`
                  : `Por ahora no se ve una diferencia clara (${Math.round(report.anticipationSupport.viewedPositiveRatio * 100)}% vs ${Math.round(report.anticipationSupport.notViewedPositiveRatio * 100)}%).`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
