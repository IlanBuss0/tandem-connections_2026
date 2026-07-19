import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { fetchTutorReports, type GeneratedReport } from "@/data/api";

export default function TutorReportsPanel() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutorReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border p-8 text-muted-foreground">
        <Loader2 className="mr-2 animate-spin" size={18} />
        Cargando reportes...
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <FileText className="mx-auto mb-2 text-primary" />
        <p className="font-medium">Todavía no recibiste reportes</p>
        <p className="text-sm text-muted-foreground">
          Cuando un profesional te mande un reporte de progreso, va a aparecer acá.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="rounded-xl border bg-card p-4 space-y-2">
          <div>
            <p className="font-semibold text-sm">
              Reporte de {report.profesional_nombre || "tu profesional"}
            </p>
            <p className="text-xs text-muted-foreground">
              {report.paciente_nombre ? `${report.paciente_nombre} · ` : ""}
              {report.fecha_envio
                ? new Date(report.fecha_envio).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
                : ""}
            </p>
          </div>
          <p className="text-sm whitespace-pre-wrap">{report.contenido}</p>
        </div>
      ))}
    </div>
  );
}
