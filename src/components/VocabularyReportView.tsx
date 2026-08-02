import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { fetchVocabularyReport, type VocabularyReport } from '@/data/usageApi';

// Unica responsabilidad: mostrar el informe de vocabulario (Sesion 19,
// item 42) para un usuario — que palabras del nucleo (Sesion 11) uso y
// cuales nunca uso, con boton para abrir/cerrar (no se pide hasta que se
// abre, es un dato que no hace falta en cada visita).
export default function VocabularyReportView({ targetUsuarioId }: { targetUsuarioId: string }) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<VocabularyReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || report) return;
    setLoading(true);
    fetchVocabularyReport(targetUsuarioId).then(setReport).finally(() => setLoading(false));
  }, [open, report, targetUsuarioId]);

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
