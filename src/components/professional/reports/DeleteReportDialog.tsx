import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { GeneratedReport } from "@/data/api";
import { reportTitle } from "@/lib/professionalReports";

export default function DeleteReportDialog({ report, patientName, onConfirm, onClose }: { report: GeneratedReport; patientName: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-md rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Querés eliminar este reporte?</AlertDialogTitle>
          <AlertDialogDescription>
            «{reportTitle(report)}» de {patientName} se va a borrar.
            {report.enviado_al_tutor && " El tutor ya lo recibió: también deja de verlo en su lista de reportes."} No se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11 rounded-xl">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="min-h-11 rounded-xl bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500">Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
