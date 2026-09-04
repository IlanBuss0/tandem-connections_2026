import { useEffect, useMemo, useState } from 'react';
import { Volume2, X, Search, History } from 'lucide-react';
import { fetchNucleoVocabulario, type NucleoVocabulario, type NucleoWord } from '@/data/communicationApi';
import { fetchPictograms, type Pictogram } from '@/data/api';
import { logUsageEvent, fetchUsageEvents, fetchVocabularyReport, type UsageEventRecord, type VocabularyReport } from '@/data/usageApi';
import { sortWordsByUsage } from '@/lib/nucleoWordOrder';
import { useAuth } from '@/contexts/AuthContext';
import { speakText } from '@/lib/speech';
import { utteranceToText, type UtteranceToken } from '@/lib/utterance';
import PictogramTile from '@/components/PictogramTile';
import PictogramGrid from '@/components/PictogramGrid';

// Unica responsabilidad: el constructor de frases del comunicador (Sesion
// 11, items 36 y 37 — el 39 "frases frecuentes" queda como una lista chica
// de las ultimas frases dichas, guardada en localStorage: no hace falta
// backend para esto todavia, y evita construir infra de mas antes de saber
// si se usa).
//
// El vocabulario nucleo (item 37) se pide una sola vez al montar (esta
// cacheado server-side, Sesion 11). La busqueda libre reusa fetchPictograms
// del catalogo entero, para palabras que no estan en el nucleo.
const CATEGORY_LABELS: Record<string, string> = {
  pronombres: 'Pronombres',
  verbos_nucleo: 'Verbos',
  cantidad_estado: 'Cantidad',
  si_no_preguntas: 'Sí / No / Preguntas',
  descriptores: 'Descriptores',
  lugar: 'Lugar',
  conectores: 'Conectores',
  social: 'Social',
  personas_lugares: 'Personas y lugares',
  emociones_basicas: 'Emociones',
};

const FREQUENT_KEY = 'tandem:comunicador:frecuentes';
const MAX_FREQUENT = 8;

function loadFrequent(): string[] {
  try {
    const raw = localStorage.getItem(FREQUENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFrequent(phrase: string) {
  try {
    const current = loadFrequent().filter((p) => p !== phrase);
    const next = [phrase, ...current].slice(0, MAX_FREQUENT);
    localStorage.setItem(FREQUENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage puede fallar (modo privado, cuota) — las frases
    // frecuentes son un extra, no algo critico
  }
}

export default function UserCommunicator() {
  const { user } = useAuth();
  const [nucleo, setNucleo] = useState<NucleoVocabulario>({});
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<UtteranceToken[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Pictogram[]>([]);
  const [frequent, setFrequent] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<UsageEventRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [vocabularyReport, setVocabularyReport] = useState<VocabularyReport | null>(null);

  useEffect(() => {
    fetchNucleoVocabulario().then(setNucleo).finally(() => setLoading(false));
    setFrequent(loadFrequent());
  }, []);

  // Sesion 25 (perfil de memoria), arreglo de consistencia: el nucleo que
  // llega de fetchNucleoVocabulario esta cacheado COMPARTIDO entre todos
  // los usuarios (Sesion 11) — la personalizacion se aplica aca, del lado
  // del cliente, sobre la copia ya traida, nunca adentro del cache.
  useEffect(() => {
    if (!user?.id) return;
    fetchVocabularyReport(user.id).then(setVocabularyReport);
  }, [user?.id]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchPictograms({ search: search.trim(), language: 'es', limit: 12 })
        .then((results) => { if (!cancelled) setSearchResults(results); })
        .catch(() => { if (!cancelled) setSearchResults([]); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [search]);

  const currentText = useMemo(() => utteranceToText(tokens), [tokens]);

  const addWord = (word: NucleoWord) => {
    setTokens((prev) => [...prev, { type: 'pictogram', pictogramId: word.pictogram?.id, text: word.word }]);
  };

  const addPictogram = (picto: Pictogram) => {
    setTokens((prev) => [...prev, { type: 'pictogram', pictogramId: picto.id, text: picto.name }]);
  };

  const removeLast = () => setTokens((prev) => prev.slice(0, -1));
  const clearAll = () => setTokens([]);

  const speak = () => {
    if (!currentText) return;
    speakText(currentText);
    saveFrequent(currentText);
    setFrequent(loadFrequent());
    void logUsageEvent({ tipoEvento: 'enunciado_hablado', entidadTipo: 'enunciado', valor: { text: currentText, tokenCount: tokens.length } });
  };

  const speakFrequent = (phrase: string) => {
    speakText(phrase);
    saveFrequent(phrase);
    setFrequent(loadFrequent());
  };

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && user?.id && history.length === 0) {
      setHistoryLoading(true);
      fetchUsageEvents(user.id, { tipoEvento: 'enunciado_hablado', limit: 30 })
        .then(setHistory)
        .finally(() => setHistoryLoading(false));
    }
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold text-[#6b4c9a] sm:text-4xl">Comunicador</h2>
          <p className="mt-1 text-sm font-medium text-[#8b7aa0] sm:text-base">Armá una frase tocando pictogramas</p>
        </div>
        <button
          type="button"
          onClick={toggleHistory}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${showHistory ? 'border-transparent bg-[#6b4c9a] text-white' : 'border-[#ede4f8] text-[#6b4c9a] hover:bg-[#f5f0ff]'}`}
        >
          <History size={14} /> Historial
        </button>
      </div>

      {showHistory && (
        <div className="space-y-1.5 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3">
          {historyLoading && <p className="py-2 text-center text-xs text-[#8b7aa0]">Cargando…</p>}
          {!historyLoading && history.length === 0 && <p className="py-2 text-center text-xs text-[#8b7aa0]">Todavía no dijiste nada con el comunicador.</p>}
          {history.map((event) => {
            const text = (event.valor?.text as string) || '';
            return (
              <div key={event.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
                <span className="truncate text-sm text-[#4a4a5a]">{text}</span>
                <button type="button" onClick={() => speakText(text)} className="shrink-0 text-[#6b4c9a] hover:text-[#5a3c8a]"><Volume2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}

      {/* Frase actual */}
      <div className="rounded-2xl border-2 border-[#6b4c9a]/30 bg-[#faf8ff] p-3">
        <div className="flex min-h-[3rem] flex-wrap items-center gap-2">
          {tokens.length === 0 && <span className="text-sm text-[#b8b0c8]">Tocá un pictograma para empezar…</span>}
          {tokens.map((token, index) => (
            <span key={index} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#6b4c9a] shadow-sm">
              {token.text}
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={speak}
            disabled={tokens.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#6b4c9a] py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Volume2 size={16} /> Hablar
          </button>
          <button type="button" onClick={removeLast} disabled={tokens.length === 0} className="rounded-full border border-[#ede4f8] px-4 text-sm font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff] disabled:opacity-40">
            Borrar última
          </button>
          <button type="button" onClick={clearAll} disabled={tokens.length === 0} className="rounded-full border border-[#ede4f8] px-3 text-[#8b7aa0] hover:bg-[#f5f0ff] disabled:opacity-40">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Frases frecuentes (item 39) */}
      {frequent.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#4a4a5a]">Frases frecuentes</h3>
          <div className="flex flex-wrap gap-1.5">
            {frequent.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => speakFrequent(phrase)}
                className="rounded-full border border-[#ede4f8] bg-white px-3 py-1.5 text-xs font-medium text-[#6b4c9a] hover:border-[#6b4c9a]/40 hover:bg-[#f5f0ff]"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Busqueda libre, para palabras fuera del nucleo */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7aa0]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar otra palabra…"
          className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 pl-9 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]"
        />
      </div>
      {searchResults.length > 0 && (
        <PictogramGrid label="Resultados de búsqueda">
          {searchResults.map((picto) => (
            <PictogramTile key={picto.id} imageUrl={picto.imageUrl} name={picto.name} fallback={picto.emoji || '❓'} label={picto.name} onClick={() => addPictogram(picto)} />
          ))}
        </PictogramGrid>
      )}

      {/* Vocabulario nucleo */}
      {loading ? (
        <p className="py-8 text-center text-sm text-[#8b7aa0]">Cargando vocabulario…</p>
      ) : (
        Object.entries(nucleo).map(([category, words]) => (
          <div key={category}>
            <h3 className="mb-2 text-sm font-bold text-[#4a4a5a]">{CATEGORY_LABELS[category] || category}</h3>
            <PictogramGrid label={CATEGORY_LABELS[category] || category}>
              {sortWordsByUsage(words, vocabularyReport).map((word) => (
                <PictogramTile
                  key={word.word}
                  imageUrl={word.pictogram?.imageUrl}
                  name={word.pictogram?.name}
                  fallback="❓"
                  label={word.word}
                  onClick={() => addWord(word)}
                />
              ))}
            </PictogramGrid>
          </div>
        ))
      )}
    </div>
  );
}
