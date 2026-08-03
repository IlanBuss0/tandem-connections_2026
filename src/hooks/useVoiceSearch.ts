import { useCallback, useEffect, useRef, useState } from 'react';

// Unica responsabilidad: manejar el ciclo de vida de la Web Speech API
// para "búsqueda por voz" (Sesion 21, item 49) — arrancar/parar el
// reconocimiento, exponer si esta escuchando, y avisar cuando hay un
// resultado final. No sabe nada de pictogramas ni de que pantalla lo usa:
// cualquier buscador de texto lo puede consumir (UserPictograms,
// RoutinePictogramPicker, el comunicador).
//
// SpeechRecognition no tiene tipos oficiales en TS DOM lib todavia, asi
// que se declara el minimo indispensable aca en vez de traer una libreria
// solo para esto.
interface MinimalSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceSearchSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function useVoiceSearch(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  useEffect(() => () => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'es-AR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onResult(transcript.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, start, stop, supported: isVoiceSearchSupported() };
}
