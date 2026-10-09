import { MoreHorizontal, FileText, Loader2 } from 'lucide-react';
import type { PersonalNote } from '@/data/api';

type PersonalNotesListProps = {
  notes: PersonalNote[];
  loading?: boolean;
  deletingId?: string | null;
  onDelete?: (id: string) => void;
  emptyText?: string;
};

function formatNoteDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PersonalNotesList({
  notes,
  loading = false,
  deletingId,
  onDelete,
  emptyText = 'Todavía no hay notas guardadas.',
}: PersonalNotesListProps) {
  if (loading && notes.length === 0) {
    return <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Cargando notas...</div>;
  }

  if (notes.length === 0) {
    return <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground">{emptyText}</div>;
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <article key={note.id} className="flex gap-3 rounded-2xl border border-[#f0e8f8] bg-white p-4 shadow-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#6b4c9a]"><FileText size={17} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[#4a4a5a]">{note.title || 'Nota personal'}</h4>
              <time className="text-[11px] text-[#a99cc0]" dateTime={note.createdAt}>{formatNoteDate(note.createdAt)}</time>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-[#6d6678]">{note.content}</p>
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              disabled={deletingId === note.id}
              aria-label="Eliminar nota"
              className="mt-1 h-7 w-7 shrink-0 rounded-lg text-[#b8b0c8] hover:bg-[#f5f0ff] hover:text-[#6b4c9a] disabled:opacity-60"
            >
              {deletingId === note.id ? <Loader2 size={15} className="mx-auto animate-spin" /> : <MoreHorizontal size={15} className="mx-auto" />}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}