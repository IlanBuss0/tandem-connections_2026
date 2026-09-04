import { useState } from 'react';
import { BookOpen, Volume2, X, HelpCircle } from 'lucide-react';
import type { CalendarEvent } from '@/data/api';
import { pictogramizePhrases, type PictogramizedPhrase } from '@/data/api';
import { buildSocialStoryPhrases } from '@/lib/socialStory';
import { speakText } from '@/lib/speech';
import { logUsageEvent } from '@/data/usageApi';

// Unica responsabilidad: mostrar la historia social de un evento (Sesion
// 15, item 17) — se genera on-demand al abrirla, no hay un cron 3 dias
// antes (no hay infra de push notifications todavia para avisar que esta
// lista). El valor real de "3 dias antes" es que la persona la tenga
// disponible YA, sin que nadie tenga que armarla a mano; cuando la abra
// (hoy o dentro de 3 dias) va a estar ahi.
export default function SocialStoryView({ event }: { event: CalendarEvent }) {
  const [open, setOpen] = useState(false);
  const [phrases, setPhrases] = useState<PictogramizedPhrase[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const openStory = async () => {
    setOpen(true);
    if (phrases) return;
    setLoading(true);
    try {
      const sentences = buildSocialStoryPhrases(event, new Date());
      const items = sentences.map((text, index) => ({ id: String(index), text }));
      const results = await pictogramizePhrases(items);
      setPhrases(results);
      void logUsageEvent({ tipoEvento: 'pictograma_elegido', entidadTipo: 'historia_social', entidadId: event.id, valor: { eventTitle: event.title } });
    } finally {
      setLoading(false);
    }
  };

  const speakAll = () => {
    if (!phrases) return;
    speakText(phrases.map((p) => p.text).join('. '));
  };

  return (
    <>
      <button
        type="button"
        onClick={openStory}
        className="flex items-center gap-1 rounded-full border border-[#6b4c9a]/30 px-2.5 py-1 text-xs font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff]"
      >
        <BookOpen size={12} /> Pictograma
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white">
          <div className="flex items-center border-b border-[#ede4f8] p-4">
            <h2 className="flex-1 text-center text-2xl font-extrabold leading-tight text-[#6b4c9a]">{event.title}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="shrink-0 rounded-full p-2 text-[#8b7aa0] hover:bg-[#f5f0ff]">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading && <p className="py-8 text-center text-sm text-[#8b7aa0]">Armando la historia…</p>}
            {!loading && phrases && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {phrases.map((p) => (
                  <div key={p.id} className="flex flex-col items-center gap-2.5 rounded-2xl border border-[#e5d9f3] bg-[#fbf7ff] p-3 shadow-sm">
                    {p.pictogram ? (
                      <img src={p.pictogram.imageUrl} alt={p.pictogram.name} className="aspect-square w-full object-contain" loading="lazy" />
                    ) : (
                      <div className="aspect-square w-full" />
                    )}
                    <p className="text-center text-sm font-medium leading-snug text-[#4a4a5a]">{p.text}</p>
                  </div>
                ))}
              </div>
            )}
            {/* item 25 "ensayo previo": practicar la situacion con una
                opcion concreta, reusando el plan B (Sesion 16) si existe —
                no se inventa una pregunta generica sin una respuesta real
                detras. */}
            {!loading && event.planB?.trim() && (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-[#d8c7ef] bg-[#faf8ff] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-[#6b4c9a]">
                  <HelpCircle size={16} /> ¿Qué hacés si algo sale distinto a lo planeado?
                </p>
                {!showAnswer ? (
                  <button
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    className="mt-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#6b4c9a] shadow-sm hover:bg-[#f5f0ff]"
                  >
                    Pensé mi respuesta, mostrame la idea
                  </button>
                ) : (
                  <p className="mt-2 rounded-xl bg-white p-3 text-sm text-[#4a4a5a]">{event.planB}</p>
                )}
              </div>
            )}
          </div>
          {!loading && phrases && (
            <div className="border-t border-[#ede4f8] p-4">
              <button
                type="button"
                onClick={speakAll}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#6b4c9a] py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a]"
              >
                <Volume2 size={16} /> Escuchar toda la historia
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
