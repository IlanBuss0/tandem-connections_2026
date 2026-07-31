import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Heart } from 'lucide-react';
import { fetchPictogramAttributions, type PictogramAttribution } from '@/data/api';

// Pantalla "Acerca de", visible para los 3 tipos de usuario (perteneciente,
// tutor/responsable, profesional). Combina info de Tandem con la atribucion
// legal que exige la licencia CC BY-SA de los pictogramas (Mulberry, OpenMoji):
// hay que dar credito al autor, la licencia y avisar que las imagenes se
// convirtieron de SVG a PNG. La lista se arma DINAMICAMENTE desde lo que el
// backend reporta que esta mostrando ahora mismo (GET /api/pictograms/attributions),
// para que nunca quede desactualizada respecto de lo realmente importado.
const SOURCE_LABELS: Record<string, string> = {
  MULBERRY: 'Mulberry Symbols',
  OPENMOJI: 'OpenMoji',
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

export default function AboutTandem() {
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
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <section className="rounded-3xl border border-[#f0e8f8] bg-white p-5 shadow-sm">
        <h1 className="text-xl font-extrabold text-[#6b4c9a]">TÁNDEM</h1>
        <p className="mt-1 text-sm font-semibold text-[#8b7aa0]">Avanzamos juntos</p>
        <p className="mt-3 text-sm leading-relaxed text-[#4a4a5a]">
          Tándem es una plataforma pensada para dar más autonomía en la comunicación y la vida diaria a adolescentes
          y adultos con TEA, junto a su red de apoyo (familia, tutores y profesionales).
        </p>
        <p className="mt-3 inline-flex items-center gap-1 text-xs text-[#8b7aa0]">
          Hecho con <Heart size={12} className="fill-current text-[#e07a9b]" /> para acompañar, no para infantilizar.
        </p>
      </section>

      <section className="rounded-3xl border border-[#f0e8f8] bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#4a4a5a]">Licencias y atribuciones</h2>
        <p className="mt-2 text-sm text-[#8b7aa0]">
          Los pictogramas e íconos de Tándem vienen de distintas colecciones de terceros, cada una con su propia
          licencia. Algunos exigen que se los atribuya a su autor — acá está el detalle. El uso de estos recursos no
          implica que sus autores u organizaciones patrocinen, avalen o estén asociados con Tándem.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-[#fff4e5] px-3 py-2 text-sm text-[#8a5a00]">{error}</p>
        )}

        {!attributions && !error && (
          <div className="flex items-center justify-center gap-2 py-8 text-[#8b7aa0]">
            <Loader2 className="animate-spin" size={20} />
            Cargando licencias...
          </div>
        )}

        <div className="mt-4 space-y-4">
          {grouped.map(([source, items]) => (
            <div key={source} className="rounded-2xl bg-[#faf8ff] p-4">
              <h3 className="mb-3 text-sm font-bold text-[#4a4a5a]">{SOURCE_LABELS[source] || source}</h3>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={`${item.licenseCode}-${index}`} className="rounded-xl border border-[#ede4f8] bg-white p-3">
                    {item.attributionText && (
                      <p className="text-sm text-[#4a4a5a]">{item.attributionText}</p>
                    )}
                    <p className="mt-1 text-xs text-[#8b7aa0]">
                      Las imágenes originales se convirtieron de SVG a PNG para mostrarlas en la app.
                    </p>
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
