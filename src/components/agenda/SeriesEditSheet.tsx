import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { resizeSessionSeries, type ProfessionalSession } from "@/data/api";
import { AgendaSheet, SheetSubmit, Stepper, sheetInputClass } from "@/components/agenda/AgendaSheet";

/** Editar título y cantidad de una serie. Se monta solo mientras está abierta. */
export default function SeriesEditSheet({
  groupId,
  sessions,
  onClose,
  onSeriesChanged,
}: {
  groupId: string;
  /** Todas las sesiones de la serie, ordenadas por fecha ascendente. */
  sessions: ProfessionalSession[];
  onClose: () => void;
  onSeriesChanged: () => void;
}) {
  const { toast } = useToast();
  const first = sessions[0];
  const [titulo, setTitulo] = useState(first.titulo);
  const [count, setCount] = useState(sessions.length);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const trimmedTitulo = titulo.trim();
    if (!trimmedTitulo || !Number.isInteger(count) || count < 1 || count > 52) return;

    const payload: { titulo?: string; count?: number } = {};
    if (trimmedTitulo !== first.titulo) payload.titulo = trimmedTitulo;
    if (count !== sessions.length) payload.count = count;
    if (!Object.keys(payload).length) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const result = await resizeSessionSeries(groupId, payload);
      onClose();
      toast({
        title: "Serie actualizada",
        description:
          result.deletedNotesCount > 0
            ? `Se eliminaron ${result.deletedSessionIds.length} sesiones futuras, ${result.deletedNotesCount} con nota ya escrita.`
            : undefined,
      });
      onSeriesChanged();
    } catch (error) {
      toast({
        title: "No se pudo actualizar la serie",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AgendaSheet
      title="Editar serie"
      onClose={() => !saving && onClose()}
      footer={<SheetSubmit label={saving ? "Guardando..." : "Guardar serie"} disabled={saving || !titulo.trim()} onClick={submit} />}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-extrabold text-[#2b2145]">Título de la serie</span>
        <input value={titulo} onChange={(event) => setTitulo(event.target.value)} className={sheetInputClass} />
      </label>
      <Stepper label="Cantidad total de sesiones" value={count} min={1} max={52} onChange={setCount} />
      <p className="text-sm leading-relaxed text-muted-foreground">
        Si agrandás, se agregan sesiones nuevas al final con el mismo patrón. Si achicás, se borran las últimas — nunca las que ya pasaron.
      </p>
    </AgendaSheet>
  );
}
