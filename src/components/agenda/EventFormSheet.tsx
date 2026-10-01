import { useState } from "react";
import { eventTypes } from "@/contexts/CalendarContext";
import ReminderPicker, { reminderChoices } from "@/components/ReminderPicker";
import { decodePatientLink, encodePatientLink } from "@/components/PersonalEventCalendar";
import type { CalendarEvent } from "@/data/api";
import {
  AgendaSheet,
  CollapsibleBlock,
  PickerField,
  SheetChip,
  SheetLabel,
  SheetSubmit,
  sheetInputClass,
} from "@/components/agenda/AgendaSheet";
import { longDate } from "@/lib/agendaFormat";

export type EventPayload = Omit<CalendarEvent, "id" | "userId" | "color">;

/** Crear / editar evento personal. Se monta solo mientras está abierta. */
export default function EventFormSheet({
  editing,
  date,
  patients,
  personLabel = "Paciente (opcional)",
  noPersonLabel = "Sin paciente",
  saving,
  onSave,
  onClose,
}: {
  editing: CalendarEvent | null;
  /** Día inicial al crear. */
  date: string;
  patients: { id: string; name: string }[];
  personLabel?: string;
  noPersonLabel?: string;
  saving: boolean;
  onSave: (payload: EventPayload) => void;
  onClose: () => void;
}) {
  const decoded = editing ? decodePatientLink(editing.description || "") : null;
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    date: editing?.date ?? date,
    time: editing?.time ?? "09:00",
    type: editing?.type ?? eventTypes[0],
    description: decoded?.cleanDescription ?? "",
    reminders: editing?.reminders ?? [],
    patientId: decoded?.patientId ?? "",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const title = form.title.trim();
    if (!title) return;
    onSave({
      title,
      date: form.date,
      time: form.time,
      type: form.type,
      description: encodePatientLink(form.description, form.patientId || null),
      reminders: form.reminders,
    });
  };

  const reminderSummary = form.reminders.length
    ? form.reminders.map((value) => reminderChoices.find((choice) => choice.value === value)?.label ?? `${value} min`).join(", ")
    : "Sin recordatorio";

  return (
    <AgendaSheet
      title={editing ? "Editar evento" : "Nuevo evento"}
      onClose={() => !saving && onClose()}
      footer={<SheetSubmit label={saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear evento"} disabled={saving || !form.title.trim()} onClick={submit} />}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-extrabold text-[#2b2145]">Título</span>
        <input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Título del evento" className={sheetInputClass} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <PickerField label="Día" type="date" value={form.date} display={form.date ? longDate(form.date) : ""} onChange={(value) => set("date", value)} />
        <PickerField label="Hora" type="time" value={form.time} display={form.time} onChange={(value) => set("time", value)} />
      </div>

      <div>
        <SheetLabel>Tipo</SheetLabel>
        <div className="flex flex-wrap gap-2">
          {eventTypes.map((type) => (
            <SheetChip key={type} selected={form.type === type} onClick={() => set("type", type)}>
              <span className="capitalize">{type}</span>
            </SheetChip>
          ))}
        </div>
      </div>

      <div>
        <SheetLabel>{personLabel}</SheetLabel>
        <div className="flex flex-wrap gap-2">
          <SheetChip selected={!form.patientId} onClick={() => set("patientId", "")}>{noPersonLabel}</SheetChip>
          {patients.map((patient) => (
            <SheetChip key={patient.id} selected={form.patientId === patient.id} onClick={() => set("patientId", patient.id)}>
              {patient.name}
            </SheetChip>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-extrabold text-[#2b2145]">Descripción (opcional)</span>
        <textarea
          value={form.description}
          onChange={(event) => set("description", event.target.value)}
          className="h-24 w-full resize-none rounded-2xl border border-primary/20 bg-primary/5 p-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <CollapsibleBlock title="Recordatorios" summary={reminderSummary}>
        <ReminderPicker value={form.reminders} onChange={(reminders) => set("reminders", reminders)} />
      </CollapsibleBlock>
    </AgendaSheet>
  );
}
