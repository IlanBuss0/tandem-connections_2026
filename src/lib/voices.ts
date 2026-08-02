// Unica responsabilidad: elegir que voz de sintesis usar (Sesion 6, cierre
// del item 2 del roadmap: "TTS en espanol rioplatense"). Separado de
// speech.ts (que solo habla) porque elegir voz es una decision distinta —
// depende de que voces instalo el sistema operativo/navegador, que varia
// por dispositivo, y conviene poder testearla sola.
//
// Preferencia: es-AR (rioplatense) > cualquier es-* (mejor un acento
// espanol que ninguno) > null (deja que el navegador use su default).
const PREFERRED_LANG = 'es-AR';

export function pickSpanishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  const exact = voices.find((v) => v.lang?.toLowerCase() === PREFERRED_LANG.toLowerCase());
  if (exact) return exact;

  const anySpanish = voices.find((v) => v.lang?.toLowerCase().startsWith('es'));
  return anySpanish || null;
}

// Las voces del navegador a veces cargan de forma asincronica (Chrome sobre
// todo): la primera llamada a getVoices() puede devolver []. Se resuelve
// cuando esten listas, o de una si ya lo estaban.
export function getSpanishVoiceAsync(): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve(null);

  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing.length > 0) return Promise.resolve(pickSpanishVoice(existing));

  return new Promise((resolve) => {
    const handler = () => {
      synth.removeEventListener('voiceschanged', handler);
      resolve(pickSpanishVoice(synth.getVoices()));
    };
    synth.addEventListener('voiceschanged', handler);
    // Si el evento nunca llega (algunos navegadores no lo disparan), no
    // dejar la promesa colgada para siempre.
    setTimeout(() => {
      synth.removeEventListener('voiceschanged', handler);
      resolve(pickSpanishVoice(synth.getVoices()));
    }, 1000);
  });
}
