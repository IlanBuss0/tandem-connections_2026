# Diseño de referencia — Inicio del Profesional (TÁNDEM)

Cada pantalla viene en `.png` (foto de cómo debe verse) y `.html` (mismo diseño con estilos en línea: cada px, radio, gap, tamaño de fuente y color es el valor FINAL a reproducir). Los `.html` se abren en cualquier navegador (la carpeta `fonts/` va al lado).

| Archivo | Qué muestra | Ancho |
|---|---|---|
| 01-primera-pantalla-mobile | Lo primero que se ve, con la barra de abajo flotando encima | 390 |
| 02-recorrido-completo-mobile | Todo el largo de la pantalla, estado inicial (Tomás sin nota, Martina sin preparar, Caro sin sesión) | 390 |
| 03-todo-resuelto-mobile | Mismo recorrido con: nota de Tomás guardada, sesión de Martina preparada, sesión de Caro propuesta | 390 |
| 04-inicio-desktop | Dos columnas | 1280 |

## Qué se reemplaza y qué NO se toca
- Se reemplaza SOLO el contenido de la Home (hoy `ProfessionalHome`). Header, menú lateral, botón central, barra de abajo, campana y avatar son los REALES del proyecto: no se tocan.
- En la foto desktop, la columna izquierda (menú) y la nota "Vista de referencia" son del prototipo: IGNORAR. Se usa el shell real.
- En 02 y 03 la barra de abajo aparece al final solo por ser captura larga; en la app es fija.
- Tablet (768–1023): sin diseño. Se comporta como mobile y pasa a dos columnas desde 1024.

## Dato de ejemplo vs. copy final
Ejemplo (se reemplaza por datos reales): Martín, Tomás, Martina, Sol, Caro, Laura, horas, "3 veces", "5 días", "90%", conteos, fechas.
Copy final: títulos de sección, "Escribir nota", "Preparar sesión", "Agendar", "Completar", "Revisar", "Sin nota", "Sigue", "Notas al día".

## Reglas
- Sin scroll horizontal. Sin carruseles.
- Nunca mostrar notas privadas de otros ni datos que el profesional no tenga permitidos.
- No inventar datos: si una línea no tiene dato real, se omite.
- Sin diagnósticos ni conclusiones clínicas automáticas.
- Colores: primario `#6F4CA6`, `#553588`, suaves `#F1EAFB` `#F5F0FC` `#EBE1F7`, bordes `#E6DCF5` `#DACBF0` `#EFE7F9`, texto `#2B2145`, secundario `#675E78`. Verde `#0B6B4A` sobre `#DCF5EA`; ámbar `#7A4300` sobre `#FFEFCF`. Fondo `#FFFFFF → #EEF8FF → #F4EFFF`.
- Tipografía: títulos Walkyo, resto Montserrat.
