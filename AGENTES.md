# AGENTS.md — TÁNDEM 2026 Frontend

Este archivo define cómo debe trabajar cualquier agente de IA sobre el frontend de TÁNDEM.

Repositorio frontend:

```txt
IlanBuss0/tandem-connections_2026
```

Repositorio backend relacionado:

```txt
IlanBuss0/Tandem_Proyect_2026---BACKEND
```

TÁNDEM es una plataforma orientada a promover la autonomía cotidiana de personas con TEA mediante rutinas guiadas, actividades, pictogramas, accesibilidad, gamificación, chat, seguimiento familiar, acompañamiento profesional, notificaciones y geolocalización.

La persona con TEA, también llamada perteneciente dentro del sistema, debe ser siempre el centro de la experiencia. Tutores, familiares y profesionales acompañan, monitorean y ayudan, pero no reemplazan la autonomía del usuario principal.

---

## 1. Stack del frontend

El frontend usa:

* React 18.
* TypeScript.
* Vite.
* TailwindCSS.
* shadcn/ui.
* Radix UI.
* TanStack Query.
* Socket.IO client.
* Framer Motion.
* React Hook Form.
* Zod.
* Lucide React.

Comandos principales:

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

El frontend espera por defecto el backend en:

```txt
http://localhost:3000
```

Para cambiarlo, usar `.env`:

```bash
VITE_BACKEND_URL=http://localhost:3000
```

---

## 2. Principio central del frontend

El frontend no debe ser la fuente de verdad de seguridad.

El frontend puede:

* Mostrar información.
* Pedir acciones.
* Mejorar experiencia.
* Manejar estados visuales.
* Escuchar eventos realtime.
* Enviar datos necesarios para una operación.

Pero el frontend no debe decidir:

* Si un usuario tiene permiso final.
* Qué usuario está autenticado.
* Si puede acceder a datos sensibles.
* Si puede ver ubicación, emociones, archivos o chats privados.

Eso lo decide el backend usando JWT y `AuthorizationService`.

---

## 3. Usuario autenticado

No mandar `id_usuario` sensible como fuente de verdad.

El backend obtiene el usuario autenticado desde JWT.

Regla:

```txt
El frontend no debe decirle al backend “soy el usuario 5” para acciones sensibles.
```

El frontend puede usar `user.id` para UI, filtros locales o estados visuales, pero el backend debe validar todo con el JWT.

Ejemplo aceptable:

```ts
const isMine = message.senderId === user.id;
```

Ejemplo peligroso:

```ts
await apiRequest('/api/notificaciones/mine', {
  method: 'POST',
  body: { id_usuario: user.id }
});
```

Para acciones como:

* Mis notificaciones.
* Enviar mensaje.
* Marcar mensaje leído.
* Compartir ubicación.
* Ver emociones.
* Adjuntar archivos.
* Modificar permisos.

El backend debe resolver el usuario con JWT.

---

## 4. Capa de API

Usar siempre la capa centralizada de API.

Archivos principales:

```txt
src/services/api/client.ts
src/services/api/tandem-api.ts
src/data/api.ts
```

No crear `fetch` sueltos dentro de componentes.

Incorrecto:

```tsx
useEffect(() => {
  fetch('http://localhost:3000/api/actividades')
}, []);
```

Correcto:

```ts
const actividades = await tandemApi.actividades.getAll();
```

También es válido usar funciones existentes de:

```txt
src/data/api.ts
```

cuando haya transformación de datos, adaptación a tipos legacy o fallback temporal.

---

## 5. `apiRequest`

Para llamadas nuevas al backend, usar:

```ts
apiRequest
```

o métodos ya existentes de:

```ts
tandemApi
```

La capa de API ya maneja:

* `API_BASE_URL`.
* Cookies.
* `credentials: include`.
* CSRF.
* Refresh token.
* Evento de sesión expirada.
* Evento de token refrescado.
* Parseo de errores.

No duplicar esa lógica en componentes.

---

## 6. Uploads

Para subir archivos, usar:

```ts
apiUploadFile
```

No implementar uploads manuales con `fetch` si ya existe helper.

Los archivos son sensibles. El frontend puede seleccionar y enviar archivos, pero el backend valida permisos.

---

## 7. Contextos existentes

Antes de crear un context nuevo, revisar si ya existe uno.

Contextos actuales importantes:

```txt
AuthContext
WalletContext
CustomActivitiesContext
ChatContext
AccessibilityContext
EmotionsContext
RoutinesContext
CalendarContext
MobileMenuProvider
```

Crear un context nuevo solo si:

* La información se comparte entre varias pantallas.
* Hay estado global real.
* Hay sincronización realtime.
* Hay cache local relevante.
* Hay lógica frontend que no pertenece a un componente simple.

No crear context para una sola pantalla.

---

## 8. Socket.IO en frontend

El frontend ya usa Socket.IO.

No crear otra conexión paralela sin una razón fuerte.

La conexión debe usar:

```ts
io(API_BASE_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});
```

Reglas:

* Usar `withCredentials: true`.
* No mandar tokens manualmente si el backend usa cookies.
* Al vencer sesión, desconectar socket.
* Al refrescar token, reconectar socket.
* Centralizar listeners en contextos.
* No escuchar el mismo evento en muchas pantallas si puede centralizarse.
* No crear sockets por componente visual.

---

## 9. Eventos realtime existentes

Eventos que el frontend puede recibir:

```txt
message:new
message:typing
chat:new
chat:updated
message:updated
message:deleted
chat:read
notification:new
permisos:updated
```

Eventos que el frontend puede emitir:

```txt
chat:join
chat:leave
message:send
message:typing
```

Para ubicación futura:

Emitir:

```txt
location:update
location:watch
location:unwatch
```

Escuchar:

```txt
location:updated
location:entered-safe-zone
location:left-safe-zone
location:alert
```

---

## 10. Chat

Para chat, usar `ChatContext`.

No crear otro sistema paralelo de chat.

El chat actual combina:

* HTTP para cargar conversaciones.
* HTTP para cargar mensajes previos.
* Socket.IO para realtime.
* Polling de respaldo.
* Cache local temporal.
* Validación backend de participantes.
* Notificaciones backend.

Cuando se trabaje en chat:

* Revisar `src/contexts/ChatContext.tsx`.
* Revisar funciones de `src/data/api.ts`.
* No duplicar eventos.
* No crear una segunda conexión Socket.IO.
* No confiar solo en estado local.
* Si llega un `message:new`, actualizar estado local.
* Si aparece un chat desconocido, sincronizar conversaciones.
* Si el usuario no participa del chat, no permitir envío desde UI.
* Aunque el frontend bloquee, el backend igual debe validar.

---

## 11. Envío de mensajes

Cuando el usuario envía un mensaje:

1. El frontend valida que haya usuario.
2. El frontend valida que haya texto o archivo.
3. El frontend puede revisar si la conversación está en estado local.
4. El frontend llama a función existente o emite evento.
5. El backend obtiene usuario desde JWT.
6. El backend valida participante y permisos.
7. El backend guarda mensaje.
8. El frontend recibe `message:new` o actualiza estado local.
9. El backend crea notificaciones para destinatarios.

El frontend no debe mandar como fuente de verdad:

```txt
id_usuario_emisor
```

Si alguna función vieja lo recibe por compatibilidad, no asumir que eso autoriza nada. La autorización real es del backend.

---

## 12. Notificaciones

Para notificaciones, usar los endpoints existentes:

```txt
GET /api/notificaciones/mine
PATCH /api/notificaciones/:id/read
PATCH /api/notificaciones/read-all
```

Reglas:

* No pedir notificaciones mandando `id_usuario`.
* El backend sabe quién es el usuario por JWT.
* El frontend escucha `notification:new`.
* Si llega `notification:new`, actualizar contador o refrescar lista.
* La notificación debe existir en base de datos.
* Socket.IO no reemplaza la consulta HTTP.
* Al abrir panel de notificaciones, cargar desde backend.

No crear notificaciones desde frontend.

Incorrecto:

```ts
await apiRequest('/api/notificaciones', {
  method: 'POST',
  body: {
    id_usuario_destino: otroUsuario,
    titulo: 'Nuevo mensaje'
  }
});
```

Correcto:

```txt
El frontend realiza la acción.
El backend crea la notificación.
El frontend recibe notification:new.
```

---

## 13. Permisos en frontend

El frontend puede ocultar botones según permisos para mejorar experiencia.

Pero ocultar un botón no es seguridad.

Siempre el backend debe validar.

Cuando llegue:

```txt
permisos:updated
```

El frontend debe:

* Actualizar estado si corresponde.
* Refrescar contexto de permisos si existe.
* Evitar mostrar acciones que ya no están habilitadas.
* No depender de refresh manual.

---

## 14. Ubicación

La ubicación es sensible.

Reglas frontend:

* Pedir permiso del navegador de forma clara.
* No activar geolocalización sin acción o consentimiento claro.
* No mostrar ubicación si el usuario no tiene permiso.
* No mandar ubicación si el usuario desactivó compartir ubicación.
* No exponer coordenadas en componentes innecesarios.
* No guardar ubicación sensible en localStorage.
* No simular permisos desde frontend.
* El backend debe validar si puede escribir o leer ubicación.

Para ubicación actual, usar capa de API centralizada.

Para ubicación en vivo futura, usar Socket.IO.

Eventos sugeridos:

```txt
location:update
location:updated
location:entered-safe-zone
location:left-safe-zone
location:alert
```

Payload sugerido para enviar ubicación:

```ts
{
  id_dispositivo,
  latitud,
  longitud,
  precision,
  velocidad,
  bateria,
  fecha_registro
}
```

No mandar ubicación a usuarios directamente desde frontend. El backend decide a quién emitir.

---

## 15. Zonas seguras

Las zonas seguras son sensibles y posiblemente premium.

Frontend debe:

* Mostrar zonas solo si el backend las devuelve.
* No asumir permisos por rol visual.
* No permitir crear infinitas zonas si el plan no lo permite.
* Mostrar estados claros.
* Explicar qué significa compartir ubicación.
* Evitar mostrar coordenadas innecesarias.

Backend debe validar:

* Permisos.
* Vínculo.
* Plan premium si corresponde.
* Acceso a ubicación.

---

## 16. Actividades

Para actividades:

* Usar API centralizada.
* No depender de mocks si el backend ya tiene endpoint.
* Si se mantiene mock temporal, dejar comentario.
* Manejar estados de carga.
* Manejar errores.
* Manejar estado vacío.
* Al completar actividad, actualizar UI y pedir datos frescos si corresponde.
* Considerar puntos, avatar, calendario y progreso.

Si una acción genera efecto para tutor/profesional, el backend debe crear notificación.

---

## 17. Rutinas y calendario

Rutinas y calendario deben estar conectados.

Reglas:

* No duplicar lógica entre “Día”, “Calendario” y “Rutinas”.
* Si una actividad tiene fecha, debe reflejarse en calendario.
* Si una rutina tiene recordatorio, debe verse en la experiencia diaria.
* No crear mocks nuevos si ya existe backend.
* Manejar fechas con cuidado.
* Mostrar estados simples y claros.

---

## 18. Emociones

Las emociones son datos sensibles.

Frontend debe:

* Permitir registro simple.
* Usar lenguaje no juzgador.
* Evitar textos negativos o culpabilizantes.
* Asociar emoción a fecha.
* Asociar emoción a actividad si corresponde.
* Mostrar a tutor/profesional solo si backend lo permite.
* No exponer emociones en vistas no autorizadas.

Ejemplo de tono correcto:

```txt
¿Cómo te sentiste?
```

Evitar:

```txt
¿Por qué te sentiste mal?
```

---

## 19. Pictogramas

Los pictogramas son apoyo de accesibilidad, no decoración.

Reglas:

* Usar ARASAAC cuando corresponda.
* No llenar pantallas con demasiados pictogramas.
* Mantener búsqueda simple.
* Usarlos para comprensión de actividades, rutinas y apoyos visuales.
* No guardar imágenes si puede usarse URL/cache controlado.
* Mantener textos claros junto al pictograma.

---

## 20. Accesibilidad

La accesibilidad es central en TÁNDEM.

Toda pantalla nueva debe cuidar:

* Contraste suficiente.
* Tamaños legibles.
* Botones grandes.
* Textos cortos.
* Navegación predecible.
* Bajo nivel de frustración.
* Estados de carga.
* Estados vacíos.
* Estados de error.
* Feedback claro.
* No depender solo del color.
* Evitar animaciones excesivas.
* Evitar sobrecarga visual.

Cuando haya duda entre una pantalla más estética y una pantalla más clara, elegir la más clara.

---

## 21. UI e identidad visual

Mantener una estética:

* Suave.
* Moderna.
* Amigable.
* Inclusiva.
* No infantilizada en exceso.
* Con tarjetas redondeadas.
* Con degradés delicados.
* Con buena separación visual.
* Mobile first.
* Consistente con el resto de la app.

No cambiar radicalmente la identidad visual sin confirmación.

No modificar estilos globales sin revisar impacto.

---

## 22. Componentes

Reglas:

* Usar componentes reutilizables.
* Evitar componentes gigantes.
* Separar UI de lógica compleja.
* No duplicar componentes si ya existe uno similar.
* Mantener nombres claros.
* Usar PascalCase para componentes.
* Usar hooks con prefijo `use`.
* Evitar `any` salvo que sea temporal y justificado.
* Manejar loading, error y empty states.

---

## 23. Mocks

El proyecto puede tener mocks temporales.

Reglas:

* No crear mocks nuevos si ya existe backend.
* No eliminar mocks si todavía sostienen pantallas no migradas.
* Si se usa mock como fallback, dejarlo claro.
* Priorizar integración real con backend.
* No mezclar datos mock y reales sin control.

Comentario sugerido:

```ts
// Fallback temporal hasta completar migracion al backend.
```

---

## 24. Formularios

Para formularios:

* Usar validaciones claras.
* Preferir Zod si ya se está usando en esa zona.
* Mostrar errores simples.
* No mostrar mensajes técnicos al usuario final.
* Evitar campos innecesarios.
* No pedir datos que el backend puede obtener desde JWT.

Ejemplo:

No pedir:

```txt
id_usuario
```

si el backend puede obtenerlo por sesión.

---

## 25. Estados de pantalla

Toda pantalla que consume backend debe tener:

* Loading.
* Error.
* Empty state.
* Estado exitoso.
* Feedback después de una acción.

Ejemplo de empty state:

```txt
Todavía no tenés actividades asignadas.
```

Ejemplo de error simple:

```txt
No pudimos cargar la información. Intentá nuevamente.
```

Evitar mostrar errores técnicos crudos al usuario final.

---

## 26. Manejo de errores de API

Usar `ApiError` cuando corresponda.

Si el error es `401` o `403`:

* No ocultarlo silenciosamente.
* Mostrar mensaje claro si corresponde.
* Dejar que el flujo global de auth maneje sesión expirada.

No implementar refresh token manual en componentes.

---

## 27. Navegación

Antes de agregar rutas o navegación:

* Revisar `App.tsx`.
* Revisar `AppShell`.
* Revisar menú mobile.
* Revisar roles.
* Revisar si la pantalla es pública o privada.
* Revisar si necesita invitación por link.

No crear rutas paralelas que rompan el flujo actual.

---

## 28. Roles

Tipos principales de usuario:

* Perteneciente.
* Tutor.
* Profesional.
* Administrador.

Frontend debe adaptar vistas según rol, pero backend valida permisos reales.

No asumir que todos los usuarios ven lo mismo.

No mostrar acciones de tutor a perteneciente si no corresponden.

No mostrar acciones profesionales a usuarios no validados.

---

## 29. Profesionales

El perfil profesional debe transmitir confianza.

Reglas:

* Respetar validación profesional.
* No mostrar como validado a quien no lo esté.
* Considerar sesión de prueba virtual.
* Mostrar información clara.
* No permitir acciones profesionales si backend no autoriza.

---

## 30. Suscripciones y premium

El producto contempla premium.

Reglas:

* Plan premium con 1 mes de prueba gratis.
* Zonas seguras y lugares pueden ser premium.
* No bloquear funciones básicas de autonomía detrás de pago.
* Las funciones premium deben sentirse como ampliación, no como castigo.
* El frontend puede mostrar upsell, pero backend debe validar plan.

---

## 31. Archivos

Para archivos:

* Usar `apiUploadFile`.
* Mostrar progreso si corresponde.
* Validar tipo y tamaño en frontend como ayuda.
* Backend valida realmente.
* No exponer URLs privadas sin control.
* No permitir adjuntar archivos si backend rechaza permisos.

---

## 32. Checklist antes de implementar

Antes de tocar código, responder:

1. ¿Esto es solo frontend o también backend?
2. ¿Ya existe un componente parecido?
3. ¿Ya existe un context relacionado?
4. ¿Ya existe función en `src/data/api.ts`?
5. ¿Ya existe método en `tandemApi`?
6. ¿Necesita usuario autenticado?
7. ¿Estoy mandando IDs sensibles innecesarios?
8. ¿Necesita realtime?
9. ¿Necesita escuchar un evento Socket.IO?
10. ¿Necesita notificación backend?
11. ¿Necesita permisos?
12. ¿Hay loading, error y empty state?
13. ¿Respeta accesibilidad?
14. ¿Funciona en mobile?

---

## 33. Qué no hacer

No hacer:

* No crear `fetch` sueltos en componentes.
* No duplicar conexión Socket.IO.
* No crear contexts innecesarios.
* No mandar `id_usuario` como fuente de verdad.
* No decidir permisos solo en frontend.
* No mostrar datos sensibles sin backend.
* No guardar ubicación en localStorage.
* No crear notificaciones desde frontend.
* No romper accesibilidad.
* No introducir librerías nuevas sin necesidad.
* No cambiar estilos globales sin revisar impacto.
* No eliminar mocks si todavía sostienen pantallas.
* No crear endpoints inventados si ya existe uno.
* No infantilizar la interfaz.
* No saturar pantallas con pictogramas o animaciones.

---

## 34. Regla para nuevas features realtime

Cuando una feature necesite realtime:

1. Usar HTTP para persistir o consultar estado.
2. Usar backend como fuente de verdad.
3. Usar Socket.IO solo para avisar cambios.
4. Escuchar eventos desde context.
5. Actualizar estado local.
6. Tener fallback por HTTP si se pierde el evento.

Socket.IO no reemplaza la base de datos.

---

## 35. Regla de oro

Frontend muestra y facilita.

Backend valida y decide.

JWT identifica al usuario.

`AuthorizationService` define permisos.

Socket.IO avisa cambios realtime.

PostgreSQL es la fuente de verdad.

La accesibilidad y la autonomía del perteneciente tienen prioridad sobre la estética.
