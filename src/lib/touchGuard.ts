// Unica responsabilidad: decidir si un toque se acepta o se ignora por
// "proteccion anti-toque accidental" (Sesion 21, item 46). Puro — no toca
// el DOM ni React, solo compara timestamps. Pensado para quien tiene
// temblor, espasticidad, o toca la pantalla sin querer al apoyar la mano:
// un segundo toque que llega demasiado rapido despues del anterior se
// descarta, en vez de disparar la accion dos veces (o dispararla cuando
// el dedo solo rozo la pantalla al pasar).
export const ACCIDENTAL_TOUCH_MIN_INTERVAL_MS = 500;

export function shouldAcceptTouch(lastAcceptedAt: number | null, now: number, minIntervalMs = ACCIDENTAL_TOUCH_MIN_INTERVAL_MS): boolean {
  if (lastAcceptedAt === null) return true;
  return now - lastAcceptedAt >= minIntervalMs;
}
