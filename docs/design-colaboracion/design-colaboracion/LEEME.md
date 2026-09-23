# Diseño de referencia — Pestaña Colaboración (TÁNDEM)

Cada pantalla viene en dos formatos: **`.png`** (foto de cómo debe verse) y **`.html`** (el mismo diseño con todos los estilos escritos en línea: cada px, radio, gap, tamaño de fuente y color es el valor FINAL a reproducir). Los `.html` se abren en cualquier navegador.

| Archivo | Pantalla | Ancho |
|---|---|---|
| 01-primera-pantalla-mobile | Lo primero que se ve: navegación, encabezado, "Ahora", inicio de "Lo que pasó" y barra fija para escribir | 390 |
| 02-ver-todo-mobile | Después de tocar "Ver todo lo que pasó" (el hilo completo, con filtros) | 390 |
| 03-escribiendo-objetivo-mobile | La barra de escribir expandida, con "Objetivo" elegido | 390 |
| 04-estados-vacios-mobile | Vacíos y "Cargando…" | 390 |
| 05-colaboracion-desktop | Todo en dos columnas | 1200 |

**Tablet (≈768 a 1023 px) no tiene diseño.** Es la pantalla menos importante. Se resuelve con las mismas reglas: comportarse como mobile hasta que hay lugar y pasar a dos columnas desde 1024 px.

## Qué es dato de ejemplo (se reemplaza por datos reales)
Todos los nombres (Laura, Martín, Sofía), fechas, horas, porcentajes, textos de notas y acuerdos, y los conteos ("2/4", "(6)"). Los textos de interfaz (títulos, etiquetas, botones, avisos) sí son el copy final.

## Reglas de la pantalla
- Sin scroll horizontal en ningún lado. Sin carruseles.
- La navegación de arriba es la REAL del proyecto (íconos sin texto en mobile, sin scroll). No se toca.
- La barra para escribir queda fija abajo en mobile.
- Las notas privadas del profesional NUNCA aparecen en esta pantalla.

## Colores
Marca: `#6F4CA6` (primario), `#553588` (texto sobre fondo suave), `#F1EAFB` y `#F5F0FC` (fondos suaves), `#EBE1F7` (pistas de barras), `#C4B0E4`, bordes y divisores `#E6DCF5`, `#DACBF0`, `#EFE7F9`, `#DDD0F0`, texto `#2B2145`, texto secundario `#675E78`.
Estados: verde `#0B6B4A` sobre `#DCF5EA`; celeste `#14587A` sobre `#DDF0FA`; ámbar `#7A4300` sobre `#FFEFCF`. Fondo de página: `#FFFFFF → #EEF8FF → #F4EFFF`.
Tipografía: títulos Walkyo (aquí se ve Montserrat); resto Montserrat.
