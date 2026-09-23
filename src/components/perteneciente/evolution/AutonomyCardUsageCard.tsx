import { useEffect, useState } from 'react';
import { fetchAutonomyCardUsage, type AutonomyCardUsage } from '@/data/usageApi';
import HBarList from './charts/HBarList';

export default function AutonomyCardUsageCard({ userId }: { userId: string }) {
  const [usage, setUsage] = useState<AutonomyCardUsage[] | null>(null);

  useEffect(() => {
    let mounted = true;
    setUsage(null);
    fetchAutonomyCardUsage(userId).then(rows => { if (mounted) setUsage(rows); });
    return () => { mounted = false; };
  }, [userId]);

  const top = [...(usage ?? [])].sort((a, b) => b.count - a.count).slice(0, 4);

  return (
    <div className="rounded-2xl border border-[var(--evo-border-1)] bg-white p-4">
      <p className="text-sm font-bold text-[var(--evo-text)]">Tarjetas de autonomía que más usa</p>
      {usage === null && <p className="mt-2 text-sm text-[var(--evo-text-secondary)]">Calculando…</p>}
      {usage !== null && top.length === 0 && <p className="mt-2 text-sm text-[var(--evo-text-secondary)]">Todavía no hay uso de tarjetas registrado.</p>}
      {top.length > 0 && (
        <>
          <div className="mt-3"><HBarList items={top.map(item => ({ label: item.label, value: item.count }))} formatValue={value => `×${value}`} /></div>
          <p className="mt-2 text-xs text-[var(--evo-text-secondary)]">Las que más toca cuando necesita algo.</p>
        </>
      )}
    </div>
  );
}
