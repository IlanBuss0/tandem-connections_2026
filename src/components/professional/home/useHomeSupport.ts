import { useEffect, useRef, useState } from 'react';
import { fetchAcompanamiento, fetchProfessionalReports, type AcompanamientoData, type GeneratedReport } from '@/data/api';
import { fetchAutonomyCardUsage, type AutonomyCardUsage } from '@/data/usageApi';

type Params = {
  /** userId -> id_perteneciente de todos los pacientes vinculados. */
  pertenecienteIds: Record<string, number>;
  /** Pacientes con sesión hoy: solo a ellos se les pide el uso de tarjetas. */
  todayUserIds: string[];
};

/**
 * Datos de apoyo de la Home, cargados una sola vez por paciente y tolerantes a errores:
 * si una llamada falla o no hay permiso, ese dato simplemente no existe.
 */
export function useHomeSupport({ pertenecienteIds, todayUserIds }: Params) {
  const [agreements, setAgreements] = useState<Record<string, AcompanamientoData>>({});
  const [usage, setUsage] = useState<Record<string, AutonomyCardUsage[]>>({});
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const requested = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    const once = (key: string) => (requested.current.has(key) ? false : (requested.current.add(key), true));
    Object.entries(pertenecienteIds).forEach(([userId, id]) => {
      if (!Number.isFinite(id) || !once(`acomp:${userId}`)) return;
      fetchAcompanamiento(id).then(data => { if (!cancelled) setAgreements(prev => ({ ...prev, [userId]: data })); }).catch(() => undefined);
    });
    todayUserIds.forEach(userId => {
      if (!once(`usage:${userId}`)) return;
      fetchAutonomyCardUsage(userId).then(rows => { if (!cancelled) setUsage(prev => ({ ...prev, [userId]: rows })); }).catch(() => undefined);
    });
    if (once('reports')) fetchProfessionalReports().then(rows => { if (!cancelled) setReports(rows); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [pertenecienteIds, todayUserIds]);

  return { agreements, usage, reports };
}
