import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { findNextStep, type StepLike } from '@/lib/nextStep';
import WaitingBar from '@/components/WaitingBar';

// Unica responsabilidad: avisar cual es el proximo paso y cuanto falta
// (Sesion 13, item 33), con la barra que se vacia (item 34) como apoyo
// visual del tiempo. Se recalcula solo, cada minuto — no hace falta que
// el usuario recargue la pantalla para ver que el conteo bajo.
//
// Ventana de la barra: 30 minutos. No es "el tiempo real hasta el paso"
// (podrian ser horas) sino una ventana corta y consistente, para que la
// barra sea un apoyo de "se esta por acercar" en vez de estar vacia todo
// el dia.
const WINDOW_MINUTES = 30;

export default function NextStepBanner({ items }: { items: StepLike[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const next = findNextStep(items, now);
  if (!next || next.minutesUntil > WINDOW_MINUTES) return null;

  const label = next.minutesUntil <= 0
    ? `Es la hora de: ${next.step.title}`
    : `En ${next.minutesUntil} minuto${next.minutesUntil === 1 ? '' : 's'}: ${next.step.title}`;

  return (
    <div className="rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#6b4c9a]">
        <Clock size={14} />
        {label}
      </div>
      <div className="mt-2">
        <WaitingBar totalSeconds={WINDOW_MINUTES * 60} remainingSeconds={Math.max(0, next.minutesUntil) * 60} />
      </div>
    </div>
  );
}
