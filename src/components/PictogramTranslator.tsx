import { useState } from 'react';
import { Wand2, Loader2, FileDown } from 'lucide-react';
import { pictogramizePhrases, type PictogramizedPhrase, MAX_TRANSLATOR_PHRASES } from '@/data/api';
import { exportPictogramStripToPdf } from '@/lib/pictogramPdf';

// Unica responsabilidad: traductor manual de texto libre a pictogramas
// (Sesion 4). A diferencia del motor automatico de "Mi dia"/Calendario
// (Sesion 1), aca el usuario elige que traducir escribiendolo el mismo —
// para armar una historia social, un cartel imprimible, una secuencia para
// mostrarle a otra persona, etc. Reusa el mismo endpoint /pictogramize, asi
// que hereda gratis el vocabulario personal y la preferencia de estilo
// (Sesion 2).
//
// Sin match no muestra emoji inventado (aca no hay una categoria de la que
// derivar uno, como si hay en rutinas/calendario): se marca con un recuadro
// de solo texto, para que quede claro que esa frase no tiene apoyo visual
// todavia, en vez de mostrar algo que no corresponde.
export default function PictogramTranslator() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<PictogramizedPhrase[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const phrases = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const tooMany = phrases.length > MAX_TRANSLATOR_PHRASES;

  const translate = async () => {
    if (phrases.length === 0 || tooMany) return;
    setLoading(true);
    setError(null);
    try {
      const items = phrases.map((line, index) => ({ id: String(index), text: line }));
      const translated = await pictogramizePhrases(items);
      if (translated.length === 0 && phrases.length > 0) {
        setError('No se pudo traducir ahora. Probá de nuevo en un momento.');
      }
      setResults(translated);
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async () => {
    if (!results || results.length === 0) return;
    setExporting(true);
    try {
      await exportPictogramStripToPdf(results);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Escribí una frase por línea, por ejemplo:\nLavarse los dientes\nDesayunar\nIr a la escuela'}
          rows={5}
          className="w-full resize-none rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]"
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={tooMany ? 'font-semibold text-red-600' : 'text-[#b8b0c8]'}>
            {phrases.length} / {MAX_TRANSLATOR_PHRASES} frases
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={translate}
          disabled={phrases.length === 0 || tooMany || loading}
          className="flex items-center gap-2 rounded-full bg-[#6b4c9a] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          Traducir
        </button>

        {results && results.length > 0 && (
          <button
            type="button"
            onClick={exportPdf}
            disabled={exporting}
            className="flex items-center gap-2 rounded-full border border-[#6b4c9a] px-5 py-2.5 text-sm font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            Exportar PDF
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {results && results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {results.map((result) => (
            <div
              key={result.id}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center ${
                result.pictogram ? 'border-[#ede4f8] bg-white' : 'border-dashed border-[#d8c7ef] bg-[#faf8ff]'
              }`}
            >
              {result.pictogram ? (
                <img
                  src={result.pictogram.imageUrl}
                  alt={result.pictogram.name}
                  className="h-16 w-16 object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center text-[10px] text-[#b8b0c8]">
                  Sin apoyo visual
                </div>
              )}
              <p className="text-xs font-medium text-[#4a4a5a]">{result.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
