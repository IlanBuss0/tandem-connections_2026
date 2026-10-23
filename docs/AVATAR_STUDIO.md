# Avatares unificados de TÁNDEM

## Acceso

Ingresar como perteneciente a **Perfil → Tienda y avatar**. Solo existen **Mi avatar** (el editor completo) y **Tienda**. El inventario está integrado en las opciones disponibles del editor. Las cuatro vistas anteriores eran estados internos de UserShop, no rutas URL independientes; se eliminaron esas vistas sin agregar rutas paralelas.

Al iniciar el backend con su comando habitual, se agregan los artículos faltantes del catálogo. No hay migraciones de esquema ni comandos SQL manuales. Es necesario reiniciar un backend que estuviera ejecutando la versión anterior. La inicialización usa una transacción y un advisory lock; no actualiza precios anteriores, compras, saldos, niveles ni experiencias. Las lecturas GET no escriben en la base.

## Bases y peinados

En **Mi avatar → Base** se elige Base masculina o Base femenina. La elección es visual e independiente de los datos del perfil. Cambiarla conserva todos los rasgos, artículos adquiridos y objetos equipados.

La base femenina tiene contorno propio de mandíbula y cuello, cejas más finas y otro perfil de hombros, brazos, cintura, cadera y piernas. Ambas bases incluyen la anatomía bajo la ropa y comparten los anclajes de ojos, accesorios, cintura y tobillos. avatarGeometry adapta los puntos de control de las prendas al mismo perfil anatómico que el cuerpo; no se escala arbitrariamente el SVG completo ni se duplica el producto. Todo el guardarropa actual es compatible con ambas bases.

Hay **22 peinados**, con siluetas frontales y posteriores originales:
- **7 gratuitos:** corto clásico, corto con volumen, medio hacia un lado, corto prolijo, media melena simple, pelo largo simple y rulos cortos clásicos. Estos últimos conservan el peinado gratuito anterior.
- **15 comprables:** rulos compactos, rulos medianos, flequillo corto, flequillo largo, largo lacio, largo con ondas, rodete, colita alta, colita baja, media cola, corte moderno corto, corte desmechado, trenzas simples, peinado formal y peinado casual.

Peinados es una categoría real del guardarropa; al iniciar el backend se agrega también su tipo de artículo si falta, conservando los tipos existentes. Mi avatar solo ofrece peinados gratuitos o adquiridos. Al seleccionar se actualiza el borrador; Guardar mi avatar persiste. Cada categoría de equipamiento termina con Conseguí más en la tienda, que abre su filtro correspondiente. No se cobran cambios de base ni colores de pelo. Las miniaturas de pelo muestran cabeza y cabello, sin torso ni accesorios que dificulten comparar cortes.

AvatarHair separa el pelo anterior y posterior; las colitas, trenzas, melenas y rodetes conservan su volumen y posición detrás del cuerpo. La gorra oculta de forma natural la parte superior del pelo mediante un recorte local; quitarla recupera el peinado completo, sin cambiar su ID. Los anteojos, flores y demás accesorios conservan los anclajes de cabeza comunes.

Las configuraciones previas sin base conservan la base original masculina. El servidor admite los documentos anteriores que no incluían hairstyle en equipped cuando el peinado es gratuito; los peinados pagos requieren un comprobante de inventario y un código de equipamiento coincidente. No hay una migración destructiva ni una economía nueva.

## Una configuración y un renderizador

- WalletContext es el estado compartido por Mi avatar, tienda, inicio, perfil y menú del perteneciente. useAvatar es un adaptador de ese contexto, sin un almacenamiento ni un estado propio.
- La selección modifica el borrador compartido inmediatamente. Guardar persiste la configuración completa. Cambiar entre Mi avatar y Tienda conserva el borrador y la categoría del editor. Las opciones distinguen Disponible, Equipado y Sin guardar; se advierte al cerrar o recargar con un borrador pendiente. savedConfig permite identificar lo guardado.
- AvatarRenderer compone el mismo SVG tanto para cuerpo completo como para miniaturas y retratos circulares. AvatarPreview es un contenedor del nuevo renderizador y de la foto personalizada.
- El contrato avatar_json versión 2 contiene config y equipped; equipped contiene los códigos completos del peinado y las cuatro prendas. El backend valida rasgos, categorías, coherencia entre ambos campos e inventario. Se mantienen las rutas y permisos existentes.
- Los indicadores equipado de los registros antiguos son históricos; las vistas nuevas leen exclusivamente avatar_json para decidir qué está puesto.
- Las compras usan POST /api/inventarios-avatares: se conserva la transacción existente que verifica el precio del servidor, bloquea el avatar, impide compras repetidas, descuenta saldo y agrega el comprobante. El frontend refresca los saldos e inventario, sin inventar ni descontar monedas localmente.
- Las lecturas de avatar, saldo, catálogo e inventario usan cache: no-store; el cliente respeta esa opción también para su caché interna. Evita restaurar saldos o compras obsoletos desde sessionStorage. Una respuesta fallida de compra muestra el motivo controlado del servidor y vuelve a sincronizar; nunca se anuncia éxito si falla la respuesta. El controlador conserva los códigos 404/409 y usa 500 con un mensaje público para fallos inesperados.
- Una cuenta real sin sincronización no puede comprar con un saldo de respaldo local. El error es visible y se puede reintentar.

El proveedor se remonta por ID de usuario y cancela la aplicación de respuestas anteriores. La copia local usa tandem:wallet:<id>. No se comparte estado entre pertenecientes. No hay escrituras automáticas sobre un invitado ni saldos de bienvenida inventados.

## Fotos de perfil

Una foto personalizada tiene prioridad sobre el avatar. Si falla su carga, AvatarPreview muestra inmediatamente el personaje actual; una nueva URL puede volver a intentarse. Para reconocer las imágenes generadas antiguas se descartan las URLs de DiceBear y sus rutas de caché conocidas; la URL de origen de una foto subida se conserva. Sin foto se utiliza la configuración nueva, o su valor predeterminado. El recorte de retrato incluye cabeza, cuello y accesorios, sin reducir el personaje entero dentro de un círculo.

Los contactos de chat y las personas vinculadas reciben el retrato nuevo a través de la capa de datos existente. Las fotos de tutores, profesionales y grupos conservan su comportamiento. El backend no vuelve a generar imágenes DiceBear al guardar configuraciones versión 2, evitando sobrescribir una foto personalizada.

## Catálogo y compatibilidad

El catálogo contiene 57 opciones: 22 peinados, 13 prendas superiores, 6 pantalones, 5 calzados y 11 opciones de accesorio (incluida Sin accesorio). Incluye las 10 prendas superiores solicitadas y conserva tres remeras anteriores mediante recursos nuevos; también hay auriculares, medalla, flor, corona y antifaz.

Las opciones iniciales del primer prototipo siguen siendo gratuitas. Las variantes nuevas se consiguen con las monedas existentes. El editor solo muestra prendas gratuitas o desbloqueadas. Las tarjetas y miniaturas utilizan exactamente los SVG del avatar, con el color y el recurso del artículo.

avatarWardrobe.json en el frontend y avatar-wardrobe.json en el backend describen el mismo contrato versionado. Existe una prueba de igualdad cuando ambos repositorios están disponibles juntos. El backend es la autoridad del precio y la propiedad. Para ampliar el catálogo hay que actualizar ambos archivos y agregar una capa si el recurso visual aún no existe.

La migración conserva el JSON anterior como legacyAvatar, los códigos anteriores como legacyInventory y el historial de movimientos. Antes de reemplazar una copia local antigua se guarda tandem:wallet:<id>:legacy-backup; la clave del prototipo anterior también se conserva. Los equivalentes (remeras, gorras, anteojos, corona, etc.) se habilitan por el comprobante de compra original, sin otro cobro.

Los fondos, mascotas y artículos desconocidos no se borran: se consultan en Compras anteriores conservadas, dentro de Mi avatar, con la indicación de que siguen registrados y necesitan adaptación gráfica. No se venden nuevos objetos incompatibles. Las compras que solo existían en un fallback local siguen archivadas; una cuenta real no las presenta como comprobantes del servidor.

## Coordenadas y alineación

Todas las capas usan viewBox 0 0 300 600. Se establecieron anclajes comunes de cintura en y=333 y tobillos en y=533; los centros de tobillo son x=116 y x=176.

El error principal del calzado estaba en la reflexión de la zapatilla derecha: translate(300 0) la desplazaba 8 unidades respecto de la pierna. Se corrigió a la suma de los centros de tobillo, 292. Se ajustaron los extremos de los pantalones a la misma altura y se conservaron las uniones naturales de costuras y cuellos. Las variantes comparten la geometría del recurso; cambiar color no altera la escala ni la posición. No se agregaron parches para ocultar huecos.

Las miniaturas usan recortes explícitos para cada categoría. La gorra tiene una geometría que cubre el volumen del pelo; los detalles textiles derivan del color de la prenda.

La corrección de octubre ajusta directamente los contornos de mangas cortas, mangas largas y puños al ancho real de los brazos. La curva anterior dejaba tiras de piel visibles al costado de buzos y camperas, especialmente en la base femenina. También se bajó el punto de entrepierna del pantalón para cubrir la anatomía y se ajustó la línea posterior de las zapatillas al talón. No se agregaron elementos para tapar huecos. El navegador verifica con isPointInFill que las prendas cubran las regiones correspondientes de brazos, piernas y pies en ambas bases.

## Archivos principales

Frontend:
- src/contexts/WalletContext.tsx: estado compartido, sincronización, compras y guardado.
- src/features/avatar/: catálogo, capas originales, renderizador, editor, migración, retratos y pruebas. AvatarHair.tsx concentra las siluetas de pelo; avatarGeometry.ts adapta cuerpo y ropa a las bases.
- src/data/shopItems.ts y legacyShopItems.ts: adaptación del catálogo y nombres de compras históricas.
- src/data/api.ts: retratos para cuenta, contactos y personas vinculadas.
- src/pages/user/UserShop.tsx: dos apartados, inventario integrado y tienda filtrada, sin equipamiento desde la tienda.
- AvatarPreview, HeaderUserAvatar, AppShell, BelongingProfileAccountPanel, UserHome, UserProfile y UserProfileSettings: integración y prioridad de foto personalizada.
- Se eliminaron src/lib/dicebearAvatar.ts y sus pruebas: ya no tenían consumidores.

Backend:
- src/configs/avatar-wardrobe.json y src/modules/avatar-studio.js: contrato y validación.
- ItemAvatarRepository, ItemAvatarService y server.js: carga aditiva al iniciar.
- AvatarService: validación de propiedad y prevención de regeneración de la imagen antigua.
- test/avatar-studio.test.js: contrato, propiedad, validación e inicialización aditiva.

Archivos tocados en esta última corrección (los demás cambios de la implementación anterior se conservaron):

- Frontend: `src/pages/user/UserShop.tsx`, `src/contexts/WalletContext.tsx`, `src/components/AvatarPreview.tsx`, `src/data/shopItems.ts`, `src/services/api/client.ts`, `src/services/api/client.cache.test.ts`.
- Motor y editor: `src/features/avatar/AvatarEditor.tsx`, `AvatarLayers.tsx`, `AvatarRenderer.tsx`, `avatar.css`, `AvatarEditor.test.tsx`; nuevo `avatar-flow.browser.cjs` en la misma carpeta.
- Backend: `src/controllers/InventarioAvatarController.js`, `src/services/InventarioAvatarService.js`; nuevo `test/avatar-purchase-postgres.test.js`.
- Documentación: este archivo. No se agregaron dependencias ni se modificó el esquema de la base.

## Verificación y límites

Frontend: 593 pruebas aprobadas; TypeScript sin errores; lint sin errores y con 143 advertencias existentes; build de producción aprobado, con advertencias de tamaño de chunks. Backend: 96 pruebas de autorización, 7 específicas de avatares y la suite PostgreSQL de compras, además de comprobación de sintaxis. El backend no define comandos generales de lint ni build.

Se comprueban automáticamente las 8.580 combinaciones de base/top/pantalón/calzado/accesorio: recursos presentes, integridad del SVG y geometría estable del cuerpo. También se validan los 484 cruces de base/peinado/accesorio y que las 22 siluetas sean distintas. Esto no equivale a inspeccionar visualmente las 8.580 imágenes.

Para repetir los recorridos de navegador con Vite activo: `node src/features/avatar/avatar-flow.browser.cjs`. Usa Edge/Playwright con API y autenticación simuladas, sin cuentas reales. Comprueba los recorridos A–F, navegación de dos apartados, conservación del borrador, rechazo del servidor, cuentas separadas, cierre/nuevo inicio de sesión, teclado, movimiento reducido y mobile. Genera capturas en `%TEMP%/tandem-avatar-final-review`: las 13 prendas superiores por base, los 30 cruces pantalón/calzado por base y los 22 peinados con cuatro estados de accesorio por base, además de primeros planos y pantallas desktop/mobile. `AVATAR_ATLAS_ONLY=1` ejecuta solo las capturas y comprobaciones geométricas.

En PowerShell, desde backend: `$env:AVATAR_POSTGRES_TEST='1'; node --test test/avatar-purchase-postgres.test.js`. Ejecuta el controlador HTTP y las consultas reales usando tablas temporales con tipos e índices de la base configurada y secuencias propias. Se verifican compra de ropa y peinado, precio del servidor, recompra, saldo insuficiente y rollback del descuento si falla el inventario. Todo termina con ROLLBACK: no cambia filas, secuencias, saldos ni compras reales. No sustituye una prueba completa con JWT y una cuenta de prueba. La autorización se prueba separadamente con `npm run test:authorization`.

**Pendiente de validación:** una sesión autenticada de prueba contra la API y PostgreSQL juntos, incluyendo concurrencia de compras. No se dispone de una base local descartable activa (Docker no está iniciado); no se alteraron saldos reales para simular ese recorrido. Las capturas y pruebas controladas no se presentan como compras reales de usuarios.

Los lectores de pantalla reales, dispositivos físicos y la valoración con usuarios siguen requiriendo revisión manual. Los fondos y mascotas históricos requieren recursos gráficos compatibles antes de volver a equiparse. Las fotos personalizadas continúan usando el almacenamiento existente.

El arte SVG es original del proyecto; no se incorporaron imágenes ni dependencias externas nuevas. La investigación previa de [PeepStudio](https://github.com/Hantuhan/peepstudio) y [Avatar Builder](https://github.com/AakashKakkar/avatar-builder) sigue respaldando conservar el motor propio: evita rehacer poses completas o incorporar un renderizador Python. Open Peeps declara CC0 para su arte; Avatar Builder declara MIT para el código y documenta procedencias mixtas del arte. No se importó código ni arte de esas alternativas.

Los cambios permanecen en dev en ambos repositorios, sin commits, pushes ni promociones.
