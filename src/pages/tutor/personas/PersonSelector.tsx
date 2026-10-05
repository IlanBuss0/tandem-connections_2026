import { cn } from '@/lib/utils';
import PersonAvatar from './PersonAvatar';

export type PersonOption = { id: number; name: string };

type Props = {
  people: PersonOption[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  label?: string;
  /** Si se pasa, se agrega un chip «Ver más» que lo dispara. */
  onMore?: () => void;
};

export default function PersonSelector({ people, selectedId, onSelect, label = 'Elegí a quién gestionarle los permisos', onMore }: Props) {
  if (people.length <= 1) return null;

  return (
    <div>
      <p className="mb-2.5 px-1 text-[12.5px] text-[var(--evo-text-secondary)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {people.map(person => {
          const active = person.id === selectedId;
          return (
            <button
              key={person.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(person.id)}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-full border-2 py-1.5 pl-1.5 pr-3.5 text-[13px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)] focus-visible:ring-offset-2',
                active ? 'border-[var(--evo-primary)] bg-[var(--evo-primary)] text-white' : 'border-[var(--evo-border-1)] bg-white text-[var(--evo-text)]',
              )}
            >
              <PersonAvatar
                name={person.name}
                className={cn('h-[26px] w-[26px] text-[11px]', active ? 'bg-white/30 text-white' : 'bg-[var(--evo-soft)] text-[var(--evo-primary-text)]')}
              />
              {person.name}
            </button>
          );
        })}
        {onMore && (
          <button
            type="button"
            onClick={onMore}
            className="inline-flex min-h-11 items-center rounded-full border-2 border-[var(--evo-border-1)] bg-white px-3.5 text-[13px] font-extrabold text-[var(--evo-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)] focus-visible:ring-offset-2"
          >
            Ver más
          </button>
        )}
      </div>
    </div>
  );
}
