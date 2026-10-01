import { useEffect, useState } from 'react';
import { fetchPrivateProfessionalNote, type ProfessionalSession } from '@/data/api';

export type NoteDoc = { name: string; url: string };

/** Nombre y link del Google Doc de cada sesión con nota. Se pide solo para las sesiones dadas (una llamada por sesión, en paralelo); si una falla, esa queda sin datos. */
export function usePatientNoteDocs(sessions: ProfessionalSession[]) {
  const [docs, setDocs] = useState<Record<number, NoteDoc | undefined>>({});
  const [loading, setLoading] = useState(sessions.length > 0);
  const key = sessions.map(session => session.id).join(',');

  useEffect(() => {
    let cancelled = false;
    setLoading(sessions.length > 0);
    Promise.allSettled(sessions.map(session => fetchPrivateProfessionalNote(session.id))).then(results => {
      if (cancelled) return;
      const next: Record<number, NoteDoc | undefined> = {};
      results.forEach((result, index) => {
        const doc = result.status === 'fulfilled' ? result.value?.documento_drive : undefined;
        if (doc) next[sessions[index].id] = { name: doc.nombre, url: doc.web_view_url };
      });
      setDocs(next);
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { docs, loading };
}
