import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { GeneratedReport } from "@/data/api";
import { AgendaSheet, PickerField, SheetChip, SheetLabel } from "@/components/agenda/AgendaSheet";
import { PatientChips, type AgendaPatient } from "@/components/agenda/SessionFormSheet";
import { useToast } from "@/components/ui/use-toast";
import { saveBlob } from "@/lib/downloadBlob";
import { PERIODS, periodDates, reportsInPeriod, type ReportPeriod } from "@/lib/reportPeriod";
import { buildReportsPdf, pdfDate, reportsPdfFilename } from "@/lib/reportsPdf";
import { longDate } from "@/lib/agendaFormat";

export type DownloadPerson = { id: number; name: string }; // id = id_perteneciente

/** Elegir persona + período y bajar todo en un solo PDF. Compartida por tutor y profesional. */
export default function DownloadReportsSheet({ people, reports, initialPersonId, personLabel, byline, onClose }: {
  people: DownloadPerson[];
  reports: GeneratedReport[];
  initialPersonId?: number;
  /** "¿De quién?" (tutor) | "Paciente" (profesional). */
  personLabel: string;
  byline: (report: GeneratedReport) => string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [personId, setPersonId] = useState(initialPersonId ?? people[0]?.id);
  const [period, setPeriod] = useState<ReportPeriod>("all");
  const [range, setRange] = useState({ from: "", to: "" });
  const [busy, setBusy] = useState(false);
  const selection = useMemo(() => reportsInPeriod(reports, personId, period, range), [reports, personId, period, range]);
  const person = people.find((entry) => entry.id === personId);
  const firstName = person?.name.split(" ")[0] ?? "";
  const customIncomplete = period === "custom" && (!range.from || !range.to);
  const periodLabel = period === "custom" && !customIncomplete
    ? `Del ${pdfDate(`${range.from}T12:00:00`)} al ${pdfDate(`${range.to}T12:00:00`)}`
    : PERIODS.find((entry) => entry.value === period)!.label;
  const chipPeople = useMemo(() => people.map((entry) => ({ pertenecienteId: entry.id, name: entry.name }) as AgendaPatient), [people]);

  const download = async () => {
    if (!person || !selection.length || customIncomplete) return;
    setBusy(true);
    try {
      const blob = await buildReportsPdf({ heading: `Reportes de ${person.name}`, periodLabel, reports: selection, byline });
      saveBlob(blob, reportsPdfFilename(person.name, periodDates(period, range)));
      onClose();
    } catch {
      toast({ title: "No pudimos armar el PDF", description: "Intentá nuevamente.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AgendaSheet
      title="Descargar reportes"
      subtitle="Todos en un solo PDF"
      onClose={() => !busy && onClose()}
      footer={
        <button type="button" onClick={download} disabled={busy || !selection.length || customIncomplete} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-base font-bold text-primary-foreground shadow-md transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50">
          {busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Download size={18} aria-hidden />}
          {busy ? "Armando el PDF…" : "Descargar PDF"}
        </button>
      }
    >
      {people.length > 1 && <PatientChips patients={chipPeople} value={String(personId)} onChange={(id) => setPersonId(Number(id))} label={personLabel} />}
      <div>
        <SheetLabel>¿De qué período?</SheetLabel>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((entry) => <SheetChip key={entry.value} selected={period === entry.value} onClick={() => setPeriod(entry.value)}>{entry.label}</SheetChip>)}
        </div>
      </div>
      {period === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <PickerField label="Desde" type="date" value={range.from} display={range.from ? longDate(range.from) : "Elegir"} onChange={(from) => setRange((prev) => ({ ...prev, from }))} />
          <PickerField label="Hasta" type="date" value={range.to} display={range.to ? longDate(range.to) : "Elegir"} onChange={(to) => setRange((prev) => ({ ...prev, to }))} />
        </div>
      )}
      <p className="rounded-2xl bg-[#F5EFFC] p-4 text-sm font-semibold text-[#2b2145]" aria-live="polite">
        {customIncomplete
          ? "Elegí las dos fechas."
          : selection.length === 0
            ? `No hay reportes de ${firstName} en ese período.`
            : `Se van a descargar ${selection.length} ${selection.length === 1 ? "reporte" : "reportes"} de ${firstName} en un solo PDF, del más viejo al más nuevo.`}
      </p>
    </AgendaSheet>
  );
}
