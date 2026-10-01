import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { resizeSessionSeries, type ProfessionalSession } from "@/data/api";

/** Sesiones de la serie que ya pasaron pero siguen como "programada". */
export function countPastScheduled(sessions: ProfessionalSession[], now = Date.now()) {
  return sessions.filter(
    (session) => session.estado === "programada" && new Date(session.fecha_sesion).getTime() <= now,
  ).length;
}

export function useSeriesCompletion(onSeriesChanged: () => void) {
  const { toast } = useToast();
  const [completing, setCompleting] = useState(false);

  const markPastAsCompleted = async (groupId: string) => {
    setCompleting(true);
    try {
      const result = await resizeSessionSeries(groupId, { markPastAsCompleted: true });
      toast({
        title: `${result.completedSessionIds.length} sesion${result.completedSessionIds.length === 1 ? "" : "es"} marcada${result.completedSessionIds.length === 1 ? "" : "s"} como completadas`,
      });
      onSeriesChanged();
    } catch (error) {
      toast({
        title: "No se pudo actualizar el estado",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  return { completing, markPastAsCompleted };
}
