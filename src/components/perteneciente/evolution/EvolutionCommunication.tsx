import VocabularyReportView from '@/components/VocabularyReportView';
import PatternsReportView from '@/components/PatternsReportView';
import AutonomyCardUsageCard from './AutonomyCardUsageCard';

export default function EvolutionCommunication({ userId, canViewHistory }: { userId: string; canViewHistory: boolean }) {
  if (!canViewHistory) {
    return <p className="rounded-2xl bg-[var(--evo-block)] p-4 text-sm text-[var(--evo-text-secondary)]">El historial no está habilitado para este vínculo.</p>;
  }

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
      <div className="space-y-4">
        <VocabularyReportView targetUsuarioId={userId} variant="card" />
        <AutonomyCardUsageCard userId={userId} />
      </div>
      <PatternsReportView targetUsuarioId={userId} variant="card" />
    </div>
  );
}
