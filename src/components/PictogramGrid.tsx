import type { ReactNode } from 'react';

// Unica responsabilidad: la grilla que contiene PictogramTile (Sesion 10).
// `role="group"` con `aria-label` es el contrato minimo de foco/recorrido
// que el barrido de switch access (Sesion 22, item 45) va a necesitar:
// un contenedor identificable de "un conjunto de opciones", en vez de que
// cada pantalla arme su propia grilla suelta sin esa semantica.
export default function PictogramGrid({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 ${className}`}>
      {children}
    </div>
  );
}
