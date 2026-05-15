import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalendar, eventTypes, typeEmoji } from '@/contexts/CalendarContext';
import { CalendarEvent } from '@/data/api';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Clock, Save } from 'lucide-react';

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

function fmt(d: Date) { return d.toISOString().split('T')[0]; }

export default function UserCalendar() {
  const { events, addEvent, updateEvent, deleteEvent, eventsOn } = useCalendar();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(fmt(today));

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<Omit<CalendarEvent, 'id' | 'userId' | 'color'>>({
    title: '', date: fmt(today), time: '09:00', type: 'personal', description: '',
  });

  // Build month grid (Mon-first)
  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    // Convert Sunday=0 to Monday=0 grid
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const dayEvents = eventsOn(selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', date: selectedDate, time: '09:00', type: 'personal', description: '' });
    setShowForm(true);
  };
  const openEdit = (ev: CalendarEvent) => {
    setEditing(ev);
    setForm({ title: ev.title, date: ev.date, time: ev.time, type: ev.type, description: ev.description });
    setShowForm(true);
  };
  const submit = () => {
    if (!form.title.trim()) return;
    if (editing) updateEvent(editing.id, form);
    else addEvent(form);
    setShowForm(false);
    setSelectedDate(form.date);
  };

  const monthLabel = `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Calendario</h2>
          <p className="text-muted-foreground text-sm">{monthLabel}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-sm">
          <Plus size={16} /> Evento
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between bg-card rounded-xl border border-border p-2">
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-muted text-foreground"><ChevronLeft size={18} /></button>
        <button onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(fmt(today)); }} className="text-sm font-semibold text-foreground px-3 py-1 rounded-lg hover:bg-muted">
          {monthLabel}
        </button>
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-muted text-foreground"><ChevronRight size={18} /></button>
      </div>

      {/* Calendar grid */}
      <div className="bg-card rounded-xl border border-border p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNamesShort.map(d => (
            <div key={d} className="text-[10px] sm:text-xs font-semibold text-center text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            const ds = fmt(d);
            const isCurrentMonth = d.getMonth() === cursor.getMonth();
            const isToday = ds === fmt(today);
            const isSelected = ds === selectedDate;
            const dayEvs = eventsOn(ds);
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(ds)}
                className={`relative aspect-square sm:aspect-auto sm:min-h-[72px] p-1 sm:p-1.5 rounded-lg border text-left transition-all flex flex-col ${
                  isSelected ? 'border-primary ring-2 ring-primary/30 bg-primary/5' :
                  isToday ? 'border-primary/40 bg-primary/5' :
                  isCurrentMonth ? 'border-border bg-background hover:border-primary/30' :
                  'border-transparent bg-muted/30 text-muted-foreground'
                }`}
              >
                <span className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>{d.getDate()}</span>
                <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                  {dayEvs.slice(0, 2).map(e => (
                    <span key={e.id} className="hidden sm:block text-[9px] truncate px-1 rounded" style={{ backgroundColor: e.color, color: 'white' }}>
                      {typeEmoji[e.type]} {e.title}
                    </span>
                  ))}
                  {dayEvs.length > 0 && (
                    <span className="sm:hidden flex gap-0.5 absolute bottom-1 left-1/2 -translate-x-1/2">
                      {dayEvs.slice(0, 3).map(e => (
                        <span key={e.id} className="w-1 h-1 rounded-full" style={{ backgroundColor: e.color }} />
                      ))}
                    </span>
                  )}
                  {dayEvs.length > 2 && <span className="hidden sm:block text-[9px] text-muted-foreground">+{dayEvs.length - 2}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add/Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-card rounded-xl p-4 border border-primary/30 shadow-sm space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground">{editing ? 'Editar evento' : 'Nuevo evento'}</h4>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-muted-foreground" /></button>
            </div>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título del evento" className="w-full p-2 rounded-lg border border-border bg-background text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="p-2 rounded-lg border border-border bg-background text-sm" />
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="p-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CalendarEvent['type'] }))} className="w-full p-2 rounded-lg border border-border bg-background text-sm">
              {eventTypes.map(t => <option key={t} value={t}>{typeEmoji[t]} {t}</option>)}
            </select>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción (opcional)" className="w-full p-2 rounded-lg border border-border bg-background text-sm resize-none h-16" />
            <button onClick={submit} className="w-full py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-1">
              <Save size={14} /> {editing ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected day events */}
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3">
          {selectedDate === fmt(today) ? 'Hoy' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">No hay eventos para este día</p>
            <button onClick={openCreate} className="mt-3 inline-flex items-center gap-1 text-primary hover:underline text-sm"><Plus size={14} /> Agregar uno</button>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group p-4 rounded-xl border ${typeBg[event.type] || 'bg-card border-border'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{typeEmoji[event.type] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{event.title}</p>
                    {event.description && <p className="text-xs mt-1 opacity-80">{event.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                      <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                      <span className="capitalize">· {event.type}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(event)} className="p-1.5 rounded hover:bg-white/40" title="Editar"><Pencil size={14} /></button>
                    <button onClick={() => { if (confirm('¿Eliminar evento?')) deleteEvent(event.id); }} className="p-1.5 rounded hover:bg-white/40" title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3">Próximos eventos</h3>
        <div className="space-y-2">
          {events
            .filter(e => e.date > selectedDate)
            .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
            .slice(0, 5)
            .map(event => (
              <button key={event.id} onClick={() => setSelectedDate(event.date)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 text-left">
                <span>{typeEmoji[event.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · {event.time}</p>
                </div>
              </button>
            ))}
          {events.filter(e => e.date > selectedDate).length === 0 && (
            <p className="text-xs text-muted-foreground">No hay eventos próximos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
