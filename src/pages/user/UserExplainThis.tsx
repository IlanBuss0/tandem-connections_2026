import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { apiRequest } from '@/services/api/client';
import type { PictogramizedPhrase } from '@/data/api';
import SpeakButton from '@/components/SpeakButton';

// Unica responsabilidad: "explicame esto" (Sesion 18, item 15) — pegar un
// texto (un mensaje, un parrafo que no se entiende) y que vuelva
// simplificado en lectura facil, con pictograma de apoyo por oracion.
// Distinto del traductor manual (Sesion 4): el traductor pictogramiza el
// texto TAL CUAL esta escrito; esto primero lo REESCRIBE mas simple.
interface ExplainResponse {
  results: PictogramizedPhrase[];
  engine: { lecturaFacilDegraded?: boolean };
}

export default function UserExplainThis() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<PictogramizedPhrase[] | null>(null);
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await apiRequest<ExplainResponse>('/api/pictograms/explicame', {
        method: 'POST',
        body: { text: text.trim() },
      });
      setResults(response.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      <div>
        <h2 className="text-3xl font-bold text-[#6b4c9a] sm:text-4xl">Explicame esto</h2>
        <p className="mt-1 text-sm font-medium text-[#8b7aa0] sm:text-base">Pegá un texto y te lo explico más fácil</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Pegá acá un mensaje o un texto que no entendiste bien…"
        rows={5}
        className="w-full resize-none rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]"
      />

      <button
        type="button"
        onClick={explain}
        disabled={!text.trim() || loading}
        className="flex items-center gap-2 rounded-full bg-[#6b4c9a] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        Explicame
      </button>

      {results && results.length === 0 && (
        <p className="text-sm text-red-600">No se pudo explicar ahora. Probá de nuevo.</p>
      )}

      {results && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-[#ede4f8] bg-white p-3">
              {r.pictogram ? (
                <img src={r.pictogram.imageUrl} alt={r.pictogram.name} className="h-12 w-12 shrink-0 object-contain" loading="lazy" />
              ) : (
                <div className="h-12 w-12 shrink-0" />
              )}
              <p className="flex-1 text-sm font-medium text-[#4a4a5a]">{r.text}</p>
              <SpeakButton text={r.text} size={14} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
