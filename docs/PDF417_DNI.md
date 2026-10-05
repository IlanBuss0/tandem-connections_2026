# Experimento PDF417 del DNI argentino

## Librería

Se utiliza `@zxing/browser` **0.2.1**, sobre el núcleo open source `@zxing/library`. La API incluye `BrowserPDF417Reader` y `decodeFromConstraints`, por lo que el navegador analiza la cámara localmente y puede solicitar `facingMode: environment` en mobile. ZXing declara soporte para PDF417 y su capa browser usa `MediaDevices`.

Se eligió por ser open source, sin costo, TypeScript-friendly y con un lector específico de PDF417. No se incorporó OCR ni una API externa.

## Cómo probarlo

1. Ejecutar `npm run dev`.
2. Abrir `/test/pdf417` en un contexto seguro (`localhost` o HTTPS).
3. Presionar **Abrir cámara** y permitir el acceso.
4. Mostrar el **frente** completo del DNI dentro del recuadro; el lector busca automáticamente el PDF417.
5. Al detectar el código, la cámara se detiene y se muestra el contenido textual real entregado por ZXing.

La pantalla no sube video, no guarda imágenes y no integra REFEPS, OCR ni registro.

## Datos y resultado actual

No se inventa ni se parsea ningún campo: el experimento muestra `Result.getText()` tal cual lo devuelve ZXing. Para documentar nombre, apellido, DNI, fechas, sexo u otros campos hace falta una prueba manual con un DNI argentino real y conservar únicamente el texto de salida no sensible en el informe de prueba. No se pudo ejecutar esa prueba física desde este entorno.

## Compatibilidad y limitaciones

- Compatible con navegadores modernos que soporten `MediaDevices`, permisos de cámara y `BigInt`.
- En mobile solicita preferentemente la cámara trasera mediante `facingMode: environment`; la selección efectiva depende del navegador/dispositivo.
- Safari/iOS requiere HTTPS o localhost y puede tener diferencias de permisos entre versiones.
- El tiempo de detección depende de foco, iluminación, tamaño del código y dispositivo; no se midió con un DNI real en este entorno.
- El lector informa ausencia de detección, pero no implementa análisis avanzado de distancia, blur o reflejos.

## Conclusión

**PDF417: FUNCIONA CON LIMITACIONES (implementación lista para prueba manual).**

**Datos obtenidos:** texto crudo devuelto por ZXing; falta comprobar empíricamente el formato de DNI argentinos reales.

**¿Es suficientemente confiable para integrarlo al registro?** NO TODAVÍA; requiere pruebas reales en Android, iPhone y distintos DNI.

**¿Reemplaza al OCR?** NO TODAVÍA; la decisión queda pendiente de validar contenido, cobertura y tasa de lectura.
