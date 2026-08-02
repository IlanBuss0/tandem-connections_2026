// Espejo en TS del modelo de enunciado del backend
// (backend/src/modules/communication/utterance.js). Puro, sin red ni
// estado — el comunicador (Sesion 11) es el primer consumidor.
export interface UtteranceToken {
  type: 'pictogram' | 'text';
  pictogramId?: string;
  text: string;
}

export function utteranceToText(tokens: UtteranceToken[]): string {
  return tokens.map((t) => t.text.trim()).filter(Boolean).join(' ');
}
