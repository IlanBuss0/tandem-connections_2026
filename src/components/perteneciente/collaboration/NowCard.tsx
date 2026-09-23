import { CalendarDays } from 'lucide-react';
import type { ProfessionalSession, SharedSupportAgreement, SharedSupportObjective, SupportNetworkMember } from '@/data/api';
import Donut from '../evolution/charts/Donut';
import { pendingAgreements, sessionLabel, staleObjective } from './collaborationHelpers';
import { useAsyncAction } from './useAsyncAction';
import AgreementRow from './AgreementRow';
import ObjectiveRow from './ObjectiveRow';

export interface NowCardProps {
  sharedAgreements: SharedSupportAgreement[];
  activeObjectives: SharedSupportObjective[];
  nextSession?: ProfessionalSession;
  supportNetwork: SupportNetworkMember[];
  onToggleAgreement?: (agreementId: number, completed: boolean) => Promise<void>;
  onUpdateObjective?: (objectiveId: number, payload: { progreso?: number; estado?: 'activo' | 'pausado' | 'completado' }) => Promise<void>;
}

const ROW_DIVIDER = 'border-t border-[var(--evo-divider)]';

export default function NowCard({ sharedAgreements, activeObjectives, nextSession, supportNetwork, onToggleAgreement, onUpdateObjective }: NowCardProps) {
  const { pendingId, error, run: runAction } = useAsyncAction();

  const pending = pendingAgreements(sharedAgreements);
  const completed = sharedAgreements.length - pending.length;
  const stale = staleObjective(activeObjectives);
  const session = nextSession ? sessionLabel(nextSession) : null;
  const isEmpty = pending.length === 0 && !stale && !session;

  return (
    <div className="rounded-[28px] border border-[rgba(217,213,247,.7)] bg-white px-4 py-3.5 shadow-[0_12px_32px_rgba(111,76,166,.09),0_2px_6px_rgba(43,33,69,.05)]">
      <div className="mb-1.5 flex items-center gap-3">
        {sharedAgreements.length > 0 && (
          <Donut
            percent={(completed / sharedAgreements.length) * 100}
            centerLabel={`${completed}/${sharedAgreements.length}`}
            label={`${completed} de ${sharedAgreements.length} acuerdos cumplidos`}
            size={48} stroke={7} radius={15} color="var(--evo-primary)" labelSize={14}
          />
        )}
        <div className="min-w-0">
          <h2 className="font-heading text-[22px] font-extrabold leading-[1.1] text-[var(--evo-text)]">Ahora</h2>
          {sharedAgreements.length > 0 && (
            <p className="mt-1 text-[13.5px] text-[var(--evo-text-secondary)]">{completed} de {sharedAgreements.length} acuerdos cumplidos</p>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className={`${ROW_DIVIDER} pt-3`}>
          <p className="text-sm font-bold text-[var(--evo-text)]">Todo al día.</p>
          <p className="mt-1 text-sm text-[var(--evo-text-secondary)]">No hay nada pendiente por ahora.</p>
        </div>
      ) : (
        <>
          {pending.slice(0, 2).map(agreement => (
            <AgreementRow
              key={agreement.id}
              agreement={agreement}
              creatorName={supportNetwork.find(member => member.id_usuario === agreement.id_usuario_creador)?.nombre}
              disabled={!onToggleAgreement || pendingId === `agreement-${agreement.id}`}
              onToggle={() => onToggleAgreement && runAction(`agreement-${agreement.id}`, () => onToggleAgreement(agreement.id, true))}
            />
          ))}
          {stale && (
            <ObjectiveRow
              objective={stale}
              disabled={pendingId !== null}
              showButtons={Boolean(onUpdateObjective)}
              onCommit={progreso => onUpdateObjective && runAction('objective-commit', () => onUpdateObjective(stale.id, { progreso }))}
              onComplete={() => onUpdateObjective && runAction('objective-complete', () => onUpdateObjective(stale.id, { progreso: 100, estado: 'completado' }))}
            />
          )}
          {session && (
            <div className={`flex min-h-[52px] items-center gap-3 ${ROW_DIVIDER} pt-2.5`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--evo-soft-2)] text-[var(--evo-primary)]">
                <CalendarDays size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[var(--evo-text)]">{session.when}</p>
                <p className="mt-0.5 text-xs text-[var(--evo-text-secondary)]">{session.what}</p>
              </div>
            </div>
          )}
        </>
      )}

      {error && <p role="alert" className="mt-3 text-xs font-bold text-[var(--evo-support-text)]">No pudimos guardar. Intentá de nuevo.</p>}
    </div>
  );
}
