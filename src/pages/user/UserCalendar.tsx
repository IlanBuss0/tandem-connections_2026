import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Clock, Pencil, Plus, Trash2, X } from 'lucide-react';
import PermissionBlocked from '@/components/PermissionBlocked';
import { useCalendar, eventTypes } from '@/contexts/CalendarContext';
import { useRoutines, DayKey } from '@/contexts/RoutinesContext';
import { CalendarEvent } from '@/data/api';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';
import EventPictogram from '@/components/EventPictogram';
import { useCalendarPictograms } from '@/hooks/useCalendarPictograms';
import SpeakButton from '@/components/SpeakButton';
import { formatConcreteDays } from '@/lib/concreteTime';
import SocialStoryView from '@/components/SocialStoryView';
import { isDayOverloaded } from '@/lib/weekLoad';
import CalendarEventDialog from '@/components/calendar/CalendarEventDialog';
import BelongingRoutineDaySection from '@/components/belonging/BelongingRoutineDaySection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const diasSemanaOrdenCalendario = [1, 2, 3, 4, 5, 6, 0];

const typeBg: Record<string, string> = {
  terapia: 'bg-purple-100 text-purple-700 border-purple-200',
  escuela: 'bg-blue-100 text-blue-700 border-blue-200',
  personal: 'bg-amber-100 text-amber-700 border-amber-200',
  médico: 'bg-red-100 text-red-700 border-red-200',
  social: 'bg-green-100 text-green-700 border-green-200',
  actividad: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  mañana: 'bg-amber-50 text-amber-700 border-amber-200',
  mediodía: 'bg-orange-50 text-orange-700 border-orange-200',
  tarde: 'bg-purple-50 text-purple-700 border-purple-200',
  noche: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function labelDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function UserCalendar({ initialRoutineId, initialItemId }: { initialRoutineId?: string; initialItemId?: string } = {}) {
  const { context: permissionContext } = usePermissionContext();
  const { events, addEvent, updateEvent, deleteEvent, eventTypePatterns } = useCalendar();
  const { customCategories, routines } = useRoutines();

  const getSectionName = (catId: string) => {
    const custom = customCategories.find(c => c.id === catId);
    if (custom) return custom.name;
    const predefinedNames: Record<string, string> = {
      mañana: 'Mañana',
      escuela: 'Escuela',
      mediodía: 'Mediodía',
      tarde: 'Tarde',
      noche: 'Noche',
    };
    return predefinedNames[catId] || catId;
  };

  const today = new Date();
  const todayKey = dateKey(today);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const dayDetailRef = useRef<HTMLElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CalendarEvent | null>(null);
  // Sesion 25 (perfil de memoria), item "anticipacion al crear un evento":
  // sugerencia descartable, NUNCA se abre la historia social sola — mismo
  // espiritu que el aviso de sobrecarga del dia (S17), avisar no imponer.
  const [anticipationSuggestion, setAnticipationSuggestion] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CalendarEvent, 'id' | 'userId' | 'color'>>({
    title: '',
    date: todayKey,
    time: '09:00',
    type: 'mañana',
    description: '',
    reminders: [],
  });

  const canUseCalendar = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.USAR_CALENDARIO,
    true,
  );

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] || []), event];
      return acc;
    }, {});
  }, [events]);

  const monthDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return {
      leadingBlanks: Array.from({ length: startOffset }, (_, index) => index),
      days: Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const date = new Date(year, month, day);
        return { day, key: dateKey(date) };
      }),
    };
  }, [cursor]);

  const selectedDayItems = useMemo(
    () => [...(eventsByDate[selectedDate] || [])].sort((a, b) => a.time.localeCompare(b.time)),
    [eventsByDate, selectedDate],
  );
  const selectedDayActivities = useMemo(() => selectedDayItems.filter(event => event.type === 'actividad'), [selectedDayItems]);
  const selectedDayEvents = useMemo(() => selectedDayItems.filter(event => event.type !== 'actividad'), [selectedDayItems]);

  // Solo se pictogramiza el dia que se esta mirando, no todo el calendario
  // (mismo criterio que "Mi dia" en Sesion 1: no gastar cuota en lo que
  // nadie esta viendo).
  useCalendarPictograms(selectedDayItems);

  // Deep link desde una notificacion de rutina (ej: "recordatorio de paso"):
  // el Calendario se posiciona en la proxima aparicion del dia de la semana
  // al que esta vinculada la rutina.
  useEffect(() => {
    if (!initialRoutineId) return;
    const routine = routines.find(r => r.id === initialRoutineId);
    if (!routine || routine.dayOfWeek === null) return;
    const currentDow = new Date().getDay() as DayKey;
    const diff = (routine.dayOfWeek - currentDow + 7) % 7;
    if (diff === 0) return;
    const target = new Date();
    target.setDate(target.getDate() + diff);
    setCursor(new Date(target.getFullYear(), target.getMonth(), 1));
    setSelectedDate(dateKey(target));
  }, [initialRoutineId, routines]);

  if (!canUseCalendar) {
    return (
      <PermissionBlocked
        title="Calendario deshabilitado"
        description="Tu tutor deshabilitó temporalmente el calendario. No podés ver, crear ni editar eventos hasta que lo vuelva a habilitar."
      />
    );
  }

  const monthLabel = `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const goToMonth = (offset: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
    setCursor(next);
    setSelectedDate(dateKey(next));
  };

  const goToToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new Date(cursor.getFullYear(), parseInt(e.target.value), 1);
    setCursor(next);
    setSelectedDate(dateKey(next));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new Date(parseInt(e.target.value), cursor.getMonth(), 1);
    setCursor(next);
    setSelectedDate(dateKey(next));
  };

  const openCreate = (date = selectedDate) => {
    setEditing(null);
    setForm({ title: '', date, time: '09:00', type: 'mañana', description: '', reminders: [], afterNote: '', planB: '', sensoryNote: '' });
    setShowForm(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditing(event);
    setForm({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      description: event.description,
      reminders: event.reminders || [],
      afterNote: event.afterNote || '',
      planB: event.planB || '',
      sensoryNote: event.sensoryNote || '',
    });
    setShowForm(true);
  };

  const submit = (submittedForm = form) => {
    const payload = { ...submittedForm, title: submittedForm.title.trim() };
    if (!payload.title) return;

    if (editing) {
      updateEvent(editing.id, payload);
    } else {
      addEvent(payload);
      // Solo al CREAR (no al editar): si este tipo de evento historicamente
      // se asocia con animo dificil para esta persona, se sugiere preparar
      // una historia social — nunca se abre sola, la persona decide.
      const hasPattern = eventTypePatterns.some((p) => p.type === payload.type);
      setAnticipationSuggestion(hasPattern ? payload.type : null);
    }

    setShowForm(false);
    setSelectedDate(payload.date);
    const formDate = new Date(`${payload.date}T12:00:00`);
    setCursor(new Date(formDate.getFullYear(), formDate.getMonth(), 1));
  };

  const selectDate = (date: string) => {
    setSelectedDate(date);
    if (window.matchMedia('(max-width: 1023px)').matches) {
      window.requestAnimationFrame(() => dayDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const confirmDelete = () => {
    if (!deleteCandidate) return;
    deleteEvent(deleteCandidate.id);
    setDeleteCandidate(null);
  };

  return (
    <div className="pb-24 lg:pb-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">Calendario</h1>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">{monthLabel}</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition"
        >
          <Plus size={17} />
          Crear nuevo Evento
        </button>
      </motion.div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.65fr)] xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.7fr)] xl:gap-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full min-w-0 rounded-3xl border border-[#f0e8f8] bg-white p-3 shadow-lg sm:p-5 xl:p-6"
      >
        <div className="flex flex-col items-center gap-1.5 mb-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 w-full">
            <button
              onClick={() => goToMonth(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#8b7aa0] hover:bg-[#f5f0ff] hover:text-[#6b4c9a] transition"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center justify-center gap-0">
              <select
                value={cursor.getMonth()}
                onChange={handleMonthChange}
                className="appearance-none bg-transparent rounded-full px-3 py-1.5 text-sm sm:text-base font-bold text-[#6b4c9a] hover:bg-[#f5f0ff] transition cursor-pointer outline-none"
              >
                {monthNames.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <select
                value={cursor.getFullYear()}
                onChange={handleYearChange}
                className="appearance-none bg-transparent rounded-full px-3 py-1.5 text-sm sm:text-base font-bold text-[#6b4c9a] hover:bg-[#f5f0ff] transition cursor-pointer outline-none"
              >
                {Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => goToMonth(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#8b7aa0] hover:bg-[#f5f0ff] hover:text-[#6b4c9a] transition"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="text-xs font-semibold text-[#8b7aa0] hover:text-[#6b4c9a] hover:bg-[#f5f0ff] px-3 py-1 rounded-full transition"
          >
            Hoy
          </button>
        </div>

        <div translate="no" className="notranslate grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {diasSemanaOrdenCalendario.map(dayIndex => (
            <div key={dayIndex} translate="no" className="notranslate py-1 text-center text-[10px] sm:text-xs font-semibold text-[#8b7aa0] uppercase tracking-wide">
              {diasSemana[dayIndex]}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {monthDays.leadingBlanks.map(blank => (
            <div key={`blank-${blank}`} aria-hidden className="min-h-[68px] sm:min-h-[86px] xl:min-h-[92px]" />
          ))}

          {monthDays.days.map(({ day, key }) => {
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const dayEvents = eventsByDate[key] || [];
            const hasEvents = dayEvents.length > 0;
            const isPastEventDay = key < todayKey && hasEvents;

            return (
              <button
                key={key}
                onClick={() => selectDate(key)}
                onDoubleClick={() => openCreate(key)}
                aria-pressed={isSelected}
                aria-label={`${day} de ${monthNames[cursor.getMonth()]}${hasEvents ? `, ${dayEvents.length} elementos` : ', sin contenido'}`}
                className={`relative flex min-h-[68px] sm:min-h-[86px] xl:min-h-[92px] flex-col rounded-2xl border p-1.5 sm:p-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 ${
                  isToday
                    ? 'border-[#6b4c9a] bg-[#6b4c9a] text-white shadow-md shadow-purple-200'
                    : isPastEventDay && isSelected
                    ? 'border-[#6b4c9a] bg-[#faf8ff] text-[#6b4c9a] shadow-md shadow-purple-100'
                    : isPastEventDay
                      ? 'border-transparent bg-[#faf8ff] text-[#4a3a6a] hover:bg-[#f5f0ff]'
                      : isSelected
                    ? 'border-[#d8c7ef] bg-[#f5f0ff] text-[#6b4c9a] shadow-sm'
                    : hasEvents
                      ? 'border-[#eadcff] bg-[#EFE3FF] text-[#6b4c9a] hover:border-[#6b4c9a]/30'
                        : 'border-transparent bg-[#faf8ff] text-[#4a3a6a] hover:bg-[#f5f0ff]'
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm sm:text-base font-extrabold leading-none ${
                    isToday
                      ? 'bg-white/20 text-white'
                      : isPastEventDay
                      ? 'bg-[#EFE3FF] text-[#6b4c9a]'
                        : ''
                  }`}
                >
                  {day}
                </span>

                {hasEvents && (
                  <div className="mt-auto min-w-0 pt-2">
                    <div className="hidden sm:flex flex-col gap-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map(event => (
                        <span
                          key={event.id}
                          className={`truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isToday ? 'bg-white/20 text-white' : 'bg-white text-[#6b4c9a]'
                          }`}
                        >
                          <EventPictogram event={event} size="sm" /> {event.title}
                        </span>
                      ))}
                    </div>
                    <div className="flex min-h-6 items-center gap-0.5 overflow-hidden sm:hidden">
                      {dayEvents.slice(0, 1).map(event => (
                        <span key={event.id} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${isToday ? 'bg-white/25 text-white' : 'bg-white text-[#6b4c9a]'}`}>
                          <EventPictogram event={event} size="sm" />
                        </span>
                      ))}
                      {dayEvents.length > 1 && (
                        <span className={`text-[9px] font-bold leading-none ${isToday ? 'text-white' : 'text-[#6b4c9a]'}`}>
                          +{dayEvents.length - 1}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.section>

      <CalendarEventDialog
        open={showForm}
        editing={Boolean(editing)}
        form={form}
        onOpenChange={setShowForm}
        onFormChange={setForm}
        onSubmit={submit}
      />

      <motion.section
        ref={dayDetailRef}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="min-w-0 max-w-full self-start rounded-3xl border border-[#f0e8f8] bg-white p-3.5 shadow-lg sm:p-4"
      >
        <div>
          <div>
            <p className="text-xs font-semibold text-[#8b7aa0] uppercase tracking-wide">
              {selectedDate === todayKey ? 'Hoy' : labelDate(selectedDate)}
              {selectedDate !== todayKey && ` · ${formatConcreteDays(selectedDate, new Date())}`}
            </p>
            <h2 className="text-xl font-bold text-[#6b4c9a]">Detalle del día</h2>
            {isDayOverloaded(events, selectedDate) && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <AlertTriangle size={12} /> Día con muchas actividades — puede ser mucho para un solo día
              </p>
            )}
          </div>
        </div>

        {anticipationSuggestion && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-[#d8c7ef] bg-[#faf8ff] p-2.5 text-xs text-[#6b4c9a]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <p className="flex-1">
              Este tipo de evento a veces te resulta difícil. Podés tocar <strong>"Historia social"</strong> en el evento para prepararlo con tiempo.
            </p>
            <button
              type="button"
              onClick={() => setAnticipationSuggestion(null)}
              aria-label="Descartar aviso"
              className="shrink-0 rounded-full p-1 hover:bg-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <section aria-labelledby="day-events-title" className="mt-3.5">
          <h3 id="day-events-title" className="text-sm font-extrabold uppercase tracking-wide text-[#5f477c]">Eventos</h3>
        {selectedDayEvents.length === 0 ? (
          <div className="mt-2 flex min-h-14 items-center gap-2.5 rounded-2xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-3 py-2.5">
            <CalendarDays size={22} className="shrink-0 text-[#6b4c9a]" />
            <p className="text-sm font-semibold text-[#4a4a5a]">No hay eventos para este día</p>
          </div>
        ) : (
          <div className="mt-2.5 min-w-0 max-w-full space-y-2.5">
            {selectedDayEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`group min-w-0 max-w-full overflow-hidden rounded-2xl border p-3 ${typeBg[event.type] || 'bg-[#faf8ff] border-[#ede4f8]'}`}
              >
                <div className="flex min-w-0 max-w-full items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70 text-xl">
                    <EventPictogram event={event} />
                  </span>
                  <div className="min-w-0 max-w-full flex-1">
                    <p className="max-w-full whitespace-normal [overflow-wrap:anywhere] text-sm font-bold">{event.title}</p>
                    {event.description && <p className="mt-1 max-w-full whitespace-normal [overflow-wrap:anywhere] text-xs leading-relaxed opacity-80">{event.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-75">
                      <span className="inline-flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                      <span className="capitalize">{getSectionName(event.type)}</span>
                    </div>
                    <div className="mt-2">
                      <SocialStoryView event={event} />
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <SpeakButton text={event.title} size={14} className="p-1.5" />
                    <button onClick={() => openEdit(event)} className="p-1.5 rounded-full hover:bg-white/50" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(event)}
                      className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"
                      aria-label={`Eliminar ${event.title}`}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </section>

        <section aria-labelledby="day-activities-title" className="mt-4 border-t border-[#eee5f7] pt-3.5">
          <h3 id="day-activities-title" className="text-sm font-extrabold uppercase tracking-wide text-[#5f477c]">Actividades</h3>
          {selectedDayActivities.length === 0 ? (
            <div className="mt-2 rounded-2xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-3 py-2.5">
              <p className="text-sm font-semibold text-[#4a4a5a]">No hay actividades para este día</p>
            </div>
          ) : (
            <div className="mt-2.5 space-y-2.5">
              {selectedDayActivities.map(activity => (
                <div key={activity.id} className="group flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70"><EventPictogram event={activity} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold">{activity.title}</p>
                    {activity.description && <p className="mt-1 break-words text-xs leading-relaxed opacity-80">{activity.description}</p>}
                    <p className="mt-2 inline-flex items-center gap-1 text-xs opacity-75"><Clock size={12} /> {activity.time}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => openEdit(activity)} aria-label={`Editar ${activity.title}`} className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteCandidate(activity)} aria-label={`Eliminar ${activity.title}`} className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <BelongingRoutineDaySection
          dayOfWeek={new Date(`${selectedDate}T12:00:00`).getDay() as DayKey}
          initialRoutineId={initialRoutineId}
          initialItemId={initialItemId}
        />
      </motion.section>
      </div>

      <AlertDialog open={Boolean(deleteCandidate)} onOpenChange={open => { if (!open) setDeleteCandidate(null); }}>
        <AlertDialogContent overlayClassName="bg-[#241a30]/45 backdrop-blur-sm" className="w-[calc(100%-1.5rem)] max-w-md rounded-[28px] border-[#ddcfed] bg-[#fffaff]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold text-[#5b3784]">¿Querés eliminar este evento?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed text-[#756a82]">
              {deleteCandidate && (deleteCandidate.date === todayKey || formatConcreteDays(deleteCandidate.date, new Date()) === 'mañana')
                ? `Esto va a cambiar el plan de ${deleteCandidate.date === todayKey ? 'hoy' : 'mañana'}: “${deleteCandidate.title}”.`
                : deleteCandidate ? `Se eliminará “${deleteCandidate.title}”.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11 rounded-xl border-[#ddcfed] text-[#5f477c] hover:bg-[#f5f0ff]">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="min-h-11 rounded-xl bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
