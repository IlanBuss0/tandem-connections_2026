import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { fetchEvolutionReport, type EvolutionWeek } from '@/data/usageApi';

function weekLabel(week: string): string {
  const [, w] = week.split('-W');
  return `Sem ${w}`;
}

// Unica responsabilidad: mostrar la evolucion semana a semana (Sesion 21,
// item 44) — pasos completados y proporcion de animo positivo. Mismo
// patron on-demand-toggle que VocabularyReportView / PatternsReportView.
// Puramente descriptivo: no afirma causas, solo cuenta lo que paso.
export default function EvolutionReportView({ targetUsuarioId }: { targetUsuarioId: string }) {
  const [open, setOpen] = useState(false);
  const [weeks, setWeeks] = useState<EvolutionWeek[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || weeks) return;
    setLoading(true);
    fetchEvolutionReport(targetUsuarioId).then(setWeeks).finally(() => setLoading(false));
  }, [open, weeks, targetUsuarioId]);

  const maxCompletions = Math.max(1, ...(weeks || []).map((w) => w.routineCompletions));

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${open ? 'border-transparent bg-[#6b4c9a] text-white' : 'border-[#ede4f8] text-[#6b4c9a] hover:bg-[#f5f0ff]'}`}
      >
        <TrendingUp size={14} /> Evolución
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3">
          {loading && <p className="py-2 text-center text-xs text-[#8b7aa0]">Calculando…</p>}
          {!loading && weeks && weeks.length === 0 && (
            <p className="py-2 text-center text-xs text-[#8b7aa0]">Todavía no hay actividad registrada para mostrar una evolución.</p>
          )}
          {!loading && weeks && weeks.length > 0 && (
            <div className="space-y-1.5">
              {weeks.map((w) => (
                <div key={w.week} className="flex items-center gap-2 text-xs">
                  <span className="w-14 shrink-0 text-[#8b7aa0]">{weekLabel(w.week)}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#ede4f8]">
                    <div
                      className="h-full rounded-full bg-[#6b4c9a]"
                      style={{ width: `${(w.routineCompletions / maxCompletions) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right font-semibold text-[#4a4a5a]">{w.routineCompletions}</span>
                  {w.positiveEmotionRatio !== null && (
                    <span className="w-10 shrink-0 text-right text-[#8b7aa0]">{Math.round(w.positiveEmotionRatio * 100)}% 🙂</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
