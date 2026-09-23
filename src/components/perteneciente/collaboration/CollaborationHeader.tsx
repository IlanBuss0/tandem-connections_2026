import { Users } from 'lucide-react';
import type { SupportNetworkMember } from '@/data/api';
import { initials, peopleLabel } from './collaborationHelpers';

const AVATAR_STYLE: Record<SupportNetworkMember['rol'], string> = {
  tutor: 'bg-[var(--evo-soft)] text-[var(--evo-primary-text)]',
  profesional: 'bg-[var(--evo-info-bg)] text-[var(--evo-info-text)]',
};

export default function CollaborationHeader({ members }: { members: SupportNetworkMember[] }) {
  return (
    <div>
      <div className="flex items-center gap-3.5">
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[20px] bg-[var(--evo-primary)] text-white">
          <Users size={26} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--evo-primary)]">Colaboración</p>
          <h1 className="mt-1 min-h-8 font-heading text-2xl font-extrabold leading-[1.15] text-[var(--evo-text)]">Acompañamos juntos</h1>
        </div>
      </div>
      {members.length > 0 && (
        <div className="mb-3 mt-2 flex items-center gap-3">
          <div className="flex">
            {members.map((member, index) => (
              <span
                key={member.id_usuario}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white text-[13px] font-extrabold ${index > 0 ? '-ml-2.5' : ''} ${AVATAR_STYLE[member.rol]}`}
              >
                {initials(member.nombre)}
              </span>
            ))}
          </div>
          <p className="min-w-0 text-[13.5px] leading-[1.35] text-[var(--evo-text-secondary)]">{peopleLabel(members)}</p>
        </div>
      )}
    </div>
  );
}
