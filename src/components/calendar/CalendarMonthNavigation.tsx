import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Props = { year: number; month: number; months: string[]; onChange: (year: number, month: number) => void };
const control = 'inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-bold text-[#6b4c9a] hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]';

export default function CalendarMonthNavigation({ year, month, months, onChange }: Props) {
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(year);
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-center">
      <Popover open={monthOpen} onOpenChange={setMonthOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={`Elegir mes: ${months[month]}`} className={control}>{months[month]}</button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(90vw,320px)] rounded-2xl border-[#ddcfed] bg-white p-3" aria-label="Selector de mes">
          <p className="mb-2 text-sm font-bold text-[#6b4c9a]">Elegí un mes</p>
          <div className="grid grid-cols-3 gap-1.5">
            {months.map((name, index) => (
              <button key={name} type="button" aria-pressed={index === month} onClick={() => { onChange(year, index); setMonthOpen(false); }} className={`min-h-11 rounded-xl px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] ${index === month ? 'bg-[#6b4c9a] text-white' : 'bg-[#faf8ff] text-[#6b4c9a] hover:bg-[#f5f0ff]'}`}>{name}</button>
            ))}
          </div>
          <button type="button" onClick={() => setMonthOpen(false)} className={`${control} mt-2 w-full`}>Cerrar selector de mes</button>
        </PopoverContent>
      </Popover>
      <Popover open={yearOpen} onOpenChange={open => { setYearOpen(open); if (open) setDraftYear(year); }}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={`Elegir año: ${year}`} className={control}>{year}</button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(90vw,280px)] space-y-2 rounded-2xl border-[#ddcfed] bg-white p-3" aria-label="Selector de año">
          <div className="flex items-center justify-between gap-2">
            <button type="button" aria-label="Año anterior" disabled={draftYear <= 1900} onClick={() => setDraftYear(value => value - 1)} className={`${control} disabled:opacity-40`}><ChevronLeft size={20} /></button>
            <span aria-live="polite" className="text-lg font-bold text-[#6b4c9a]">{draftYear}</span>
            <button type="button" aria-label="Año siguiente" disabled={draftYear >= 2100} onClick={() => setDraftYear(value => value + 1)} className={`${control} disabled:opacity-40`}><ChevronRight size={20} /></button>
          </div>
          <button type="button" onClick={() => { onChange(draftYear, month); setYearOpen(false); }} className="min-h-11 w-full rounded-full bg-[#6b4c9a] px-3 text-sm font-semibold text-white hover:bg-[#5a3c8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">Elegir {draftYear}</button>
          <button type="button" onClick={() => setYearOpen(false)} className={`${control} w-full`}>Cancelar</button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
