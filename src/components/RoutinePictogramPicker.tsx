import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { fetchPictograms, type Pictogram } from '@/data/api';
import VoiceSearchButton from '@/components/VoiceSearchButton';

// Buscador de pictogramas para elegir uno a mano en el formulario de paso de
// rutina. Copiado del patron de usePictogramSearch/PictogramSearchPanel en
// ActivityBuilder.tsx en vez de reusarlo directo: son componentes internos
// de ese archivo (no exportados) y esta pantalla no necesita drag-and-drop
// ni "cargar mas" — se simplifica en vez de acoplarse a un componente ajeno.
const RESULTS_LIMIT = 24;

export default function RoutinePictogramPicker({
  onSelect,
}: {
  onSelect: (picto: Pictogram) => void;
}) {
  const [search, setSearch] = useState('');
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setPictograms([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetchPictograms({ search: search.trim(), language: 'es', limit: RESULTS_LIMIT })
        .then((items) => { if (!cancelled) setPictograms(items); })
        .catch(() => { if (!cancelled) setPictograms([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [search]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7aa0]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pictograma para este paso..."
          className="w-full rounded-xl border border-[#ede4f8] bg-[#faf8ff] p-2 pl-8 pr-9 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"
        />
        <VoiceSearchButton onResult={setSearch} className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" />
      </div>
      {search.trim() && (
        <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto rounded-xl border border-[#ede4f8] bg-white p-2" aria-busy={loading}>
          {pictograms.map((picto) => (
            <button
              key={picto.id}
              type="button"
              onClick={() => onSelect(picto)}
              title={picto.name}
              className="rounded-lg border border-transparent p-1 hover:border-[#6b4c9a] hover:bg-[#faf8ff]"
            >
              {picto.imageUrl ? (
                <img src={picto.imageUrl} alt={picto.name} className="mx-auto h-10 w-10 object-contain" loading="lazy" />
              ) : (
                <span className="text-xl">{picto.emoji}</span>
              )}
            </button>
          ))}
          {!loading && pictograms.length === 0 && (
            <p className="col-span-4 py-2 text-center text-xs text-[#8b7aa0]">Sin resultados.</p>
          )}
        </div>
      )}
    </div>
  );
}
