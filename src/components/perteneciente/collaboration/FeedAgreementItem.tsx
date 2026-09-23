import type { SharedSupportAgreement } from '@/data/api';
import { relativeDays } from './collaborationHelpers';

export default function FeedAgreementItem({ agreement, creatorName, disabled, onToggle }: {
  agreement: SharedSupportAgreement; creatorName?: string; disabled: boolean; onToggle: () => void;
}) {
  const meta = creatorName ? `Lo creó ${creatorName} · ${relativeDays(agreement.fecha_creacion)}` : relativeDays(agreement.fecha_creacion);

  return (
    <label className="flex items-start gap-3 rounded-[24px] border border-[var(--evo-border-1)] bg-white p-4">
      <input
        type="checkbox" checked={agreement.completado} disabled={disabled} onChange={onToggle}
        aria-label={agreement.texto} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--evo-primary)]"
      />
      <span className="flex flex-col gap-0.5">
        <span className={`text-sm font-semibold leading-[1.3] text-[var(--evo-text)] ${agreement.completado ? 'text-[var(--evo-text-secondary)] line-through' : ''}`}>{agreement.texto}</span>
        <span className="text-xs text-[var(--evo-text-secondary)]">{meta}</span>
      </span>
    </label>
  );
}
