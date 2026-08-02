import { getSpanishVoiceAsync } from './voices';

// Unica responsabilidad: leer un texto en voz alta (Sesion 5 — TTS). Usa la
// Web Speech API del navegador, misma tecnologia que ya usa el lector de
// pagina de accesibilidad (AccessibilityWidget.tsx), pero como utilidad
// aparte: esta es para leer UN item puntual (un paso, un evento, una frase
// traducida) al tocar un boton, no toda la pantalla.
//
// Nunca lanza: si el navegador no soporta speechSynthesis, el boton que la
// use simplemente no hace nada en vez de romper la pantalla.
export async function speakText(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    // Rioplatense si el sistema tiene esa voz instalada; si no, cualquier
    // es-* es mejor que el default de espanol de Espana que quedaba antes.
    const voice = await getSpanishVoiceAsync();
    utterance.lang = voice?.lang || 'es-AR';
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch {
    // silencioso: no hay fallback visual util para un error de sintesis de voz
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.speechSynthesis);
}
