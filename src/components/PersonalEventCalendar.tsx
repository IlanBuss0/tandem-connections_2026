import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { eventTypes, typeColor, typeEmoji } from "@/contexts/CalendarContext";
import ReminderPicker from "@/components/ReminderPicker";
import { useToast } from "@/components/ui/use-toast";
import type { CalendarEvent } from "@/data/api";

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const diasSemanaOrdenCalendario = [1, 2, 3, 4, 5, 6, 0];

const PATIENT_MARKER = /\s*\[paciente:([^\]]+)\]\s*/;

function fmt(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function labelDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function encodePatientLink(description: string, patientId: string | null) {
  const clean = description.replace(PATIENT_MARKER, "").trim();
  if (!patientId) return clean;
  return clean ? `${clean} [paciente:${patientId}]` : `[paciente:${patientId}]`;
}

export function decodePatientLink(description: string) {
  const match = description.match(PATIENT_MARKER);
  return {
    patientId: match?.[1] || "",
    cleanDescription: description.replace(PATIENT_MARKER, "").trim(),
  };
}

export type ReadOnlyDayItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  badgeLabel: string;
  badgeClassName: string;
};

export default function PersonalEventCalendar({
  heading,
  events,
  onCreate,
  onUpdate,
  onDelete,
  patients,
  readOnlyItemsForDate,
  readOnlyHint,
  loading,
  headerAction,
}: {
  heading: string;
  events: CalendarEvent[];
  onCreate: (data: Omit<CalendarEvent, "id" | "userId" | "color">) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Omit<CalendarEvent, "id" | "userId">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** Si se pasa, el formulario ofrece vincular el evento a un paciente (Profesional). */
  patients?: { id: string; name: string }[];
  /** Elementos de solo lectura para un día (ej: sesiones de Profesional, gestionadas desde Agenda). */
  readOnlyItemsForDate?: (dateKey: string) => ReadOnlyDayItem[];
  readOnlyHint?: string;
  loading?: boolean;
  /** Acción secundaria en el header, ej. "Ir a agenda" (Profesional). */
  headerAction?: { label: string; onClick: () => void };
}) {
  const { toast } = useToast();
  const today = new Date();
  const todayKey = fmt(today);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    date: string;
    time: string;
    type: string;
    description: string;
    reminders: number[];
    patientId: string;
  }>({
    title: "",
    date: todayKey,
    time: "09:00",
    type: eventTypes[0],
    description: "",
    reminders: [],
    patientId: "",
  });

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
        return { day, key: fmt(new Date(year, month, day)) };
      }),
    };
  }, [cursor]);

  const selectedDayEvents = useMemo(
    () => [...(eventsByDate[selectedDate] || [])].sort((a, b) => a.time.localeCompare(b.time)),
    [eventsByDate, selectedDate],
  );
  const selectedDayReadOnly = readOnlyItemsForDate?.(selectedDate) || [];
  const monthLabel = `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const goToMonth = (offset: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
    setCursor(next);
    setSelectedDate(fmt(next));
  };

  const goToToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  };

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

  const openCreate = (date = selectedDate) => {
    setEditing(null);
    setForm({ title: "", date, time: "09:00", type: eventTypes[0], description: "", reminders: [], patientId: "" });
    setShowForm(true);
  };

  const openEdit = (event: CalendarEvent) => {
    const { patientId, cleanDescription } = decodePatientLink(event.description || "");
    setEditing(event);
    setForm({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      description: cleanDescription,
      reminders: event.reminders || [],
      patientId,
    });
    setShowForm(true);
  };

  const submit = async () => {
    const title = form.title.trim();
    if (!title) return;
    const description = patients
      ? encodePatientLink(form.description, form.patientId || null)
      : form.description;
    const payload = {
      title,
      date: form.date,
      time: form.time,
      type: form.type,
      description,
      reminders: form.reminders,
    };
    setSaving(true);
    try {
      if (editing) await onUpdate(editing.id, payload);
      else await onCreate(payload);
      setShowForm(false);
      setSelectedDate(form.date);
      const formDate = new Date(`${form.date}T12:00:00`);
      setCursor(new Date(formDate.getFullYear(), formDate.getMonth(), 1));
    } catch (error) {
      toast({
        title: "No se pudo guardar el evento",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (eventId: string) => {
    if (!confirm("¿Eliminar evento?")) return;
    try {
      await onDelete(eventId);
    } catch {
      toast({ title: "No se pudo eliminar el evento", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vista mensual</p>
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{heading}</h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {headerAction && (
            <button
              onClick={headerAction.onClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              {headerAction.label}
            </button>
          )}
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition active:scale-95"
          >
            <Plus size={17} />
            Evento
          </button>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full rounded-3xl border border-border bg-card p-3 shadow-sm sm:p-5"
      >
        <div className="mb-4 flex flex-col items-center gap-1.5">
          <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2">
            <button
              onClick={() => goToMonth(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center justify-center gap-0">
              <select
                value={cursor.getMonth()}
                onChange={handleMonthChange}
                className="cursor-pointer appearance-none rounded-full bg-transparent px-3 py-1.5 text-sm font-bold text-foreground outline-none transition hover:bg-muted sm:text-base"
              >
                {monthNames.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <select
                value={cursor.getFullYear()}
                onChange={handleYearChange}
                className="cursor-pointer appearance-none rounded-full bg-transparent px-3 py-1.5 text-sm font-bold text-foreground outline-none transition hover:bg-muted sm:text-base"
              >
                {Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => goToMonth(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Hoy
          </button>
        </div>

        <div translate="no" className="notranslate mb-2 grid grid-cols-7 gap-1 sm:gap-2">
          {diasSemanaOrdenCalendario.map((dayIndex) => (
            <div key={dayIndex} translate="no" className="notranslate py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {diasSemana[dayIndex]}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {monthDays.leadingBlanks.map((blank) => (
            <div key={`blank-${blank}`} aria-hidden className="min-h-[54px] sm:min-h-[86px]" />
          ))}

          {monthDays.days.map(({ day, key }) => {
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const dayEvents = eventsByDate[key] || [];
            const dayReadOnly = readOnlyItemsForDate?.(key) || [];
            const hasItems = dayEvents.length > 0 || dayReadOnly.length > 0;

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                onDoubleClick={() => openCreate(key)}
                className={`relative flex min-h-[54px] flex-col rounded-2xl border p-1.5 text-left transition-all duration-200 sm:min-h-[86px] sm:p-2 ${
                  isToday
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : isSelected
                      ? "border-primary/40 bg-primary/10 text-foreground shadow-sm"
                      : hasItems
                        ? "border-border bg-muted/40 text-foreground hover:border-primary/30"
                        : "border-transparent bg-muted/20 text-foreground hover:bg-muted/40"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold leading-none sm:text-base ${
                    isToday ? "bg-white/20 text-primary-foreground" : ""
                  }`}
                >
                  {day}
                </span>

                {hasItems && (
                  <div className="mt-auto min-w-0 pt-2">
                    <div className="hidden flex-col gap-1 overflow-hidden sm:flex">
                      {dayReadOnly.slice(0, 2 - Math.min(dayEvents.length, 2)).map((item) => (
                        <span
                          key={item.id}
                          className={`truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isToday ? "bg-white/20 text-primary-foreground" : item.badgeClassName
                          }`}
                        >
                          {item.badgeLabel} {item.title}
                        </span>
                      ))}
                      {dayEvents.slice(0, 2).map((event) => (
                        <span
                          key={event.id}
                          className={`truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isToday ? "bg-white/20 text-primary-foreground" : "bg-background text-foreground"
                          }`}
                        >
                          {typeEmoji[event.type] || "📅"} {event.title}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-0.5 sm:hidden">
                      {Array.from({ length: Math.min(3, dayEvents.length + dayReadOnly.length) }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full ${isToday ? "bg-white" : "bg-primary"}`}
                        />
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
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-foreground">{editing ? "Editar evento" : "Nuevo evento"}</h3>
              <button
                onClick={() => setShowForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Título del evento"
                className="w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  className="min-w-0 rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                  className="min-w-0 rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>{typeEmoji[type]} {type}</option>
                ))}
              </select>
              {patients && (
                <select
                  value={form.patientId}
                  onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Sin vincular a un paciente</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.name}</option>
                  ))}
                </select>
              )}
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Descripción (opcional)"
                className="h-20 w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
              <ReminderPicker value={form.reminders} onChange={(reminders) => setForm((current) => ({ ...current, reminders }))} />
              <button
                onClick={submit}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editing ? "Guardar cambios" : "Crear evento"}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="min-w-0 max-w-full rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {selectedDate === todayKey ? "Hoy" : labelDate(selectedDate)}
            </p>
            <h3 className="font-heading text-xl font-bold text-foreground sm:text-2xl">Actividades del día</h3>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
            <button
              onClick={() => openCreate(selectedDate)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/70"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>
        </div>

        {selectedDayReadOnly.length > 0 && (
          <div className="mt-5 space-y-2">
            {selectedDayReadOnly.map((item) => (
              <div key={item.id} className="rounded-2xl border border-dashed border-border bg-muted/30 p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${item.badgeClassName}`}>
                    {item.badgeLabel}
                  </span>
                </div>
              </div>
            ))}
            {readOnlyHint && <p className="px-1 text-xs text-muted-foreground">{readOnlyHint}</p>}
          </div>
        )}

        {selectedDayEvents.length === 0 && selectedDayReadOnly.length === 0 ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
            <CalendarDays size={34} className="text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">No hay actividades para este día</p>
          </div>
        ) : (
          selectedDayEvents.length > 0 && (
            <div className="mt-5 min-w-0 max-w-full space-y-3">
              {selectedDayEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="group min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex min-w-0 max-w-full items-start gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: `${typeColor[event.type] || "hsl(var(--primary))"}22` }}
                    >
                      {typeEmoji[event.type] || "📅"}
                    </span>
                    <div className="min-w-0 max-w-full flex-1">
                      <p className="max-w-full whitespace-normal text-sm font-bold [overflow-wrap:anywhere]">{event.title}</p>
                      {decodePatientLink(event.description || "").cleanDescription && (
                        <p className="mt-1 max-w-full whitespace-normal text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                          {decodePatientLink(event.description).cleanDescription}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                        <span className="capitalize">{event.type}</span>
                        {patients && decodePatientLink(event.description || "").patientId && (
                          <span className="text-primary">
                            {patients.find((p) => p.id === decodePatientLink(event.description).patientId)?.name || "Paciente"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <button onClick={() => openEdit(event)} className="rounded-full p-1.5 hover:bg-muted" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(event.id)} className="rounded-full p-1.5 hover:bg-muted" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </motion.section>
    </div>
  );
}
