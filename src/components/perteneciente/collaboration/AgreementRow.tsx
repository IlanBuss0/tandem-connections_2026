import type { SharedSupportAgreement } from '@/data/api';
import AgreementItem from './AgreementItem';

export default function AgreementRow({ agreement, creatorName, disabled, onToggle }: {
  agreement: SharedSupportAgreement; creatorName?: string; disabled: boolean; onToggle: () => void;
}) {
  return <AgreementItem agreement={agreement} creatorName={creatorName} disabled={disabled} onToggle={onToggle} variant="row" />;
}
