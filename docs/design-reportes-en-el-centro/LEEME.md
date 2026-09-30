# Reportes dentro del Centro del paciente (pestaña Sesiones)

Fotos: 01 Sesiones con reportes · 02 Sesiones sin reportes · 03 Nuevo reporte desde el Centro (paciente ya elegido y bloqueado).
Lo único nuevo es el bloque «Reportes de {paciente}» al final de la pestaña Sesiones. El resto de la pestaña queda como está hoy (la foto lo muestra simplificado).

## Origen de los datos
| Dato | Quién lo escribe / cómo se calcula | Estado |
|---|---|---|
| Lista de reportes del bloque | `fetchProfessionalReports(pertenecienteId)`, que el Centro ya carga | ✅ |
| «N reportes · último el…» | Se cuenta y se toma `fecha_generacion` del más nuevo | ✅ |
| Estado «Sin enviar» / «Enviado el…» | `enviado_al_tutor` y `fecha_envio` | ✅ |
| Manual / automático | `id_tipo` | ✅ |
| Leer, enviar, editar, eliminar, volver a generar | Las mismas acciones de la pantalla Reportes | ✅ |
| Nuevo reporte | La misma hoja de Reportes con el paciente elegido y bloqueado | ✅ |
| Permiso | Se muestra solo si el tutor habilitó el historial (`canViewHistory`) | ✅ |
