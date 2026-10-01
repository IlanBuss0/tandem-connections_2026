import { useMemo, useState } from "react";
import { AlertTriangle, Lock, Search } from "lucide-react";
import { recurrenceLabels, type RecurrenceFrequency } from "@/lib/sessionRecurrence";
import { initials, longDate, MAX_PATIENT_CHIPS, visiblePatients } from "@/lib/agendaFormat";
import { findOverlappingSession } from "@/lib/sessionOverlap";
import type { ProfessionalSession, User } from "@/data/api";
import {
  AgendaSheet,
  CollapsibleBlock,
  PickerField,
  SheetChip,
  SheetLabel,
  SheetSubmit,
  Stepper,
  sheetInputClass,
} from "@/components/agenda/AgendaSheet";

export type AgendaPatient = User & { pertenecienteId: number };

export type SessionForm = {
  id?: number;
  id_perteneciente: string;
  titulo: string;
  fecha: string;
  hora: string;
  duracion_minutos: string;
  estado: ProfessionalSession["estado"];
  motivo_cancelacion: string;
  recurrence_frequency: RecurrenceFrequency;
  recurrence_count: string;
};

const DURATIONS = [30, 45, 60, 90, 120];
const STATES: { value: ProfessionalSession["estado"]; label: string }[] = [
  { value: "programada", label: "Programada" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "ausente", label: "Ausente (no se presentó)" },
];

const plain = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
/** Hoja chica con la lista completa de pacientes y buscador. */
export function PatientPickerSheet({ patients, onPick, onClose }: { patients: AgendaPatient[]; onPick: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const matches = patients.filter((patient) => plain(patient.name).includes(plain(query.trim())));
  return (
    <AgendaSheet title="Elegir paciente" onClose={onClose} small>
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre"
          aria-label="Buscar paciente por nombre"
          className={`${sheetInputClass} pl-11`}
        />
      </div>
      <ul className="divide-y divide-border/60">
        {matches.map((patient) => (
          <li key={patient.pertenecienteId}>
            <button
              type="button"
              onClick={() => onPick(String(patient.pertenecienteId))}
              className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-base font-bold text-[#2b2145] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-extrabold text-primary" aria-hidden>{initials(patient.name)}</span>
              {patient.name}
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className="py-4 text-sm text-muted-foreground">No hay pacientes con ese nombre.</li>}
      </ul>
    </AgendaSheet>
  );
}

/** Chips de paciente: hasta 4 completos; con más, 4 + "Ver más". */
export function PatientChips({ patients, value, onChange }: { patients: AgendaPatient[]; value: string; onChange: (id: string) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const visible = useMemo(() => visiblePatients(patients, value), [patients, value]);

  return (
    <div>
      <SheetLabel>Paciente</SheetLabel>
      <div className="flex flex-wrap gap-2">
        {visible.map((patient) => (
          <SheetChip key={patient.pertenecienteId} selected={String(patient.pertenecienteId) === value} onClick={() => onChange(String(patient.pertenecienteId))}>
            {patient.name}
          </SheetChip>
        ))}
        {patients.length > MAX_PATIENT_CHIPS && (
          <SheetChip selected={false} onClick={() => setPickerOpen(true)}>Ver más</SheetChip>
        )}
      </div>
      {pickerOpen && (
        <PatientPickerSheet
          patients={patients}
          onClose={() => setPickerOpen(false)}
          onPick={(id) => { onChange(id); setPickerOpen(false); }}
        />
      )}
    </div>
  );
}

/** Programar / editar sesión. Se monta solo mientras está abierta. */
export default function SessionFormSheet({
  form,
  setForm,
  patients,
  sessions,
  saving,
  onSubmit,
  onClose,
}: {
  form: SessionForm;
  setForm: (update: (prev: SessionForm) => SessionForm) => void;
  patients: AgendaPatient[];
  /** Todas las sesiones, para avisar superposiciones. */
  sessions: ProfessionalSession[];
  saving: boolean;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const set = <K extends keyof SessionForm>(key: K, value: SessionForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const editing = Boolean(form.id);
  const patient = patients.find((item) => String(item.pertenecienteId) === form.id_perteneciente);
  const patientName = (id: number) => patients.find((item) => item.pertenecienteId === Number(id))?.name || "otro paciente";

  const overlapSession = form.fecha && form.hora
    ? findOverlappingSession(sessions, {
        id: form.id,
        fecha_sesion: new Date(`${form.fecha}T${form.hora}:00`).toISOString(),
        duracion_minutos: Number(form.duracion_minutos) || 0,
      })
    : undefined;

  const repeatSummary = form.recurrence_frequency === "none"
    ? recurrenceLabels.none
    : `${recurrenceLabels[form.recurrence_frequency]} · ${form.recurrence_count} sesiones`;

  return (
    <AgendaSheet
      title={editing ? "Editar sesión" : "Programar sesión"}
      onClose={() => !saving && onClose()}
      footer={
        <SheetSubmit
          label={saving ? "Guardando..." : editing ? "Guardar sesión" : "Programar sesión"}
          disabled={saving || !form.id_perteneciente || !form.titulo.trim()}
          onClick={onSubmit}
        />
      }
    >
      {overlapSession && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
          <p>
            Se superpone con «{overlapSession.titulo}» de {patientName(overlapSession.id_perteneciente)} a las{" "}
            {new Date(overlapSession.fecha_sesion).toTimeString().slice(0, 5)}.
          </p>
        </div>
      )}

      {editing ? (
        <div>
          <SheetLabel>Paciente</SheetLabel>
          <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-primary/10 px-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0f2fb] text-xs font-extrabold text-[#0c5a86]" aria-hidden>{initials(patient?.name || "")}</span>
            <span className="flex-1 text-base font-bold text-[#2b2145]">{patient?.name || "Paciente"}</span>
            <Lock size={18} className="text-primary" aria-hidden />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">El paciente no se puede cambiar.</p>
        </div>
      ) : (
        <PatientChips patients={patients} value={form.id_perteneciente} onChange={(id) => set("id_perteneciente", id)} />
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-extrabold text-[#2b2145]">Título</span>
        <input value={form.titulo} onChange={(event) => set("titulo", event.target.value)} className={sheetInputClass} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <PickerField label="Día" type="date" value={form.fecha} display={form.fecha ? longDate(form.fecha) : ""} onChange={(value) => set("fecha", value)} />
        <PickerField label="Hora" type="time" value={form.hora} display={form.hora} onChange={(value) => set("hora", value)} />
      </div>

      <div>
        <SheetLabel>Duración</SheetLabel>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((minutes) => (
            <SheetChip key={minutes} selected={form.duracion_minutos === String(minutes)} onClick={() => set("duracion_minutos", String(minutes))}>
              {minutes} min
            </SheetChip>
          ))}
        </div>
      </div>

      {editing && (
        <>
          <div>
            <SheetLabel>Estado</SheetLabel>
            <div className="flex flex-wrap gap-2">
              {STATES.map((state) => (
                <SheetChip key={state.value} selected={form.estado === state.value} onClick={() => set("estado", state.value)}>
                  {state.label}
                </SheetChip>
              ))}
            </div>
          </div>
          {form.estado === "cancelada" && (
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-[#2b2145]">Motivo de la cancelación (opcional)</span>
              <input
                value={form.motivo_cancelacion}
                maxLength={240}
                onChange={(event) => set("motivo_cancelacion", event.target.value)}
                placeholder="Ej: el paciente reprogramó por enfermedad"
                className={sheetInputClass}
              />
              <span className="mt-1.5 block text-sm text-muted-foreground">Hasta 240 caracteres.</span>
            </label>
          )}
        </>
      )}

      {!editing && (
        <CollapsibleBlock title="Repetición" summary={repeatSummary}>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(recurrenceLabels) as [RecurrenceFrequency, string][]).map(([value, label]) => (
              <SheetChip key={value} selected={form.recurrence_frequency === value} onClick={() => set("recurrence_frequency", value)}>
                {label}
              </SheetChip>
            ))}
          </div>
          {form.recurrence_frequency !== "none" && (
            <div>
              <Stepper
                label="Cantidad de sesiones"
                value={Number(form.recurrence_count) || 1}
                min={1}
                max={52}
                onChange={(value) => set("recurrence_count", String(value))}
              />
              <p className="mt-1 text-sm text-muted-foreground">Entre 1 y 52.</p>
            </div>
          )}
        </CollapsibleBlock>
      )}
    </AgendaSheet>
  );
}
