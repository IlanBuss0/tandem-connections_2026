import { useEffect, useState } from 'react';
import { CalendarDays, Save } from 'lucide-react';
import type { CalendarEvent } from '@/data/api';
import ReminderPicker from '@/components/ReminderPicker';
import SectionSelector from '@/components/SectionSelector';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { datePartsToIso, isoToDateParts, type DateParts } from '@/lib/calendarDate';
import { normalizeCalendarTime } from '@/lib/calendarTime';

type EventForm = Omit<CalendarEvent, 'id' | 'userId' | 'color'>;

type Props = {
  open: boolean;
  editing: boolean;
  form: EventForm;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: EventForm) => void;
  onSubmit: (form: EventForm) => void;
};

type TimeParts = { hour: string; minute: string };

const splitTime = (time: string): TimeParts => {
  const [hour = '09', minute = '00'] = time.split(':');
  return { hour, minute };
};

export default function CalendarEventDialog({ open, editing, form, onOpenChange, onFormChange, onSubmit }: Props) {
  const [dateParts, setDateParts] = useState<DateParts>(() => isoToDateParts(form.date));
  const [dateError, setDateError] = useState('');
  const [timeParts, setTimeParts] = useState<TimeParts>(() => splitTime(form.time));
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (open) {
      setDateParts(isoToDateParts(form.date));
      setDateError('');
      setTimeParts(splitTime(form.time));
      setTimeError('');
    }
  }, [open, form.date, form.time]);

  const updateDatePart = (part: keyof DateParts, value: string) => {
    const maxLength = part === 'year' ? 4 : 2;
    const next = { ...dateParts, [part]: value.replace(/\D/g, '').slice(0, maxLength) };
    setDateParts(next);
    const isComplete = next.day.length === 2 && next.month.length === 2 && next.year.length === 4;
    if (!isComplete) return;
    const iso = datePartsToIso(next);
    if (iso) {
      setDateError('');
      onFormChange({ ...form, date: iso });
    }
  };

  const validateDate = () => {
    const iso = datePartsToIso(dateParts);
    if (!iso) {
      setDateError('Ingresá una fecha válida en formato DD/MM/AAAA.');
      return false;
    }
    setDateError('');
    onFormChange({ ...form, date: iso });
    return true;
  };

  const updateTimePart = (part: keyof TimeParts, value: string) => {
    const next = { ...timeParts, [part]: value.replace(/\D/g, '').slice(0, 2) };
    setTimeParts(next);
    const isComplete = next.hour.length === 2 && next.minute.length === 2;
    const normalized = normalizeCalendarTime(next.hour, next.minute);
    if (isComplete && normalized) {
      setTimeError('');
      onFormChange({ ...form, time: normalized });
    }
  };

  const validateTime = () => {
    const normalizedTime = normalizeCalendarTime(timeParts.hour, timeParts.minute);
    if (!normalizedTime) {
      setTimeError('Ingresá una hora válida entre 00:00 y 23:59.');
      return false;
    }
    const normalized = splitTime(normalizedTime);
    setTimeParts(normalized);
    setTimeError('');
    onFormChange({ ...form, time: normalizedTime });
    return true;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const iso = datePartsToIso(dateParts);
    if (validateDate() && validateTime() && iso) {
      const normalizedTime = normalizeCalendarTime(timeParts.hour, timeParts.minute);
      if (normalizedTime) onSubmit({ ...form, date: iso, time: normalizedTime });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName="bg-[#241a30]/45 backdrop-blur-sm" className="max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-[28px] border-[#ddcfed] bg-[#fffaff] p-5 font-body shadow-2xl [scrollbar-color:#cdb8e4_transparent] [scrollbar-width:thin] sm:p-7 [&_h2]:font-body [&_h3]:font-body [&_h4]:font-body [&>button]:right-5 [&>button]:top-5 [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:text-[#6b4c9a] [&>button]:focus:ring-[#7c3aed]">
        <DialogHeader className="mb-2 px-10 text-center sm:text-center">
          <DialogTitle className="text-center text-2xl font-extrabold tracking-tight text-[#5b3784] sm:text-3xl">{editing ? 'Editar evento' : 'Nuevo Evento'}</DialogTitle>
          <DialogDescription className="pt-1 text-center text-[#756a82]">Completá los datos para organizar tu día.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6 sm:space-y-7">
          <label className="block space-y-2.5 text-base font-bold text-[#5f477c]">
            <span>Título</span>
            <input autoFocus value={form.title} onChange={event => onFormChange({ ...form, title: event.target.value })} className="min-h-11 w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-base font-normal text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20" />
          </label>

          <section className="space-y-2.5" aria-labelledby="event-date-heading">
            <h3 id="event-date-heading" className="text-base font-bold text-[#5f477c]">Fecha</h3>
            <div className="rounded-2xl border border-[#eadff5] bg-white/70 p-4">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1.35fr] items-center gap-2">
              {(['day', 'month', 'year'] as const).map((part, index) => (
                <div className="contents" key={part}>
                  {index > 0 && <span aria-hidden className="text-center font-bold text-[#9a82b4]">/</span>}
                  <label className="min-w-0 text-center text-[11px] font-semibold uppercase tracking-wide text-[#8b7aa0]">
                    {part === 'day' ? 'Día' : part === 'month' ? 'Mes' : 'Año'}
                    <input inputMode="numeric" aria-invalid={Boolean(dateError)} value={dateParts[part]} onChange={event => updateDatePart(part, event.target.value)} onBlur={validateDate} placeholder={part === 'day' ? 'DD' : part === 'month' ? 'MM' : 'AAAA'} className="mt-1 min-h-11 w-full rounded-xl border border-[#e4d8f2] bg-[#faf8ff] px-2 text-center text-base font-bold tabular-nums text-[#4a3a62] outline-none focus:ring-2 focus:ring-[#7c3aed]/30" />
                  </label>
                </div>
              ))}
            </div>
            <div className="relative mt-4 flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#e4d8f2] bg-[#faf8ff] px-3 text-sm font-semibold text-[#6b4c9a] transition duration-200 hover:border-[#d3bee9] hover:bg-[#f3eaff] focus-within:ring-2 focus-within:ring-[#7c3aed]/30">
              <CalendarDays size={18} aria-hidden /> Elegir en calendario
              <input aria-label="Elegir fecha en calendario" type="date" value={form.date} onChange={event => { const next = event.target.value; if (!next) return; setDateParts(isoToDateParts(next)); setDateError(''); onFormChange({ ...form, date: next }); }} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
            </div>
            {dateError && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{dateError}</p>}
            </div>
          </section>

          <section className="space-y-2.5" aria-labelledby="event-time-heading">
            <h3 id="event-time-heading" className="text-base font-bold text-[#5f477c]">Horario</h3>
            <div className="rounded-2xl border border-[#eadff5] bg-white/70 p-4">
              <p className="mb-3 text-sm font-semibold text-[#756a82]">Hora de inicio <span className="font-normal">· formato 24 horas</span></p>
              <div className="mx-auto grid max-w-xs grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:gap-3">
                <label className="min-w-0 space-y-1.5 text-center text-xs font-semibold text-[#756a82]">
                  <span className="block">Hora</span>
                  <input type="text" inputMode="numeric" autoComplete="off" aria-invalid={Boolean(timeError)} value={timeParts.hour} onChange={event => updateTimePart('hour', event.target.value)} onBlur={validateTime} placeholder="HH" className="h-16 w-full rounded-2xl border border-[#dfd2ed] bg-[#faf8ff] px-2 text-center text-2xl font-bold tabular-nums text-[#5b3784] outline-none transition duration-200 hover:border-[#cdb8e4] hover:bg-[#f7f1ff] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15" />
                </label>
                <span aria-hidden className="flex h-16 items-center pb-0.5 text-2xl font-extrabold text-[#8b7aa0]">:</span>
                <label className="min-w-0 space-y-1.5 text-center text-xs font-semibold text-[#756a82]">
                  <span className="block">Minutos</span>
                  <input type="text" inputMode="numeric" autoComplete="off" aria-invalid={Boolean(timeError)} value={timeParts.minute} onChange={event => updateTimePart('minute', event.target.value)} onBlur={validateTime} placeholder="MM" className="h-16 w-full rounded-2xl border border-[#dfd2ed] bg-[#faf8ff] px-2 text-center text-2xl font-bold tabular-nums text-[#5b3784] outline-none transition duration-200 hover:border-[#cdb8e4] hover:bg-[#f7f1ff] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15" />
                </label>
              </div>
              {timeError && <p role="alert" className="mt-2 text-center text-sm font-medium text-red-600">{timeError}</p>}
            </div>
          </section>

          <section className="space-y-2.5" aria-labelledby="day-moment-heading">
            <h3 id="day-moment-heading" className="text-base font-bold text-[#5f477c]">¿En qué momento del día?</h3>
            <p className="text-xs leading-relaxed text-[#8b7aa0]">Organiza el evento dentro de tu día; la hora exacta se mantiene arriba.</p>
            <SectionSelector value={form.type} onChange={type => onFormChange({ ...form, type })} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-sm text-[#4a4a5a] outline-none transition duration-200 hover:border-[#d8c7ef] hover:bg-[#f5f0ff] focus:ring-2 focus:ring-[#6b4c9a]/20" />
          </section>
          <label className="block space-y-2.5 text-base font-bold text-[#5f477c]">
            <span>Descripción</span>
            <textarea value={form.description} onChange={event => onFormChange({ ...form, description: event.target.value })} placeholder="Descripción (opcional)" className="h-20 w-full resize-none rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-base font-normal text-[#4a4a5a] outline-none focus:ring-2 focus:ring-[#6b4c9a]/20" />
          </label>
          <ReminderPicker value={form.reminders} onChange={reminders => onFormChange({ ...form, reminders })} />
          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:bg-[#5a3c8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"><Save size={16} />{editing ? 'Guardar cambios' : 'Crear evento'}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
