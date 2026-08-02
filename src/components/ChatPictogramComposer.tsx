import { useEffect, useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { fetchNucleoVocabulario, type NucleoVocabulario } from '@/data/communicationApi';

// Unica responsabilidad: un panel chico para armar el mensaje de chat con
// pictogramas en vez de escribiendo (Sesion 12, item 28). Reusa el mismo
// vocabulario nucleo del comunicador (Sesion 11) — no vuelve a definir una
// lista de palabras aparte.
//
// A proposito no arma un enunciado con imagenes propio: cada palabra
// tocada se agrega como TEXTO al draft del chat, que es lo que ya sabe
// mandar `sendNow`. Mas simple, y el mensaje sigue siendo texto plano
// compatible con todo lo que ya lee `contenido` en el chat.
export default function ChatPictogramComposer({ onAppend }: { onAppend: (word: string) => void }) {
  const [open, setOpen] = useState(false);
  const [nucleo, setNucleo] = useState<NucleoVocabulario>({});

  useEffect(() => {
    if (open && Object.keys(nucleo).length === 0) {
      fetchNucleoVocabulario().then(setNucleo);
    }
  }, [open, nucleo]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Responder con pictogramas"
        title="Responder con pictogramas"
      >
        <ImageIcon size={15} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-2 max-h-64 w-72 overflow-y-auto rounded-2xl border border-[#ede4f8] bg-white p-2 shadow-lg">
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[#6b4c9a]">Tocá para agregar al mensaje</span>
            <button type="button" onClick={() => setOpen(false)} className="text-[#8b7aa0] hover:text-[#6b4c9a]"><X size={14} /></button>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.values(nucleo).flat().map((entry) => (
              <button
                key={entry.word}
                type="button"
                onClick={() => onAppend(entry.word)}
                className="flex items-center gap-1 rounded-full border border-[#ede4f8] bg-[#faf8ff] px-2 py-1 text-xs text-[#6b4c9a] hover:border-[#6b4c9a]/40"
              >
                {entry.pictogram?.imageUrl && <img src={entry.pictogram.imageUrl} alt="" className="h-4 w-4 object-contain" loading="lazy" />}
                {entry.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
