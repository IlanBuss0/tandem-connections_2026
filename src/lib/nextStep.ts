// Unica responsabilidad: encontrar el proximo paso pendiente de una rutina
// y cuanto falta para el (Sesion 13, item 33 "aviso de transicion"). Puro,
// sin Date.now() adentro — recibe `now` para que sea testeable sin mockear
// el reloj global.
export interface StepLike {
  id: string;
  time: string; // "HH:MM"
  title: string;
  completed: boolean;
}

export interface NextStepInfo {
  step: StepLike;
  minutesUntil: number; // puede ser negativo si ya paso la hora y sigue sin completar
}

function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** El proximo paso SIN completar, ordenado por horario. Si no hay ninguno, null. */
export function findNextStep(items: StepLike[], now: Date): NextStepInfo | null {
  const pending = items
    .filter((it) => !it.completed)
    .map((it) => ({ step: it, minutes: parseTimeToMinutes(it.time) }))
    .filter((it): it is { step: StepLike; minutes: number } => it.minutes !== null)
    .sort((a, b) => a.minutes - b.minutes);

  if (pending.length === 0) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // Preferir el primero que todavia no llego; si todos ya pasaron, el mas
  // reciente que sigue pendiente (probablemente el que hay que hacer ahora).
  const upcoming = pending.find((p) => p.minutes >= nowMinutes) || pending[pending.length - 1];

  return { step: upcoming.step, minutesUntil: upcoming.minutes - nowMinutes };
}
