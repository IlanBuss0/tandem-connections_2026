import type { ReactNode } from "react";
import { ChevronRight, Download, FileText, Folder, RefreshCw } from "lucide-react";
import type { GeneratedReport, ScheduledReportTask } from "@/data/api";
import { Chip } from "@/components/professional/home/HomeUi";
import { CARD_LIFT, CARD_SURFACE } from "@/components/professional/reports/reportCard";
import ReportRow from "@/components/professional/reports/ReportRow";
import { shortDate, type PatientFolder } from "@/lib/professionalReports";
import { cn } from "@/lib/utils";

const MAX_TO_SEND = 5;
export const SectionLabel = ({ children }: { children: ReactNode }) => <h3 className="px-1 text-xs font-bold uppercase tracking-[0.12em] text-[#5f477c]/80">{children}</h3>;

function IconTile({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner ring-1 ring-white/70", tone)} aria-hidden>{children}</span>;
}

function ToolTile({ icon, tone, title, text, onClick }: { icon: ReactNode; tone: string; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn(CARD_SURFACE, CARD_LIFT, "flex min-h-14 w-full items-center gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
      <IconTile tone={tone}>{icon}</IconTile>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[#2b2145]">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-primary" aria-hidden />
    </button>
  );
}

type Props = {
  toSend: GeneratedReport[];
  folders: PatientFolder[];
  tasks: ScheduledReportTask[];
  nameOf: (report: GeneratedReport) => string;
  onRead: (report: GeneratedReport) => void;
  onMenu: (report: GeneratedReport) => void;
  onOpenUnsent: () => void;
  onOpenFolder: (pertenecienteId: number) => void;
  onBuildPdf: () => void;
  onScheduled: () => void;
};

export default function ReportsOverview({ toSend, folders, tasks, nameOf, onRead, onMenu, onOpenUnsent, onOpenFolder, onBuildPdf, onScheduled }: Props) {
  const scheduled = tasks.filter((task) => task.activo).length;
  const latest = toSend.slice(0, MAX_TO_SEND);
  return (
    <>
      {folders.length === 0 ? (
        <section className={cn(CARD_SURFACE, "flex flex-col items-center px-6 py-10 text-center")}>
          <IconTile tone="bg-gradient-to-br from-[#F1EAFB] to-[#e2d4f7] text-primary"><FileText size={22} /></IconTile>
          <h3 className="mt-4 text-base font-bold text-[#2b2145]">Todavía no hiciste reportes</h3>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">Elegí un paciente y las sesiones con nota, y armamos el reporte para que lo leas antes de mandarlo a la familia.</p>
        </section>
      ) : (
        <>
          {toSend.length > 0 && (
            <section className="space-y-2" aria-label="Para enviar">
              <div className="flex items-center justify-between gap-3">
                <SectionLabel>Para enviar · {toSend.length}</SectionLabel>
                {toSend.length > MAX_TO_SEND && (
                  <button type="button" onClick={onOpenUnsent} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Ver los {toSend.length} <ChevronRight size={16} aria-hidden />
                  </button>
                )}
              </div>
              <ul className="space-y-3">
                {latest.map((report, index) => <ReportRow key={report.id} report={report} patientName={nameOf(report)} primary={index === 0} onRead={() => onRead(report)} onMenu={() => onMenu(report)} />)}
              </ul>
            </section>
          )}
          <section className="space-y-2" aria-label="Carpetas por paciente">
            <SectionLabel>Carpetas por paciente</SectionLabel>
            <p className="px-1 text-sm text-muted-foreground">Acá están todos los reportes que hiciste, para leerlos cuando quieras.</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {folders.map((folder) => (
                <li key={folder.pertenecienteId}>
                  <button type="button" onClick={() => onOpenFolder(folder.pertenecienteId)} className={cn(CARD_SURFACE, CARD_LIFT, "flex min-h-16 w-full items-center gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
                    <IconTile tone="bg-gradient-to-br from-[#F1EAFB] to-[#e2d4f7] text-primary"><Folder size={20} /></IconTile>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#2b2145]">{folder.name}{folder.unsent > 0 && <Chip tone="amber">{folder.unsent} sin enviar</Chip>}</span>
                      <span className="block text-xs text-muted-foreground">{folder.reports.length} {folder.reports.length === 1 ? "reporte" : "reportes"} · último el {shortDate(folder.last.fecha_generacion)}</span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-primary" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        <ToolTile icon={<Download size={18} />} tone="bg-gradient-to-br from-[#F1EAFB] to-[#e2d4f7] text-primary" title="Armar un PDF" text="Resumen del mes o historial de un paciente" onClick={onBuildPdf} />
        <ToolTile icon={<RefreshCw size={18} />} tone="bg-gradient-to-br from-[#e6f5fd] to-[#cde9f8] text-[#0c5a86]" title="Reportes automáticos" text={scheduled === 0 ? "Ningún paciente programado" : `${scheduled} ${scheduled === 1 ? "paciente programado" : "pacientes programados"}`} onClick={onScheduled} />
      </div>
    </>
  );
}
