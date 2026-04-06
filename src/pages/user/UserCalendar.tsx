import { useState } from 'react';
import { motion } from 'framer-motion';
import { calendarEvents, CalendarEvent } from '@/data/mockData';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

export default function UserCalendar() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);

  const eventsOnDate = calendarEvents.filter(e => e.date === selectedDate);

  // Generate week days
  const getWeekDays = () => {
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const typeColors: Record<string, string> = {
    terapia: 'bg-purple-100 text-purple-700 border-purple-200',
    escuela: 'bg-blue-100 text-blue-700 border-blue-200',
    personal: 'bg-amber-100 text-amber-700 border-amber-200',
    médico: 'bg-red-100 text-red-700 border-red-200',
    social: 'bg-green-100 text-green-700 border-green-200',
    actividad: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  const typeEmoji: Record<string, string> = {
    terapia: '🧠', escuela: '📚', personal: '🎵', médico: '🏥', social: '👥', actividad: '⭐',
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Calendario</h2>
        <p className="text-muted-foreground text-sm">{monthNames[today.getMonth()]} {today.getFullYear()}</p>
      </div>

      {/* Horizontal date picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {weekDays.map(d => {
          const ds = d.toISOString().split('T')[0];
          const isToday = ds === today.toISOString().split('T')[0];
          const isSelected = ds === selectedDate;
          const hasEvents = calendarEvents.some(e => e.date === ds);
          return (
            <button
              key={ds}
              onClick={() => setSelectedDate(ds)}
              className={`flex flex-col items-center min-w-[52px] py-2 px-3 rounded-xl border transition-all ${isSelected ? 'gradient-primary text-primary-foreground border-transparent' : isToday ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/30'}`}
            >
              <span className="text-[10px] uppercase">{dayNames[d.getDay()]}</span>
              <span className="text-lg font-bold">{d.getDate()}</span>
              {hasEvents && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Events */}
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3">
          {selectedDate === today.toISOString().split('T')[0] ? 'Hoy' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        {eventsOnDate.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-3xl mb-2">📅</p>
            <p>No hay eventos para este día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {eventsOnDate.sort((a, b) => a.time.localeCompare(b.time)).map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-xl border ${typeColors[event.type] || 'bg-card border-border'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{typeEmoji[event.type] || '📌'}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{event.title}</p>
                    <p className="text-xs mt-1 opacity-80">{event.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                      <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                    </div>
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
          {calendarEvents
            .filter(e => e.date > selectedDate)
            .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
            .slice(0, 5)
            .map(event => (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                <span>{typeEmoji[event.type]}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · {event.time}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
