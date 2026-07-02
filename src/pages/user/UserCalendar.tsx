import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import PermissionBlocked from '@/components/PermissionBlocked';
import { useCalendar, eventTypes, typeEmoji } from '@/contexts/CalendarContext';
import { CalendarEvent } from '@/data/api';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';
import ReminderPicker from '@/components/ReminderPicker';

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNamesShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const typeBg: Record<CalendarEvent['type'], string> = {
  terapia: 'bg-purple-100 text-purple-700 border-purple-200',
  escuela: 'bg-blue-100 text-blue-700 border-blue-200',
  personal: 'bg-amber-100 text-amber-700 border-amber-200',
  médico: 'bg-red-100 text-red-700 border-red-200',
  social: 'bg-green-100 text-green-700 border-green-200',
  actividad: 'bg-yellow-100 text-yellow-700 border-yellow-200',
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

export default function UserCalendar() {
  const { context: permissionContext } = usePermissionContext();
  const { events, addEvent, updateEvent, deleteEvent } = useCalendar();
  const today = new Date();
  const todayKey = dateKey(today);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<Omit<CalendarEvent, 'id' | 'userId' | 'color'>>({
    title: '',
    date: todayKey,
    time: '09:00',
    type: 'personal',
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

  const selectedDayEvents = useMemo(
    () => [...(eventsByDate[selectedDate] || [])].sort((a, b) => a.time.localeCompare(b.time)),
    [eventsByDate, selectedDate],
  );

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
    setForm({ title: '', date, time: '09:00', type: 'personal', description: '', reminders: [] });
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
    });
    setShowForm(true);
  };

  const submit = () => {
    const payload = { ...form, title: form.title.trim() };
    if (!payload.title) return;

    if (editing) updateEvent(editing.id, payload);
    else addEvent(payload);

    setShowForm(false);
    setSelectedDate(form.date);
    const formDate = new Date(`${form.date}T12:00:00`);
    setCursor(new Date(formDate.getFullYear(), formDate.getMonth(), 1));
  };

  return (
    <div className="pb-24 lg:pb-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold text-[#8b7aa0] uppercase tracking-wide">Vista mensual</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">Calendario</h1>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">{monthLabel}</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition"
        >
          <Plus size={17} />
          Evento
        </button>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full bg-white rounded-3xl shadow-lg border border-[#f0e8f8] p-3 sm:p-5"
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

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {dayNamesShort.map(day => (
            <div key={day} className="py-1 text-center text-[10px] sm:text-xs font-semibold text-[#8b7aa0] uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {monthDays.leadingBlanks.map(blank => (
            <div key={`blank-${blank}`} aria-hidden className="min-h-[54px] sm:min-h-[86px]" />
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
                onClick={() => setSelectedDate(key)}
                onDoubleClick={() => openCreate(key)}
                className={`relative flex min-h-[54px] sm:min-h-[86px] flex-col rounded-2xl border p-1.5 sm:p-2 text-left transition-all duration-200 ${
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

                {hasEvents && !isPastEventDay && (
                  <div className="mt-auto min-w-0 pt-2">
                    <div className="hidden sm:flex flex-col gap-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map(event => (
                        <span
                          key={event.id}
                          className={`truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isToday ? 'bg-white/20 text-white' : 'bg-white text-[#6b4c9a]'
                          }`}
                        >
                          {typeEmoji[event.type]} {event.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.section>

      <AnimatePresence>
        {showForm && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-3xl border border-[#d8c7ef] bg-white p-4 sm:p-5 shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#6b4c9a]">{editing ? 'Editar evento' : 'Nuevo evento'}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#8b7aa0] hover:bg-[#f5f0ff] hover:text-[#6b4c9a]"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={form.title}
                onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                placeholder="Título del evento"
                className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={form.date}
                  onChange={event => setForm(current => ({ ...current, date: event.target.value }))}
                  className="min-w-0 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={event => setForm(current => ({ ...current, time: event.target.value }))}
                  className="min-w-0 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"
                />
              </div>
              <select
                value={form.type}
                onChange={event => setForm(current => ({ ...current, type: event.target.value as CalendarEvent['type'] }))}
                className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>{typeEmoji[type]} {type}</option>
                ))}
              </select>
              <textarea
                value={form.description}
                onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
                placeholder="Descripción (opcional)"
                className="h-20 w-full resize-none rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"
              />
              <ReminderPicker value={form.reminders} onChange={reminders => setForm(current => ({ ...current, reminders }))} />
              <button
                onClick={submit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] transition"
              >
                <Save size={16} />
                {editing ? 'Guardar cambios' : 'Crear evento'}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-[#f0e8f8] bg-white p-4 sm:p-5 shadow-lg"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-[#8b7aa0] uppercase tracking-wide">
              {selectedDate === todayKey ? 'Hoy' : labelDate(selectedDate)}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#6b4c9a]">Actividades del día</h2>
          </div>
          <button
            onClick={() => openCreate(selectedDate)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f5f0ff] px-4 py-2.5 text-sm font-semibold text-[#6b4c9a] hover:bg-[#EFE3FF] transition"
          >
            <Plus size={16} />
            Agregar
          </button>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-4 py-10 text-center">
            <CalendarDays size={34} className="text-[#6b4c9a]" />
            <p className="mt-3 text-sm font-semibold text-[#4a4a5a]">No hay actividades para este día</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {selectedDayEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`group rounded-2xl border p-4 ${typeBg[event.type] || 'bg-[#faf8ff] border-[#ede4f8]'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70 text-xl">
                    {typeEmoji[event.type] || '•'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{event.title}</p>
                    {event.description && <p className="mt-1 text-xs leading-relaxed opacity-80">{event.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-75">
                      <span className="inline-flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                      <span className="capitalize">{event.type}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(event)} className="p-1.5 rounded-full hover:bg-white/50" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('¿Eliminar evento?')) deleteEvent(event.id); }}
                      className="p-1.5 rounded-full hover:bg-white/50"
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
      </motion.section>
    </div>
  );
}
