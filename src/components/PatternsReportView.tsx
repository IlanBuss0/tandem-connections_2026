import { useEffect, useState } from 'react';
import { Info, Sparkles } from 'lucide-react';
import { fetchPatternsReport, type PatternsReport } from '@/data/usageApi';
import { predefinedLabels } from '@/contexts/RoutinesContext';
import Donut from './perteneciente/evolution/charts/Donut';
import HBarList from './perteneciente/evolution/charts/HBarList';

// El "tipo" de un evento de calendario es en realidad la seccion elegida
// con SectionSelector (mañana/escuela/mediodía/tarde/noche, mas
// categorias custom por usuario) — NO un dominio fijo tipo "medico" o
// "social". Un mapa hardcodeado de esos dominios queda desactualizado
// apenas alguien usa una seccion real o crea una propia; reusar
// predefinedLabels evita mantener dos listas de "que categorias existen".
export function labelForType(type: string): string {
  const predefined = predefinedLabels[type];
  if (predefined) {
    // predefinedLabels guarda "emoji Nombre" (ej "🌅 Mañana"); nos quedamos
    // solo con el nombre, sin depender de regex de propiedades unicode.
    const name = predefined.split(' ').slice(1).join(' ') || predefined;
    return `eventos de ${name.toLowerCase()}`;
  }
  return `eventos de "${type}"`;
}

// Mismo texto en pantalla (variant="card") y en el PDF de "Llevar un
// resumen" — una sola fuente para no duplicar el copy de honestidad.
export function anticipationSentence(helps: boolean): string {
  return helps
    ? 'Cuando vio antes la historia social, su ánimo fue más positivo.'
    : 'Por ahora no vemos una diferencia clara al anticipar con la historia social.';
}

// Unica responsabilidad: mostrar deteccion de patrones (Sesion 20, item 41
// ⭐) y si anticipar con la historia social ayuda (item 43). variant="toggle"
// (default): mismo patron on-demand-toggle original. variant="card": se
// carga al montar, para la sub-tab Comunicacion del diseño de Evolucion.
// Regla de honestidad: si el backend no encuentra nada con piso minimo de
// datos, se dice explicitamente que todavia no hay suficiente informacion
// — nunca se inventa un patron.
export default function PatternsReportView({ targetUsuarioId, variant = 'toggle' }: { targetUsuarioId: string; variant?: 'toggle' | 'card' }) {
  const [open, setOpen] = useState(variant === 'card');
  const [report, setReport] = useState<PatternsReport | null>(null);
  const [loading, setLoading] = useState(variant === 'card');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || report) return;
    setLoading(true);
    setError(false);
    fetchPatternsReport(targetUsuarioId)
      .then(result => { if (result) setReport(result); else setError(true); })
      .finally(() => setLoading(false));
  }, [open, report, targetUsuarioId]);

  const hasNothing = report && report.eventTypePatterns.length === 0 && !report.anticipationSupport;

  if (variant === 'card') {
    return (
      <div className="rounded-2xl border border-[var(--evo-border-1)] bg-white p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--evo-soft)] text-[var(--evo-primary)]"><Sparkles size={16} aria-hidden /></span>
          <p className="text-sm font-bold text-[var(--evo-text)]">Patrones detectados</p>
        </div>
        {loading && <p className="mt-3 text-sm text-[var(--evo-text-secondary)]">Calculando…</p>}
        {!loading && error && <p className="mt-3 text-sm text-[var(--evo-text-secondary)]">No pudimos cargar la información. Intentá nuevamente.</p>}
        {!loading && !error && hasNothing && (
          <div className="mt-3 rounded-2xl bg-[var(--evo-block)] p-4">
            <p className="text-sm font-bold text-[var(--evo-text)]">Todavía no podemos detectar patrones.</p>
            <p className="mt-1 text-sm text-[var(--evo-text-secondary)]">Necesitamos más registros para no adelantarnos ni inventar nada. Vuelvan a mirar más adelante.</p>
          </div>
        )}
        {!loading && !error && report && report.eventTypePatterns.length > 0 && (
          <div className="mt-3 space-y-3">
            {report.eventTypePatterns.map(p => (
              <div key={p.type} className="rounded-2xl bg-[var(--evo-block)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--evo-text-secondary)]">Eventos y emociones</p>
                <div className="mt-2 flex items-center gap-3">
                  <Donut percent={p.negativeRatio * 100} centerLabel={`${Math.round(p.negativeRatio * 100)}%`} label={`${labelForType(p.type)}: ${Math.round(p.negativeRatio * 100)}% de ${p.sampleSize} veces`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--evo-text)]">Cuando hay {labelForType(p.type)}, suele registrarse una emoción difícil.</p>
                    <p className="mt-1 text-xs text-[var(--evo-text-secondary)]">{Math.round(p.negativeRatio * 100)}% de {p.sampleSize} veces</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && report?.anticipationSupport && (
          <div className="mt-3 rounded-2xl bg-[var(--evo-block)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--evo-text-secondary)]">Anticipar con historia social</p>
            <p className="mt-1 text-sm font-semibold text-[var(--evo-text)]">
              {anticipationSentence(report.anticipationSupport.helps)}
            </p>
            <div className="mt-2">
              <HBarList
                items={[
                  { label: 'Sin anticipar', value: Math.round(report.anticipationSupport.notViewedPositiveRatio * 100) },
                  { label: 'Con historia social', value: Math.round(report.anticipationSupport.viewedPositiveRatio * 100) },
                ]}
                max={100}
                formatValue={value => `${value}%`}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--evo-text-secondary)]">Porcentaje de ánimo positivo después del evento.</p>
          </div>
        )}
        <p className="mt-4 flex items-start gap-1.5 text-xs text-[var(--evo-text-secondary)]"><Info size={14} className="mt-0.5 shrink-0" aria-hidden /> Solo mostramos lo que tiene suficiente confianza. Son pistas para conversar y acompañar mejor, no un diagnóstico.</p>
      </div>
    );
  }

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
