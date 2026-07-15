import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import ProfessionalPrivateNote from "@/components/ProfessionalPrivateNote";
import {
  createProfessionalSession,
  deleteProfessionalSession,
  fetchProfessionalSessions,
  updateProfessionalSession,
  type ProfessionalSession,
  type User,
} from "@/data/api";

export type AgendaPatient = User & { pertenecienteId: number };

type SessionForm = {
  id?: number;
  id_perteneciente: string;
  titulo: string;
  fecha: string;
  hora: string;
  duracion_minutos: string;
  estado: ProfessionalSession["estado"];
  recurrence_frequency:
    | "none"
    | "weekly"
    | "twice_weekly"
    | "biweekly"
    | "monthly";
  recurrence_count: string;
};

const emptyForm = (): SessionForm => ({
  id_perteneciente: "",
  titulo: "Sesion profesional",
  fecha: new Date().toISOString().slice(0, 10),
  hora: "09:00",
  duracion_minutos: "60",
  estado: "programada",
  recurrence_frequency: "none",
  recurrence_count: "8",
});

const recurrenceLabels: Record<SessionForm["recurrence_frequency"], string> = {
  none: "No se repite",
  weekly: "Una vez por semana",
  twice_weekly: "Dos veces por semana",
  biweekly: "Una vez cada 2 semanas",
  monthly: "Una vez por mes",
};

export default function ProfessionalAgenda({
  patients,
  initialPatientId,
}: {
  patients: AgendaPatient[];
  initialPatientId?: number;
}) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SessionForm | null>(null);
  const [noteSession, setNoteSession] = useState<ProfessionalSession | null>(
    null,
  );

  const load = async () => {
    setLoading(true);
    try {
      setSessions(await fetchProfessionalSessions());
    } catch {
      toast({ title: "No se pudo cargar la agenda", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const patientById = useMemo(
    () =>
      new Map(patients.map((patient) => [patient.pertenecienteId, patient])),
    [patients],
  );
  const visibleSessions = sessions.filter((session) =>
    patientById.has(Number(session.id_perteneciente)),
  );

  const openCreate = () =>
    setForm({
      ...emptyForm(),
      id_perteneciente: initialPatientId ? String(initialPatientId) : "",
    });
  const openEdit = (session: ProfessionalSession) => {
    const date = new Date(session.fecha_sesion);
    setForm({
      id: session.id,
      id_perteneciente: String(session.id_perteneciente),
      titulo: session.titulo,
      fecha: date.toISOString().slice(0, 10),
      hora: date.toTimeString().slice(0, 5),
      duracion_minutos: String(session.duracion_minutos),
      estado: session.estado,
      recurrence_frequency: "none",
      recurrence_count: "1",
    });
  };

  const submit = async () => {
    if (!form?.id_perteneciente || !form.titulo.trim()) return;
    setSaving(true);
    try {
      const payload = {
        id_perteneciente: Number(form.id_perteneciente),
        titulo: form.titulo.trim(),
        fecha_sesion: new Date(`${form.fecha}T${form.hora}:00`).toISOString(),
        duracion_minutos: Number(form.duracion_minutos),
        estado: form.estado,
        recordatorios: [],
        recurrence_rule:
          form.id || form.recurrence_frequency === "none"
            ? { frequency: "none" as const }
            : {
                frequency: form.recurrence_frequency,
                count: Number(form.recurrence_count),
              },
      };
      if (form.id) await updateProfessionalSession(form.id, payload);
      else await createProfessionalSession(payload);
      toast({
        title: form.id
          ? "Sesion actualizada"
          : form.recurrence_frequency === "none"
            ? "Sesion programada"
            : "Sesiones recurrentes programadas",
      });
      setForm(null);
      await load();
    } catch (error) {
      toast({
        title: "No se pudo guardar la sesion",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (noteSession)
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setNoteSession(null)}>
          ← Volver a la agenda
        </Button>
        <div>
          <h2 className="font-heading text-xl font-bold">
            Nota privada · {noteSession.titulo}
          </h2>
          <p className="text-sm text-muted-foreground">
            {patientById.get(Number(noteSession.id_perteneciente))?.name} · Solo
            vos podés leer esta nota.
          </p>
        </div>
        <ProfessionalPrivateNote session={noteSession} />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Agenda y sesiones</h2>
          <p className="text-sm text-muted-foreground">
            Sesiones vinculadas a pacientes autorizados
          </p>
        </div>
        <Button onClick={openCreate} disabled={!patients.length}>
          <Plus size={15} className="mr-2" />
          Nueva sesion
        </Button>
      </div>

      {form && (
        <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">
              {form.id ? "Editar sesion" : "Programar sesion"}
            </h3>
            <button onClick={() => setForm(null)}>
              <X size={16} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Paciente</Label>
              <Select
                value={form.id_perteneciente}
                onValueChange={(value) =>
                  setForm(
                    (prev) => prev && { ...prev, id_perteneciente: value },
                  )
                }
                disabled={Boolean(form.id)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem
                      key={patient.pertenecienteId}
                      value={String(patient.pertenecienteId)}
                    >
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Titulo</Label>
              <Input
                value={form.titulo}
                onChange={(event) =>
                  setForm(
                    (prev) => prev && { ...prev, titulo: event.target.value },
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.fecha}
                onChange={(event) =>
                  setForm(
                    (prev) => prev && { ...prev, fecha: event.target.value },
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input
                type="time"
                value={form.hora}
                onChange={(event) =>
                  setForm(
                    (prev) => prev && { ...prev, hora: event.target.value },
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Duracion</Label>
              <Select
                value={form.duracion_minutos}
                onValueChange={(value) =>
                  setForm(
                    (prev) => prev && { ...prev, duracion_minutos: value },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[30, 45, 60, 90, 120].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value} minutos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.estado}
                onValueChange={(value) =>
                  setForm(
                    (prev) =>
                      prev && {
                        ...prev,
                        estado: value as ProfessionalSession["estado"],
                      },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programada">Programada</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!form.id && (
              <>
                <div className="space-y-2">
                  <Label>Repeticion</Label>
                  <Select
                    value={form.recurrence_frequency}
                    onValueChange={(value) =>
                      setForm(
                        (prev) =>
                          prev && {
                            ...prev,
                            recurrence_frequency:
                              value as SessionForm["recurrence_frequency"],
                          },
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(recurrenceLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {form.recurrence_frequency !== "none" && (
                  <div className="space-y-2">
                    <Label>Cantidad de sesiones</Label>
                    <Input
                      type="number"
                      min={1}
                      max={52}
                      value={form.recurrence_count}
                      onChange={(event) =>
                        setForm(
                          (prev) =>
                            prev && {
                              ...prev,
                              recurrence_count: event.target.value,
                            },
                        )
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <Button
            className="w-full"
            onClick={submit}
            disabled={saving || !form.id_perteneciente}
          >
            <Save size={15} className="mr-2" />
            {saving ? "Guardando..." : "Guardar sesion"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border p-8 text-muted-foreground">
          <Loader2 className="mr-2 animate-spin" size={18} />
          Cargando sesiones...
        </div>
      ) : visibleSessions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <CalendarDays className="mx-auto mb-2 text-primary" />
          <p className="font-medium">Todavia no hay sesiones programadas</p>
          <p className="text-sm text-muted-foreground">
            Crea una sesion para un paciente con permiso de agenda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleSessions.map((session) => {
            const patient = patientById.get(Number(session.id_perteneciente));
            const date = new Date(session.fecha_sesion);
            const recurrenceLabel =
              session.recurrence_group_id && session.recurrence_rule?.frequency
                ? recurrenceLabels[session.recurrence_rule.frequency]
                : null;
            return (
              <div key={session.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{session.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient?.name} ·{" "}
                      {date.toLocaleString("es-AR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {session.duracion_minutos} min
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize">
                        {session.estado}
                      </span>
                      {recurrenceLabel && (
                        <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                          {recurrenceLabel} · #
                          {Number(session.recurrence_index || 0) + 1}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNoteSession(session)}
                    >
                      <FileText size={14} className="mr-2" />
                      Nota privada
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(session)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        if (!window.confirm("¿Eliminar esta sesion?")) return;
                        await deleteProfessionalSession(session.id);
                        await load();
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
