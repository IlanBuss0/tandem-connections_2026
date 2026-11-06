import { CheckCircle2, Circle, Clock, Pencil, Trash2 } from 'lucide-react';
import type { RoutineItem } from '@/data/api';
import RoutinePictogram from '@/components/RoutinePictogram';
import SpeakButton from '@/components/SpeakButton';
import StartTaskHint from '@/components/StartTaskHint';

type Props = {
  item: RoutineItem;
  position: number;
  next: boolean;
  selected: boolean;
  visual: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function BelongingRoutineStep({ item, position, next, selected, visual, onToggle, onEdit, onDelete }: Props) {
  const control = 'flex min-h-11 min-w-11 items-center justify-center rounded-xl px-2 text-[#6b4c9a] hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]';
  return (
    <li aria-current={next ? 'step' : undefined} className={`grid min-w-0 gap-2 rounded-2xl border p-3 ${!visual ? 'sm:grid-cols-[minmax(0,1fr)_auto]' : ''} ${selected ? 'ring-2 ring-[#6b4c9a]' : ''} ${item.completed ? 'border-green-200 bg-green-50/70' : next ? 'border-[#bfa4dc] bg-[#faf7ff]' : 'border-[#e9def5] bg-white'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#6b4c9a]">Paso {position}</span>
        {next && <span className="rounded-full bg-[#eee5fa] px-2 py-1 text-xs font-semibold text-[#5b3784]">Siguiente paso</span>}
      </div>
      <div className={`flex min-w-0 gap-3 ${visual ? 'flex-col items-center text-center' : 'items-start sm:col-start-1'}`}>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-1">
          {item.pictogramImageUrl || !item.icon ? <RoutinePictogram item={item} size="lg" /> : <span className="text-4xl" aria-hidden>{item.icon}</span>}
        </div>
        <div className="min-w-0 space-y-1">
          <h4 className="break-words text-base font-bold leading-6 text-[#3f3153]">{item.pictogramLabel || item.title}</h4>
          {item.pictogramLabel && item.pictogramLabel !== item.title && <p className="break-words text-sm leading-6 text-[#675a78]">{item.title}</p>}
          <p className={`flex flex-wrap items-center gap-2 text-xs text-[#675a78] ${visual ? 'justify-center' : ''}`}>
            <span className="inline-flex items-center gap-1"><Clock size={13} aria-hidden />{item.time}</span>
            {!!item.reminders?.length && <span>{item.reminders.length} aviso{item.reminders.length === 1 ? '' : 's'}</span>}
          </p>
        </div>
      </div>
      <div className={`flex flex-wrap items-center justify-between gap-1 border-t border-[#eee5f7] pt-2 ${!visual ? 'sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:flex-col sm:justify-center sm:border-l sm:border-t-0 sm:pl-2 sm:pt-0' : ''}`}>
        <button type="button" onClick={onToggle} aria-pressed={item.completed} aria-label={`${item.completed ? 'Marcar pendiente' : 'Marcar completado'}: ${item.title}`} className={`${control} gap-2 text-xs font-semibold`}>
          {item.completed ? <CheckCircle2 size={20} className="text-green-700" /> : <Circle size={20} />}
          {item.completed ? 'Completado' : 'Pendiente'}
        </button>
        <div className="flex flex-wrap items-center gap-1">
          <SpeakButton text={item.title} size={18} className="flex min-h-11 min-w-11 items-center justify-center" />
          <button type="button" onClick={onEdit} aria-label={`Editar paso: ${item.title}`} className={control}><Pencil size={17} /></button>
          <button type="button" onClick={onDelete} aria-label={`Eliminar paso: ${item.title}`} className={`${control} text-red-600 hover:bg-red-50`}><Trash2 size={17} /></button>
        </div>
      </div>
      {visual && !item.completed && <StartTaskHint stepTitle={item.pictogramLabel || item.title} />}
    </li>
  );
}
