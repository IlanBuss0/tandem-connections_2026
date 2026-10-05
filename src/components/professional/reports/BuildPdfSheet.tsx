import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { AgendaSheet, PickerField, SheetChip, SheetLabel, sheetInputClass } from "@/components/agenda/AgendaSheet";
import { PatientChips, type AgendaPatient } from "@/components/agenda/SessionFormSheet";
import IncludeSwitches, { PDF_SECTIONS } from "@/components/professional/reports/IncludeSwitches";
import PatientMultiChips from "@/components/professional/reports/PatientMultiChips";
import { useToast } from "@/components/ui/use-toast";
import { downloadMonthlyReportPdf, downloadPatientHistoryPdf, fetchProfessionalSessions, type ProfessionalSession, type ReportPdfSection } from "@/data/api";
import { localDateKey } from "@/lib/agendaFormat";
import { saveBlob } from "@/lib/downloadBlob";
import { MONTH_NAMES, monthRange, pdfPreview, rangeError, rangeLabel } from "@/lib/professionalReports";

type Kind = "month" | "history";
const MONTH_SECTIONS: ReportPdfSection[] = ["ia", "asistencia", "detalle"];
const HISTORY_SECTIONS: ReportPdfSection[] = ["asistencia", "detalle"];
const count = (total: number, one: string, many: string) => `${total} ${total === 1 ? one : many}`;
const dayLabel = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");

/** Resumen del mes o historial de un paciente, con período, pacientes y secciones a elegir. */
export default function BuildPdfSheet({ patients, onClose }: { patients: AgendaPatient[]; onClose: () => void }) {
  const { toast } = useToast();
  const now = new Date();
  const [kind, setKind] = useState<Kind>("month");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [customRange, setCustomRange] = useState(false);
  const [desde, setDesde] = useState(monthRange(now.getFullYear(), now.getMonth() + 1).desde);
  const [hasta, setHasta] = useState(localDateKey(now));
  const [chosen, setChosen] = useState<number[] | null>(null);
  const [patientId, setPatientId] = useState(patients[0] ? String(patients[0].pertenecienteId) : "");
  const [monthSections, setMonthSections] = useState<ReportPdfSection[]>(["ia", "asistencia"]);
  const [historySections, setHistorySections] = useState<ReportPdfSection[]>(HISTORY_SECTIONS);
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchProfessionalSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  const isMonth = kind === "month";
  const patient = patients.find((entry) => String(entry.pertenecienteId) === patientId);
  const sections = isMonth ? monthSections : historySections;
  const period: { desde?: string; hasta?: string } = customRange ? { desde, hasta } : isMonth ? monthRange(year, month) : {};
  const periodError = customRange ? rangeError(desde, hasta) : null;
  const pertenecienteIds = isMonth ? chosen ?? patients.map((entry) => entry.pertenecienteId) : patient ? [patient.pertenecienteId] : [];
  const preview = useMemo(() => pdfPreview(sessions, { pertenecienteIds, ...period }), [sessions, pertenecienteIds.join(","), period.desde, period.hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  const periodText = customRange ? (periodError ? "elegí las fechas" : rangeLabel(desde, hasta)) : isMonth ? `${MONTH_NAMES[month - 1]} ${year}` : "todo el historial";
  const who = isMonth ? count(preview.patients, "paciente", "pacientes") : patient?.name ?? "elegí un paciente";
  const included = sections.map((section) => PDF_SECTIONS[section].short).join(", ");
  const summary = [isMonth ? periodText : `${who}`, isMonth ? who : periodText, count(preview.sessions, "sesión", "sesiones"), sections.length ? included : "sin secciones"].join(" · ");
  const years = Array.from({ length: 4 }, (_, index) => now.getFullYear() - 2 + index);
  const blocked = downloading || sections.length === 0 || Boolean(periodError) || (isMonth ? chosen?.length === 0 : !patient);

  const download = async () => {
    setDownloading(true);
    try {
      const rangeOptions = customRange ? { desde, hasta } : {};
      if (isMonth) {
        saveBlob(await downloadMonthlyReportPdf(year, month, { ...rangeOptions, pacientes: chosen ?? undefined, incluir: monthSections }), customRange ? `reporte-${desde}-${hasta}.pdf` : `reporte-mensual-${year}-${String(month).padStart(2, "0")}.pdf`);
      } else if (patient) {
        saveBlob(await downloadPatientHistoryPdf(patient.pertenecienteId, { ...rangeOptions, incluir: historySections }), `historial-${patient.name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
      }
    } catch (error) {
      toast({ title: "No pudimos armar el PDF", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AgendaSheet
      title="Armar un PDF"
      onClose={onClose}
      footer={
        <button type="button" onClick={download} disabled={blocked} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
          {downloading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Download size={18} aria-hidden />}
          Descargar PDF
        </button>
      }
    >
      <div>
        <SheetLabel>Qué querés armar</SheetLabel>
        <div className="flex flex-wrap gap-2">
          <SheetChip selected={isMonth} onClick={() => { setKind("month"); setCustomRange(false); }}>Resumen del mes</SheetChip>
          <SheetChip selected={!isMonth} onClick={() => { setKind("history"); setCustomRange(false); }}>Historial de un paciente</SheetChip>
        </div>
      </div>

      {!isMonth && <PatientChips patients={patients} value={patientId} onChange={setPatientId} />}

      <div>
        <SheetLabel>Período</SheetLabel>
        {isMonth && !customRange && (
          <div className="grid grid-cols-2 gap-3">
            <select aria-label="Mes" value={month} onChange={(event) => setMonth(Number(event.target.value))} className={`${sheetInputClass} text-sm font-semibold`}>
              {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
            </select>
            <select aria-label="Año" value={year} onChange={(event) => setYear(Number(event.target.value))} className={`${sheetInputClass} text-sm font-semibold`}>
              {years.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        )}
        {!isMonth && (
          <div className="flex flex-wrap gap-2">
            <SheetChip selected={!customRange} onClick={() => setCustomRange(false)}>Todo el historial</SheetChip>
            <SheetChip selected={customRange} onClick={() => setCustomRange(true)}>Elegir fechas</SheetChip>
          </div>
        )}
        {customRange && (
          <div className={`grid grid-cols-2 gap-3 ${!isMonth ? "mt-3" : ""}`}>
            <PickerField label="Desde" type="date" value={desde} display={desde ? dayLabel(desde) : "Elegir"} onChange={setDesde} />
            <PickerField label="Hasta" type="date" value={hasta} display={hasta ? dayLabel(hasta) : "Elegir"} onChange={setHasta} />
          </div>
        )}
        {periodError && <p role="alert" className="mt-2 text-sm font-bold text-destructive">{periodError}</p>}
        {isMonth && (
          <button type="button" onClick={() => setCustomRange((value) => !value)} className="mt-2 min-h-11 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {customRange ? "Volver a " : "O elegí fechas: "}<span className="font-extrabold text-primary">{customRange ? "mes y año" : "Desde – Hasta"}</span>
          </button>
        )}
      </div>

      {isMonth && <PatientMultiChips patients={patients} selected={chosen} onChange={setChosen} />}
      <IncludeSwitches sections={isMonth ? MONTH_SECTIONS : HISTORY_SECTIONS} value={sections} onChange={isMonth ? setMonthSections : setHistorySections} />

      <p className="rounded-2xl bg-[#F5EFFC] p-3 text-sm text-[#2b2145]"><strong>Tu PDF va a tener:</strong> {summary}</p>
      <p className="text-sm text-muted-foreground">Las notas privadas de las sesiones nunca van en el PDF.</p>
    </AgendaSheet>
  );
}
