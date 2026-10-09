import { Chip, HomeCard } from './HomeUi';
import { RowText } from './homeTokens';
import { plural, type buildWeek } from './homeData';
import { cn } from '@/lib/utils';

const BAR_AREA = 70;

export default function HomeWeek({ week }: { week: ReturnType<typeof buildWeek> }) {
  const scale = Math.max(4, ...week.days.map(day => day.count));
  const sub = [plural(week.scheduled, 'programada', 'programadas'), week.cancelled ? plural(week.cancelled, 'cancelada', 'canceladas') : ''].filter(Boolean).join(' · ');
  return <HomeCard className="p-[18px]">
    <div className="mb-3 flex items-start justify-between">
      <div><h3 className="font-sans text-[14.5px] font-extrabold">Sesiones por día</h3><div className={RowText}>{sub}</div></div>
      {week.attendance !== null && <Chip tone="green">Asistencia {week.attendance}%</Chip>}
    </div>
    <p className="sr-only">{week.days.map(day => `${day.label}: ${plural(day.count, 'sesión', 'sesiones')}`).join('. ')}</p>
    <div aria-hidden className="flex items-end gap-1.5">
      {week.days.map(day => <div key={day.label} className="flex flex-1 flex-col items-center gap-[5px]">
        <span className="text-[11.5px] font-bold text-[#675E78]">{day.count || ' '}</span>
        <div className="flex w-full items-end justify-center" style={{ height: BAR_AREA }}>
          {day.count
            ? <span className={cn('w-[70%] rounded-[8px_8px_4px_4px]', day.isToday ? 'bg-[#6F4CA6]' : 'bg-[#C4B0E4]')} style={{ height: Math.min(BAR_AREA, Math.round((day.count / scale) * BAR_AREA)) }} />
            : <span className="h-[70px] w-[70%] rounded-[8px] border-[1.5px] border-dashed border-[#DACBF0]" />}
        </div>
        <span className={cn('text-[11.5px]', day.isToday ? 'font-extrabold text-[#553588]' : 'font-semibold text-[#675E78]')}>{day.isToday ? 'Hoy' : day.label}</span>
      </div>)}
    </div>
    <p className="mt-3 text-[13px] text-[#675E78]">{week.remaining ? `${week.remaining === 1 ? 'Queda' : 'Quedan'} ${plural(week.remaining, 'sesión', 'sesiones')} esta semana.` : 'No quedan sesiones esta semana.'}</p>
  </HomeCard>;
}
