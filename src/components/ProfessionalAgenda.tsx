import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Loader2,
  Plus,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { findOverlappingSession } from "@/lib/sessionOverlap";
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
  motivo_cancelacion: string;
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
  motivo_cancelacion: "",
  recurrence_frequency: "none",
  recurrence_count: "8",
});

type AgendaItem =
  | { type: "series"; groupId: string; sessions: ProfessionalSession[]; sortDate: string }
  | { type: "single"; session: ProfessionalSession; sortDate: string };

type TimeFilter = "upcoming" | "past" | "all";

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
  const [patientFilter, setPatientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
  const [search, setSearch] = useState("");

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

  useEffect(() => {
    if (initialPatientId) {
      setForm({ ...emptyForm(), id_perteneciente: String(initialPatientId) });
    }
    // Solo se dispara cuando llega un paciente preseleccionado (p.ej. desde
    // "Proponer sesion" en el detalle del paciente) — no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPatientId]);

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

  const sessionMatchesFilters = (session: ProfessionalSession, now: number) => {
    if (patientFilter !== "all" && String(session.id_perteneciente) !== patientFilter) return false;
    if (statusFilter !== "all" && session.estado !== statusFilter) return false;
    if (timeFilter === "upcoming" && new Date(session.fecha_sesion).getTime() < now) return false;
    if (timeFilter === "past" && new Date(session.fecha_sesion).getTime() >= now) return false;
    if (search.trim()) {
      const patientName = patientById.get(Number(session.id_perteneciente))?.name || "";
      const haystack = `${session.titulo} ${patientName}`.toLowerCase();
      if (!haystack.includes(search.trim().toLowerCase())) return false;
    }
    return true;
  };

  const filteredAgendaItems = useMemo(() => {
    const now = Date.now();
    return agendaItems.filter((item) =>
      item.type === "single"
        ? sessionMatchesFilters(item.session, now)
        : item.sessions.some((session) => sessionMatchesFilters(session, now)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agendaItems, patientFilter, statusFilter, timeFilter, search, patientById]);

  const summary = useMemo(() => {
    const now = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);
    const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
    const active = visibleSessions.filter((session) => session.estado !== "cancelada");
    const today = active.filter((session) => session.fecha_sesion.slice(0, 10) === todayStr).length;
    const week = active.filter((session) => {
      const time = new Date(session.fecha_sesion).getTime();
      return time >= now && time <= weekAhead;
    }).length;
    const next = active
      .filter((session) => session.estado === "programada" && new Date(session.fecha_sesion).getTime() >= now)
      .sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion))[0];
    return { today, week, next };
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
      motivo_cancelacion: session.motivo_cancelacion || "",
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
        motivo_cancelacion: form.estado === "cancelada" ? form.motivo_cancelacion.trim() || null : null,
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

  const overlapSession = form && form.fecha && form.hora
    ? findOverlappingSession(sessions, {
        id: form.id,
        fecha_sesion: new Date(`${form.fecha}T${form.hora}:00`).toISOString(),
        duracion_minutos: Number(form.duracion_minutos) || 0,
      })
    : undefined;

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
            {overlapSession && (
              <Alert className="sm:col-span-2 border-amber-300 bg-amber-50 text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  Se superpone con "{overlapSession.titulo}" de{" "}
                  {patientById.get(Number(overlapSession.id_perteneciente))?.name || "otro paciente"} a las{" "}
                  {new Date(overlapSession.fecha_sesion).toTimeString().slice(0, 5)}.
                </AlertDescription>
              </Alert>
            )}
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
                  <SelectItem value="ausente">Ausente (no se presento)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.estado === "cancelada" && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Motivo de la cancelacion (opcional)</Label>
                <Input
                  value={form.motivo_cancelacion}
                  maxLength={240}
                  onChange={(event) =>
                    setForm(
                      (prev) => prev && { ...prev, motivo_cancelacion: event.target.value },
                    )
                  }
                  placeholder="Ej: el paciente reprogramo por enfermedad"
                />
              </div>
            )}
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

      {!loading && visibleSessions.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-xl border bg-muted/30 p-3 text-center sm:grid-cols-3">
          <div>
            <p className="text-lg font-bold">{summary.today}</p>
            <p className="text-xs text-muted-foreground">Hoy</p>
          </div>
          <div>
            <p className="text-lg font-bold">{summary.week}</p>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </div>
          <div>
            <p className="text-sm font-semibold">
              {summary.next
                ? `${new Date(summary.next.fecha_sesion).toTimeString().slice(0, 5)} · ${patientById.get(Number(summary.next.id_perteneciente))?.name || "Paciente"}`
                : "-"}
            </p>
            <p className="text-xs text-muted-foreground">Próxima sesion</p>
          </div>
        </div>
      )}

      {!loading && visibleSessions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Select value={patientFilter} onValueChange={setPatientFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Paciente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los pacientes</SelectItem>
              {patients.map((patient) => (
                <SelectItem key={patient.pertenecienteId} value={String(patient.pertenecienteId)}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="programada">Programada</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
              <SelectItem value="ausente">Ausente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Próximas</SelectItem>
              <SelectItem value="past">Pasadas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por titulo o paciente"
            className="flex-1 min-w-[180px]"
          />
        </div>
      )}

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
      ) : filteredAgendaItems.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <CalendarDays className="mx-auto mb-2 text-primary" />
          <p className="font-medium">Ninguna sesion coincide con los filtros</p>
          <p className="text-sm text-muted-foreground">
            Probá cambiar el periodo o limpiar la busqueda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAgendaItems.map((item) =>
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
