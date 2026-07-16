import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Plus,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import SessionCard from "@/components/SessionCard";
import SessionSeriesFolder from "@/components/SessionSeriesFolder";
import { recurrenceLabels } from "@/lib/sessionRecurrence";
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

type AgendaItem =
  | { type: "series"; groupId: string; sessions: ProfessionalSession[]; sortDate: string }
  | { type: "single"; session: ProfessionalSession; sortDate: string };

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

  const agendaItems = useMemo<AgendaItem[]>(() => {
    const seriesMap = new Map<string, ProfessionalSession[]>();
    const standalone: ProfessionalSession[] = [];
    for (const session of visibleSessions) {
      if (session.recurrence_group_id) {
        const list = seriesMap.get(session.recurrence_group_id) || [];
        list.push(session);
        seriesMap.set(session.recurrence_group_id, list);
      } else {
        standalone.push(session);
      }
    }
    const items: AgendaItem[] = [];
    for (const [groupId, list] of seriesMap) {
      const sorted = [...list].sort((a, b) =>
        a.fecha_sesion.localeCompare(b.fecha_sesion),
      );
      items.push({ type: "series", groupId, sessions: sorted, sortDate: sorted[0].fecha_sesion });
    }
    for (const session of standalone) {
      items.push({ type: "single", session, sortDate: session.fecha_sesion });
    }
    return items.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  }, [visibleSessions]);

  const handleDelete = async (session: ProfessionalSession) => {
    if (!window.confirm("¿Eliminar esta sesion?")) return;
    try {
      await deleteProfessionalSession(session.id);
      await load();
    } catch (error) {
      toast({
        title: "No se pudo eliminar la sesion",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

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
      const basePayload = {
        id_perteneciente: Number(form.id_perteneciente),
        titulo: form.titulo.trim(),
        fecha_sesion: new Date(`${form.fecha}T${form.hora}:00`).toISOString(),
        duracion_minutos: Number(form.duracion_minutos),
        estado: form.estado,
        recordatorios: [],
      };
      if (form.id) {
        // No mandar recurrence_rule al editar: el backend preserva la
        // recurrencia existente cuando el campo viene ausente. Si se
        // manda {frequency:"none"} acá, pisa la serie real (bug: el
        // badge de recurrencia queda mostrando "No se repite" en una
        // sesion que sigue perteneciendo a una serie).
        await updateProfessionalSession(form.id, basePayload);
      } else {
        await createProfessionalSession({
          ...basePayload,
          recurrence_rule:
            form.recurrence_frequency === "none"
              ? { frequency: "none" as const }
              : {
                  frequency: form.recurrence_frequency,
                  count: Number(form.recurrence_count),
                },
        });
      }
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
        <ProfessionalPrivateNote
          session={noteSession}
          patientName={patientById.get(Number(noteSession.id_perteneciente))?.name}
        />
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

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form?.id ? "Editar sesion" : "Programar sesion"}
            </DialogTitle>
          </DialogHeader>
          {form && (
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={saving || !form?.id_perteneciente}
            >
              <Save size={15} className="mr-2" />
              {saving ? "Guardando..." : "Guardar sesion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border p-8 text-muted-foreground">
          <Loader2 className="mr-2 animate-spin" size={18} />
          Cargando sesiones...
        </div>
      ) : agendaItems.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <CalendarDays className="mx-auto mb-2 text-primary" />
          <p className="font-medium">Todavia no hay sesiones programadas</p>
          <p className="text-sm text-muted-foreground">
            Crea una sesion para un paciente con permiso de agenda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agendaItems.map((item) =>
            item.type === "series" ? (
              <SessionSeriesFolder
                key={item.groupId}
                groupId={item.groupId}
                sessions={item.sessions}
                patientName={patientById.get(Number(item.sessions[0].id_perteneciente))?.name}
                onOpenNote={setNoteSession}
                onEditSession={openEdit}
                onDeleteSession={handleDelete}
                onSeriesChanged={load}
              />
            ) : (
              <SessionCard
                key={item.session.id}
                session={item.session}
                patientName={patientById.get(Number(item.session.id_perteneciente))?.name}
                onOpenNote={() => setNoteSession(item.session)}
                onEdit={() => openEdit(item.session)}
                onDelete={() => handleDelete(item.session)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
