import { useState, type FormEvent } from 'react';
import { CheckCircle2, NotebookPen, Send, Target } from 'lucide-react';

type Mode = 'nota' | 'acuerdo' | 'objetivo';
const NOTE_CHIPS = ['Hoy funcionó…', 'Me preguntó…', 'Noté que…'];
const FIELD = 'w-full rounded-2xl border-2 border-[var(--evo-border-1)] text-sm text-[var(--evo-text)] placeholder:text-[var(--evo-text-secondary)] focus:border-[var(--evo-primary)] focus:outline-none';

export interface CollaborationComposerProps {
  onCreateSharedNote?: (content: string) => Promise<void>;
  onCreateAgreement?: (text: string) => Promise<void>;
  onCreateObjective?: (payload: { titulo: string; descripcion?: string }) => Promise<void>;
}

// Unica responsabilidad: el formulario de "que queres compartir" (Nota /
// Acuerdo / Objetivo). Reemplaza los 3 formularios sueltos que tenian estas
// secciones — el pedido de contenido en si sigue siendo el mismo
// onCreateSharedNote/onCreateAgreement/onCreateObjective de siempre.
export default function CollaborationComposer({ onCreateSharedNote, onCreateAgreement, onCreateObjective }: CollaborationComposerProps) {
  const modes: { id: Mode; label: string; icon: typeof NotebookPen }[] = [
    onCreateSharedNote && { id: 'nota' as const, label: 'Nota', icon: NotebookPen },
    onCreateAgreement && { id: 'acuerdo' as const, label: 'Acuerdo', icon: CheckCircle2 },
    onCreateObjective && { id: 'objetivo' as const, label: 'Objetivo', icon: Target },
  ].filter((m): m is { id: Mode; label: string; icon: typeof NotebookPen } => Boolean(m));

  const [mode, setMode] = useState<Mode>(modes[0]?.id ?? 'nota');
  const [note, setNote] = useState('');
  const [agreement, setAgreement] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  if (!modes.length) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      if (mode === 'nota' && onCreateSharedNote && note.trim()) { await onCreateSharedNote(note.trim()); setNote(''); }
      if (mode === 'acuerdo' && onCreateAgreement && agreement.trim()) { await onCreateAgreement(agreement.trim()); setAgreement(''); }
      if (mode === 'objetivo' && onCreateObjective && title.trim()) { await onCreateObjective({ titulo: title.trim(), descripcion: description.trim() || undefined }); setTitle(''); setDescription(''); }
    } finally {
      setSending(false);
    }
  };

  const empty = mode === 'nota' ? !note.trim() : mode === 'acuerdo' ? !agreement.trim() : !title.trim();
  const submitLabel = mode === 'nota' ? 'Compartir' : mode === 'acuerdo' ? 'Agregar acuerdo' : 'Agregar objetivo';

  return (
    <div className="rounded-[28px] border border-[var(--evo-border-1)] bg-white p-4 shadow-[0_12px_32px_rgba(111,76,166,.09),0_2px_6px_rgba(43,33,69,.05)]">
      <h2 className="text-[17px] font-extrabold text-[var(--evo-text)]">¿Qué querés compartir?</h2>

      {modes.length > 1 && (
        <div className="mt-3.5 flex gap-2">
          {modes.map(option => (
            <button
              key={option.id} type="button" aria-pressed={mode === option.id} onClick={() => setMode(option.id)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[14px] border-2 text-[13.5px] font-extrabold ${mode === option.id ? 'border-[var(--evo-primary)] bg-[var(--evo-soft)] text-[var(--evo-primary-text)]' : 'border-[var(--evo-border-1)] bg-white text-[var(--evo-text-inactive)]'}`}
            >
              <option.icon size={16} aria-hidden /> {option.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={event => void submit(event)} className="mt-3.5">
        {mode === 'nota' && (
          <>
            <textarea
              value={note} onChange={event => setNote(event.target.value)} maxLength={2000}
              placeholder="Compartí una observación útil para la red…" aria-label="Nueva nota"
              className={`min-h-[84px] resize-none p-3.5 ${FIELD}`}
            />
            <div className="mt-2.5 flex flex-wrap gap-2">
              {NOTE_CHIPS.map(chip => (
                <button
                  key={chip} type="button" onClick={() => setNote(current => current || `${chip} `)}
                  className="min-h-10 rounded-full border-2 border-[var(--evo-border-1)] px-3.5 text-[13.5px] font-bold text-[var(--evo-primary-text)]"
                >{chip}</button>
              ))}
            </div>
          </>
        )}

        {mode === 'acuerdo' && (
          <input
            value={agreement} onChange={event => setAgreement(event.target.value)} maxLength={500}
            placeholder="Nuevo acuerdo" aria-label="Nuevo acuerdo" className={`min-h-[52px] px-4 ${FIELD}`}
          />
        )}

        {mode === 'objetivo' && (
          <>
            <input
              value={title} onChange={event => setTitle(event.target.value)} maxLength={160}
              placeholder="Nuevo objetivo" aria-label="Nuevo objetivo" className={`mb-2.5 min-h-[52px] px-4 ${FIELD}`}
            />
            <textarea
              value={description} onChange={event => setDescription(event.target.value)}
              placeholder="Descripción (opcional)" aria-label="Descripción (opcional)" className={`min-h-16 resize-none p-3 ${FIELD}`}
            />
          </>
        )}

        <button
          type="submit" disabled={sending || empty}
          className="mt-3.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--evo-primary)] text-sm font-extrabold text-white disabled:opacity-50"
        >
          <Send size={16} aria-hidden /> {submitLabel}
        </button>
      </form>
    </div>
  );
}
