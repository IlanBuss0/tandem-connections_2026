import type { SharedSupportNote } from '@/data/api';
import { initials } from './collaborationHelpers';
import { isToday, itemTimeLabel } from './feedHelpers';

const ROLE_STYLE: Record<string, string> = {
  tutor: 'bg-[var(--evo-soft)] text-[var(--evo-primary-text)]',
  profesional: 'bg-[var(--evo-info-bg)] text-[var(--evo-info-text)]',
};

export default function FeedNoteItem({ note, onDelete }: { note: SharedSupportNote; onDelete?: (noteId: number) => void }) {
  const roleKey = (note.autor_rol || '').toLowerCase();
  const roleStyle = ROLE_STYLE[roleKey] || 'bg-[var(--evo-chip-bg)] text-[var(--evo-chip-text)]';

  return (
    <article className="rounded-[24px] border border-[var(--evo-border-1)] bg-white p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${roleStyle}`}>
          {initials(note.autor_nombre || 'Red de apoyo')}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-extrabold text-[var(--evo-text)]">{note.autor_nombre || 'Red de apoyo'}</span>
            {note.autor_rol && <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold capitalize ${roleStyle}`}>{note.autor_rol}</span>}
            {isToday(note.fecha_creacion) && <span className="rounded-full bg-[var(--evo-good-bg)] px-2.5 py-0.5 text-[11.5px] font-extrabold text-[var(--evo-good-text)]">Nuevo</span>}
          </div>
        </div>
        <time className="shrink-0 text-xs text-[var(--evo-text-secondary)]">{itemTimeLabel(note.fecha_creacion)}</time>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--evo-text)]">{note.contenido}</p>
      {onDelete && (
        <button type="button" onClick={() => onDelete(note.id)} className="mt-2 min-h-9 text-xs font-bold text-[var(--evo-text-secondary)] hover:text-[var(--evo-support-text)]">Eliminar</button>
      )}
    </article>
  );
}
