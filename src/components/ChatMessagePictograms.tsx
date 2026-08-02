import { useState } from 'react';
import { pictogramizePhrases, type PictogramizedPhrase } from '@/data/api';
import { splitIntoPhrases } from '@/lib/sentenceSplit';

// Unica responsabilidad: un toggle por mensaje de chat que, al tocarlo,
// traduce el texto del mensaje a pictogramas (Sesion 7, item 9). Solo se
// usa en mensajes ENTRANTES de texto — el que escribe ya sabe lo que
// escribio, es quien lo recibe quien puede necesitar el apoyo visual.
//
// A pedido: no se resuelve solo al cargar el chat (seria pictogramizar
// TODO el historial sin que nadie lo pida). Se resuelve on-demand al
// tocar el boton, y una vez resuelto queda en memoria para no volver a
// pedirlo si se cierra y abre el desplegable — el memo global en BD
// (Sesion 6) protege ademas contra gastar Groq de nuevo entre mensajes
// repetidos o entre chats distintos.
export default function ChatMessagePictograms({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PictogramizedPhrase[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (results) return;

    setLoading(true);
    try {
      const phrases = splitIntoPhrases(text).map((t, i) => ({ id: String(i), text: t }));
      const translated = await pictogramizePhrases(phrases);
      setResults(translated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={toggle}
        className="text-[10px] font-bold underline-offset-2 opacity-80 hover:underline"
      >
        {open ? 'Ocultar pictogramas' : 'Ver en pictogramas'}
      </button>
      {open && (
        loading ? (
          <p className="mt-1 text-[10px] opacity-70">Traduciendo…</p>
        ) : results && results.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {results.map((r) => (
              <div key={r.id} className="flex w-14 flex-col items-center gap-0.5 rounded-lg bg-white/60 p-1.5 text-center">
                {r.pictogram ? (
                  <img src={r.pictogram.imageUrl} alt={r.pictogram.name} className="h-9 w-9 object-contain" loading="lazy" />
                ) : (
                  <span className="text-[8px] opacity-60">Sin apoyo</span>
                )}
                <span className="text-[8px] leading-tight">{r.text}</span>
              </div>
            ))}
          </div>
        ) : null
      )}
    </div>
  );
}
