import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { fetchVocabularyReport, type VocabularyReport } from '@/data/usageApi';
import Donut from './perteneciente/evolution/charts/Donut';
import HBarList from './perteneciente/evolution/charts/HBarList';

// Unica responsabilidad: mostrar el informe de vocabulario (Sesion 19,
// item 42) para un usuario — que palabras del nucleo (Sesion 11) uso y
// cuales nunca uso. variant="toggle" (default): boton para abrir/cerrar,
// comportamiento original. variant="card": se carga al montar, para la
// sub-tab Comunicacion del diseño de Evolucion.
export default function VocabularyReportView({ targetUsuarioId, variant = 'toggle' }: { targetUsuarioId: string; variant?: 'toggle' | 'card' }) {
  const [open, setOpen] = useState(variant === 'card');
  const [report, setReport] = useState<VocabularyReport | null>(null);
  const [loading, setLoading] = useState(variant === 'card');
  const [error, setError] = useState(false);
  const [showAllUnused, setShowAllUnused] = useState(false);

  useEffect(() => {
    if (!open || report) return;
    setLoading(true);
    setError(false);
    fetchVocabularyReport(targetUsuarioId)
      .then(result => { if (result) setReport(result); else setError(true); })
      .finally(() => setLoading(false));
  }, [open, report, targetUsuarioId]);

  if (variant === 'card') {
    const total = report ? report.used.length + report.neverUsed.length : 0;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--evo-border-1)] bg-white p-4">
          {loading && <p className="text-sm text-[var(--evo-text-secondary)]">Calculando…</p>}
          {!loading && error && <p className="text-sm text-[var(--evo-text-secondary)]">No pudimos cargar la información. Intentá nuevamente.</p>}
          {!loading && !error && report && report.totalUtterances === 0 && (
            <p className="text-sm text-[var(--evo-text-secondary)]">Todavía no hay frases dichas con el comunicador para armar un informe.</p>
          )}
          {!loading && !error && report && report.totalUtterances > 0 && (
            <div className="flex items-center gap-4">
              <Donut percent={(report.used.length / Math.max(1, total)) * 100} centerLabel={`${report.used.length}/${total}`} label="Palabras del núcleo usadas" />
              <div className="min-w-0">
                <p className="font-heading text-2xl font-bold text-[var(--evo-primary-text)]">{report.totalUtterances}</p>
                <p className="text-sm text-[var(--evo-text-secondary)]">frase{report.totalUtterances === 1 ? '' : 's'} dicha{report.totalUtterances === 1 ? '' : 's'} con su comunicador de pictogramas</p>
                <p className="mt-1 text-sm font-semibold text-[var(--evo-text)]">{report.used.length} de {total} palabras del núcleo ya aparecen en sus frases.</p>
              </div>
            </div>
          )}
        </div>

        {!loading && !error && report && report.totalUtterances > 0 && (report.used.length > 0 || report.neverUsed.length > 0) && (
          <div className="rounded-2xl border border-[var(--evo-border-1)] bg-white p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--evo-soft)] text-[var(--evo-primary)]"><BarChart3 size={16} aria-hidden /></span>
              <p className="text-sm font-bold text-[var(--evo-text)]">Informe de vocabulario</p>
            </div>
            {report.used.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-bold text-[var(--evo-text)]">Las palabras que más usa</p>
                <HBarList items={report.used.slice(0, 8).map(u => ({ label: u.word, value: u.count }))} formatValue={value => `×${value}`} />
              </div>
            )}
            {report.neverUsed.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-xs font-bold text-[var(--evo-text)]">Palabras del núcleo para probar juntos</p>
                <div className="flex flex-wrap gap-1.5">
                  {report.neverUsed.map((word, index) => (
                    <span
                      key={word}
                      className={`rounded-full bg-[var(--evo-chip-bg)] px-2.5 py-1 text-xs text-[var(--evo-chip-text)] ${index >= 3 && !showAllUnused ? 'hidden lg:inline-block' : ''}`}
                    >{word}</span>
                  ))}
                </div>
                {!showAllUnused && report.neverUsed.length > 3 && (
                  <button type="button" onClick={() => setShowAllUnused(true)} aria-expanded={showAllUnused} className="mt-2 min-h-9 text-xs font-bold text-[var(--evo-primary)] lg:hidden">Ver {report.neverUsed.length - 3} más</button>
                )}
                <p className="mt-2 text-xs text-[var(--evo-text-secondary)]">Son parte del vocabulario básico (núcleo) y todavía no aparecen en sus frases.</p>
              </div>
            )}
          </div>
        )}
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
        <BarChart3 size={14} /> Informe de vocabulario
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3">
          {loading && <p className="py-2 text-center text-xs text-[#8b7aa0]">Calculando…</p>}
          {!loading && report && report.totalUtterances === 0 && (
            <p className="py-2 text-center text-xs text-[#8b7aa0]">Todavía no hay frases dichas con el comunicador para armar un informe.</p>
          )}
          {!loading && report && report.totalUtterances > 0 && (
            <>
              <p className="mb-2 text-xs text-[#8b7aa0]">Sobre {report.totalUtterances} frase{report.totalUtterances === 1 ? '' : 's'} dicha{report.totalUtterances === 1 ? '' : 's'}</p>
              {report.used.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-bold text-[#4a4a5a]">Palabras que más usa</p>
                  <div className="flex flex-wrap gap-1">
                    {report.used.slice(0, 15).map((u) => (
                      <span key={u.word} className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                        {u.word} ({u.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {report.neverUsed.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-bold text-[#4a4a5a]">Palabras del núcleo que todavía no usó</p>
                  <div className="flex flex-wrap gap-1">
                    {report.neverUsed.slice(0, 15).map((w) => (
                      <span key={w} className="rounded-full bg-[#ede4f8] px-2 py-0.5 text-[10px] text-[#8b7aa0]">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
