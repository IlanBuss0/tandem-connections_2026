import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent, User } from '@/data/api';
import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  patients: User[];
}

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNamesShort = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

type TherapyForm = Omit<CalendarEvent, 'id' | 'userId' | 'color' | 'type'> & {
  patientId: string;
};

function fmt(d: Date) {
  return d.toISOString().split('T')[0];
}

function emptyForm(date: string): TherapyForm {
  return {
    title: '',
    date,
    time: '09:00',
    description: '',
    patientId: '',
  };
}

function parsePatientId(description?: string) {
  const match = description?.match(/\[paciente:([^\]]+)\]/);
  return match?.[1] || '';
}

function cleanDescription(description?: string) {
  return (description || '').replace(/\s*\[paciente:[^\]]+\]\s*/g, '').trim();
}

function buildDescription(description: string, patientId: string) {
  const clean = cleanDescription(description);
  return patientId ? `${clean}${clean ? ' ' : ''}[paciente:${patientId}]` : clean;
}

export default function ProfessionalAgenda({ patients }: Props) {
  const { events, addEvent, updateEvent, deleteEvent, eventsOn } = useCalendar();
  const { toast } = useToast();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(fmt(today));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<TherapyForm>(() => emptyForm(fmt(today)));
  const [saving, setSaving] = useState(false);

  const therapyEvents = useMemo(
    () => events.filter((event) => event.type === 'terapia'),
    [events]
  );

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const eventsForDate = (date: string) =>
    therapyEvents.filter((event) => event.date === date);

  const selectedEvents = eventsForDate(selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const monthLabel = `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new Date(cursor.getFullYear(), parseInt(e.target.value), 1);
    setCursor(next);
    setSelectedDate(fmt(next));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new Date(parseInt(e.target.value), cursor.getMonth(), 1);
    setCursor(next);
    setSelectedDate(fmt(next));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(selectedDate));
    setShowForm(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditing(event);
    setForm({
      title: event.title,
      date: event.date,
      time: event.time,
      description: cleanDescription(event.description),
      patientId: parsePatientId(event.description),
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.title.trim()) return;

    const payload = {
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      type: 'terapia' as const,
      description: buildDescription(form.description, form.patientId),
    };

    setSaving(true);
    try {
      if (editing) await updateEvent(editing.id, payload);
      else await addEvent(payload);

      setSelectedDate(form.date);
      setShowForm(false);
      toast({ title: editing ? 'Evento actualizado' : 'Evento creado' });
    } catch (error) {
      toast({
        title: 'No se pudo guardar',
        description: error instanceof Error ? error.message : 'Error desconocido.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">Agenda</h2>
          <p className="text-muted-foreground text-sm">Sesiones y eventos terapeuticos</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-sm">
          <Plus size={16} /> Evento
        </button>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center justify-between bg-card rounded-xl border border-border p-2 w-full">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-muted text-foreground"><ChevronLeft size={18} /></button>
          <div className="flex items-center gap-0">
            <select
              value={cursor.getMonth()}
              onChange={handleMonthChange}
              className="appearance-none bg-transparent rounded-lg px-2 py-1 text-sm font-semibold text-foreground hover:bg-muted transition cursor-pointer outline-none"
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
            <select
              value={cursor.getFullYear()}
              onChange={handleYearChange}
              className="appearance-none bg-transparent rounded-lg px-2 py-1 text-sm font-semibold text-foreground hover:bg-muted transition cursor-pointer outline-none"
            >
              {Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-muted text-foreground"><ChevronRight size={18} /></button>
        </div>
        <button
          onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(fmt(today)); }}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1 rounded-lg transition"
        >
          Hoy
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNamesShort.map((day) => (
            <div key={day} className="text-[10px] sm:text-xs font-semibold text-center text-muted-foreground py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((day, index) => {
            const dateKey = fmt(day);
            const dayEvents = eventsForDate(dateKey);
            const isCurrentMonth = day.getMonth() === cursor.getMonth();
            const isToday = dateKey === fmt(today);
            const isSelected = dateKey === selectedDate;

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(dateKey)}
                className={`relative aspect-square sm:aspect-auto sm:min-h-[72px] p-1 sm:p-1.5 rounded-lg border text-left transition-all flex flex-col ${
                  isSelected ? 'border-primary ring-2 ring-primary/30 bg-primary/5' :
                  isToday ? 'border-primary/40 bg-primary/5' :
                  isCurrentMonth ? 'border-border bg-background hover:border-primary/30' :
                  'border-transparent bg-muted/30 text-muted-foreground'
                }`}
              >
                <span className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>{day.getDate()}</span>
                <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event) => (
                    <span key={event.id} className="hidden sm:block text-[9px] truncate px-1 rounded bg-purple-500 text-white">
                      {event.title}
                    </span>
                  ))}
                  {dayEvents.length > 0 && (
                    <span className="sm:hidden flex gap-0.5 absolute bottom-1 left-1/2 -translate-x-1/2">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span key={event.id} className="w-1 h-1 rounded-full bg-purple-500" />
                      ))}
                    </span>
                  )}
                  {dayEvents.length > 2 && <span className="hidden sm:block text-[9px] text-muted-foreground">+{dayEvents.length - 2}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card rounded-xl p-4 border border-primary/30 shadow-sm space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground">{editing ? 'Editar evento terapeutico' : 'Nuevo evento terapeutico'}</h4>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-muted-foreground" /></button>
            </div>
            <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Titulo del evento" className="w-full p-2 rounded-lg border border-border bg-background text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} className="p-2 rounded-lg border border-border bg-background text-sm" />
              <input type="time" value={form.time} onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))} className="p-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <select value={form.patientId} onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value }))} className="w-full p-2 rounded-lg border border-border bg-background text-sm">
              <option value="">Sin paciente asociado</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
            <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Notas de la sesion o evento importante" className="w-full p-2 rounded-lg border border-border bg-background text-sm resize-none h-16" />
            <button disabled={saving} onClick={submit} className="w-full py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editing ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3">
          {selectedDate === fmt(today) ? 'Hoy' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        {selectedEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            <CalendarDays size={28} className="mx-auto mb-2 text-primary" />
            <p className="text-sm">No hay eventos terapeuticos para este dia</p>
            <button onClick={openCreate} className="mt-3 inline-flex items-center gap-1 text-primary hover:underline text-sm"><Plus size={14} /> Agregar uno</button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((event, index) => {
              const patient = patients.find((item) => item.id === parsePatientId(event.description));
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-4 rounded-xl border bg-purple-100 text-purple-800 border-purple-200"
                >
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{event.title}</p>
                      {patient && <p className="text-xs mt-1 opacity-80">Paciente: {patient.name}</p>}
                      {cleanDescription(event.description) && <p className="text-xs mt-1 opacity-80">{cleanDescription(event.description)}</p>}
                      <p className="text-xs mt-2 opacity-70">{event.time} · terapia</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(event)} className="p-1.5 rounded hover:bg-white/40" title="Editar"><Pencil size={14} /></button>
                      <button
                        onClick={async () => {
                          if (!confirm('Eliminar evento?')) return;
                          try {
                            await deleteEvent(event.id);
                            toast({ title: 'Evento eliminado' });
                          } catch (error) {
                            toast({
                              title: 'No se pudo eliminar',
                              description: error instanceof Error ? error.message : 'Error desconocido.',
                              variant: 'destructive',
                            });
                          }
                        }}
                        className="p-1.5 rounded hover:bg-white/40"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3">Proximos eventos terapeuticos</h3>
        <div className="space-y-2">
          {therapyEvents
            .filter((event) => `${event.date} ${event.time}` >= `${fmt(today)} 00:00`)
            .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
            .slice(0, 5)
            .map((event) => {
              const patient = patients.find((item) => item.id === parsePatientId(event.description));
              return (
                <button key={event.id} onClick={() => setSelectedDate(event.date)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 text-left">
                  <Clock size={16} className="text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · {event.time}
                      {patient ? ` · ${patient.name}` : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          {therapyEvents.filter((event) => `${event.date} ${event.time}` >= `${fmt(today)} 00:00`).length === 0 && (
            <p className="text-xs text-muted-foreground">No hay eventos terapeuticos proximos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
