import { ChevronRight, Loader2, Shield, Trash2 } from 'lucide-react';
import PersonAvatar from './PersonAvatar';
import SurfaceCard from './SurfaceCard';

type Props = { name: string; isPrincipal: boolean; deleting: boolean; onOpenDetail?: () => void; onDelete: () => void };

export default function SelectedPersonCard({ name, isPrincipal, deleting, onOpenDetail, onDelete }: Props) {
  return (
    <SurfaceCard>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <PersonAvatar name={name} className="h-12 w-12 bg-[var(--evo-soft)] text-base text-[var(--evo-primary-text)]" />
          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[var(--evo-mood-line)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-[17px] font-extrabold text-[var(--evo-text)]">{name}</p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--evo-soft)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--evo-primary-text)]">
            <Shield size={13} aria-hidden />
            {isPrincipal ? 'Tutor principal' : 'Tutor activo'}
          </span>
        </div>
        {onOpenDetail && (
          <button
            type="button"
            onClick={onOpenDetail}
            aria-label={`Ver información de ${name}`}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-[var(--evo-primary)] px-3.5 text-xs font-extrabold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)] focus-visible:ring-offset-2"
          >
            Ver info
            <ChevronRight size={13} aria-hidden />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="mt-3.5 flex min-h-11 w-full items-center gap-2 border-t border-[var(--evo-border-3)] pt-3 text-left text-[12.5px] font-bold text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:opacity-50"
      >
        {deleting ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Trash2 size={15} aria-hidden />}
        Eliminar vínculo con {name}
      </button>
    </SurfaceCard>
  );
}
