import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchPictogramAttributions, type PictogramAttribution } from '@/data/api';

// Migracion de pictogramas a librerias con licencia comercial: las
// colecciones CC BY-SA (Mulberry, PiCom, OpenMoji, etc.) exigen atribucion
// visible. Esta pantalla se arma DINAMICAMENTE desde lo que el backend
// reporta que esta mostrando ahora mismo, para que nunca quede
// desactualizada respecto de lo realmente importado (ver
// GET /api/pictograms/attributions, PictogramaRepository.getAttributionsAsync).
const SOURCE_LABELS: Record<string, string> = {
  ARASAAC: 'ARASAAC',
  GLOBAL_SYMBOLS: 'Global Symbols',
  TANDEM_AI: 'Tándem (generados con IA)',
  TABLER: 'Tabler Icons',
};

function groupBySource(attributions: PictogramAttribution[]) {
  const groups = new Map<string, PictogramAttribution[]>();
  for (const item of attributions) {
    const list = groups.get(item.source) || [];
    list.push(item);
    groups.set(item.source, list);
  }
  return Array.from(groups.entries());
}

export default function LicensesAndAttributions({ onBack }: { onBack: () => void }) {
  const [attributions, setAttributions] = useState<PictogramAttribution[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPictogramAttributions()
      .then(data => { if (!cancelled) setAttributions(data); })
      .catch(() => { if (!cancelled) setError('No se pudieron cargar las licencias.'); });
    return () => { cancelled = true; };
  }, []);

  const grouped = attributions ? groupBySource(attributions) : [];

  return (
    <main className="min-h-screen bg-[#F8FAFB] px-4 py-6 text-[#4a4a5a]">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-extrabold text-[#6b4c9a]">Licencias y atribuciones</h1>
        </div>

        <p className="mb-6 text-sm text-[#8b7aa0]">
          Los pictogramas e íconos de Tándem vienen de distintas colecciones de terceros, cada una con su propia
          licencia. Algunos exigen que se los atribuya a su autor — acá está el detalle. El uso de estos recursos no
          implica que sus autores u organizaciones patrocinen, avalen o estén asociados con Tándem.
        </p>

        {error && (
          <p className="mb-4 rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#8a5a00]">{error}</p>
        )}

        {!attributions && !error && (
          <div className="flex items-center justify-center gap-2 py-10 text-[#8b7aa0]">
            <Loader2 className="animate-spin" size={20} />
            Cargando licencias...
          </div>
        )}

        <div className="space-y-4">
          {grouped.map(([source, items]) => (
            <section key={source} className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-[#4a4a5a]">{SOURCE_LABELS[source] || source}</h2>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={`${item.licenseCode}-${index}`} className="rounded-xl border border-[#ede4f8] bg-[#faf8ff] p-3">
                    {item.attributionText && (
                      <p className="text-sm text-[#4a4a5a]">{item.attributionText}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8b7aa0]">
                      {item.licenseCode && <span>Licencia: {item.licenseCode}</span>}
                      <span>{item.total} pictograma{item.total === 1 ? '' : 's'}</span>
                      {item.licenseUrl && (
                        <a
                          href={item.licenseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#6b4c9a] hover:underline"
                        >
                          Ver licencia <ExternalLink size={12} />
                        </a>
                      )}
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#6b4c9a] hover:underline"
                        >
                          Sitio del autor <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
