import { Shield } from 'lucide-react';
import { permissionNoteParts } from '@/lib/professionalNextSession';

type Props = { canViewHistory: boolean; canSchedule: boolean; canAssignActivities: boolean };

/** Nota bajo "Tu próxima sesión": qué habilitó la familia, según los permisos efectivos del vínculo. */
export default function PermissionNote(props: Props) {
  const { before, enabled, after } = permissionNoteParts(props);
  return <div className="flex items-center gap-2.5 rounded-[16px] border border-dashed border-[#DACBF0] bg-[#F5F0FC] px-3.5 py-3">
    <Shield size={18} strokeWidth={2.2} className="shrink-0 text-[#553588]" aria-hidden />
    <span className="text-[12.5px] leading-[1.45] text-[#675E78]">{before}{enabled && <b className="text-[#2B2145]">{enabled}</b>}{after}</span>
  </div>;
}
