import { useMemo, useState } from "react";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import type { GeneratedReport } from "@/data/api";
import { AVATAR_TONES } from "@/components/agenda/AgendaDayRow";
import { SheetChip } from "@/components/agenda/AgendaSheet";
import { SectionLabel } from "@/components/professional/reports/ReportsOverview";
import DownloadReportsSheet from "@/components/reports/DownloadReportsSheet";
import ReadOnlyReportSheet from "@/components/tutor/reports/ReadOnlyReportSheet";
import TutorReportRow from "@/components/tutor/reports/TutorReportRow";
import { useToast } from "@/components/ui/use-toast";
import { initials } from "@/lib/agendaFormat";
import { shortDate } from "@/lib/professionalReports";
import { downloadSingleReport } from "@/lib/reportsPdf";
import { groupReportsByMonth, professionalNames, reportsOfPerson, tutorByline } from "@/lib/tutorReports";
import { cn } from "@/lib/utils";

/** Reportes que los profesionales le mandaron al tutor sobre una persona: solo leer y descargar. */
export default function TutorPersonReports({ person, reports, failed, onRetry, onBack }: {
  person: { id: number; name: string };
  /** Todos los reportes del tutor (ya cargados por TutorExperience). */
  reports: GeneratedReport[];
  failed: boolean;
  onRetry: () => Promise<unknown>;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [proFilter, setProFilter] = useState<string>("all");
  const [reading, setReading] = useState<GeneratedReport | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const mine = useMemo(() => reportsOfPerson(reports, person.id), [reports, person.id]);
  const pros = useMemo(() => professionalNames(mine), [mine]);
  const months = useMemo(() => groupReportsByMonth(proFilter === "all" ? mine : mine.filter((report) => report.profesional_nombre === proFilter)), [mine, proFilter]);
  const firstName = person.name.split(" ")[0];

  const downloadOne = async (report: GeneratedReport) => {
    try {
      await downloadSingleReport(report, person.name, tutorByline);
    } catch {
      toast({ title: "No pudimos armar el PDF", description: "Intentá nuevamente.", variant: "destructive" });
    }
  };
  const retry = async () => { setRetrying(true); try { await onRetry(); } finally { setRetrying(false); } };

  let body;
  if (retrying) {
    body = <p className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 size={18} className="animate-spin" aria-hidden /> Cargando reportes…</p>;
  } else if (failed && !mine.length) {
    body = (
      <div role="alert" className="rounded-3xl border border-destructive/20 bg-white p-6 text-sm text-destructive shadow-sm">
        No pudimos cargar la información. Intentá nuevamente.
        <button type="button" onClick={retry} className="ml-3 min-h-11 rounded-full border border-primary/20 px-4 text-sm font-semibold text-primary">Reintentar</button>
      </div>
    );
  } else if (!mine.length) {
    body = (
      <div className="rounded-3xl border border-dashed border-primary/25 bg-white p-8 text-center">
        <FileText className="mx-auto mb-3 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Todavía no recibiste reportes de {firstName}. Cuando un profesional te mande uno, va a aparecer acá.</p>
      </div>
    );
  } else {
    body = (
      <>
        <button type="button" onClick={() => setDownloading(true)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary/10 px-5 text-sm font-bold text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto">
          <Download size={18} aria-hidden /> Descargar los de {firstName}
        </button>
        {pros.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por profesional">
            <SheetChip selected={proFilter === "all"} onClick={() => setProFilter("all")}>Todos</SheetChip>
            {pros.map((pro) => <SheetChip key={pro} selected={proFilter === pro} onClick={() => setProFilter(pro)}>{pro}</SheetChip>)}
          </div>
        )}
        {months.map((month) => (
          <section key={month.label} className="space-y-2" aria-label={month.label}>
            <SectionLabel>{month.label}</SectionLabel>
            <ul className="space-y-3">
              {month.reports.map((report) => <TutorReportRow key={report.id} report={report} onRead={() => setReading(report)} onDownload={() => downloadOne(report)} />)}
            </ul>
          </section>
        ))}
      </>
    );
  }

  return (
    <div className="professional-surface mx-auto w-full max-w-5xl space-y-5">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#ddcfed] bg-white px-4 text-sm font-semibold text-[#6b4c9a] shadow-sm transition hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ArrowLeft size={18} aria-hidden /> Volver a Personas vinculadas
      </button>
      <header className="flex items-center gap-4">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold", AVATAR_TONES[person.id % AVATAR_TONES.length])} aria-hidden>{initials(person.name)}</span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Reportes de los profesionales</p>
          <h2 className="font-heading text-2xl font-bold leading-tight text-[#2b2145]">{person.name}</h2>
          <p className="text-xs text-muted-foreground">{mine.length} {mine.length === 1 ? "reporte" : "reportes"}</p>
        </div>
      </header>
      {body}

      {reading && (
        <ReadOnlyReportSheet
          report={reading}
          subtitle={`${firstName} · de ${reading.profesional_nombre || "tu profesional"} · llegó el ${shortDate(reading.fecha_envio || reading.fecha_generacion)}`}
          onClose={() => setReading(null)}
          onDownload={() => downloadOne(reading)}
        />
      )}
      {downloading && (
        <DownloadReportsSheet people={[{ id: person.id, name: person.name }]} reports={reports} initialPersonId={person.id} personLabel="¿De quién?" byline={tutorByline} onClose={() => setDownloading(false)} />
      )}
    </div>
  );
}
