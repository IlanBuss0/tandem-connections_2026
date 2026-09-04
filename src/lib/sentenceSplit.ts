// Unica responsabilidad: partir un texto libre (pegado de un chat, un
// mensaje, un parrafo) en unidades cortas para pictogramizar una por una.
// Puro, sin red ni estado — el traductor manual (Sesion 4) es el unico
// consumidor hoy.
//
// Por que hacia falta: el traductor solo partia por salto de linea, asi que
// pegar una oracion con puntuacion (o un mensaje de WhatsApp con varias
// frases seguidas) daba UNA sola "frase" gigante, y el motor de conceptos
// esta afinado para pasos cortos, no parrafos enteros.
//
// Reglas de corte, en orden — el salto de linea explicito del usuario
// siempre se respeta primero (si alguien ya escribio una por renglon, eso
// no cambia):
// 1. Saltos de linea
// 2. Fin de oracion: . ! ? seguido de espacio o fin de texto (evita cortar
//    en numeros como "3.5" al exigir que despues venga un espacio o nada)
// 3. Punto y coma
export function splitIntoPhrases(text: string): string[] {
  return text
    .split('\n')
    .flatMap((line) => line.split(/(?<=[.!?])\s+|;\s*/))
    .map((phrase) => phrase.trim().replace(/[.!?;]+$/, '').trim())
    .filter(Boolean);
}
