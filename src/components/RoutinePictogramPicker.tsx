import PictogramPicker from '@/components/PictogramPicker';
import type { Pictogram } from '@/data/api';

export default function RoutinePictogramPicker({
  onSelect,
  targetUsuarioId,
}: {
  onSelect: (picto: Pictogram) => void;
  targetUsuarioId?: string;
}) {
  return <PictogramPicker onSelect={onSelect} targetUsuarioId={targetUsuarioId} placeholder="Buscar pictograma para este paso..." />;
}
