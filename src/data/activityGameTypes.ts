import type { GameData, GameType } from './miniGames';
import { DEFAULT_MEMORY_SETTINGS } from './memoryGame';
import { emptyResourceScenario } from './resourceScenario';

export type ActivityGameTypeOption = {
  type: GameType;
  label: string;
  description: string;
  emoji: string;
  available: boolean;
};

const AVAILABLE_GAME_TYPES = new Set<GameType>([
  'multiple-choice', 'drag-word', 'wheel', 'memory', 'routine-sequence', 'resource-scenario',
]);

export const ACTIVITY_GAME_TYPES: ActivityGameTypeOption[] = [
  { type: 'multiple-choice', label: 'Opción múltiple', description: 'Elegir la respuesta correcta entre varias opciones.', emoji: '🎯', available: true },
  { type: 'drag-word', label: 'Armá la palabra', description: 'Ordenar letras con apoyo de un pictograma.', emoji: '🔤', available: true },
  { type: 'wheel', label: 'Ruleta', description: 'Girar y reconocer la opción indicada.', emoji: '🎡', available: true },
  { type: 'memory', label: 'Memoria', description: 'Encontrar y relacionar parejas.', emoji: '🧠', available: true },
  { type: 'routine-sequence', label: 'Secuencia de rutina', description: 'Construir y practicar rutinas visuales.', emoji: '🧩', available: true },
  { type: 'resource-scenario', label: 'Compra con presupuesto', description: 'Buscar los productos de una lista y armar un carrito sin gastar de más.', emoji: '🛒', available: true },
  { type: 'sequence-order', label: 'Ordenar secuencia', description: 'Ordenar elementos en una secuencia.', emoji: '🔢', available: false },
  { type: 'true-false', label: 'Verdadero o falso', description: 'Evaluar afirmaciones simples.', emoji: '✅', available: false },
  { type: 'count-objects', label: 'Contar objetos', description: 'Contar elementos y elegir una cantidad.', emoji: '🔢', available: false },
  { type: 'fill-blank', label: 'Completar oración', description: 'Elegir la palabra que falta.', emoji: '📝', available: false },
  { type: 'matching-pairs', label: 'Unir parejas', description: 'Relacionar palabras y pictogramas.', emoji: '🔗', available: false },
  { type: 'category-sort', label: 'Clasificar categorías', description: 'Agrupar elementos por categoría.', emoji: '🗂️', available: false },
  { type: 'sound-match', label: 'Relacionar sonidos', description: 'Asociar sonidos con su origen.', emoji: '🔊', available: false },
  { type: 'tap-correct', label: 'Selección múltiple', description: 'Marcar todas las opciones correctas.', emoji: '👆', available: false },
];

const orderByType = new Map(ACTIVITY_GAME_TYPES.map((option, index) => [option.type, index]));

export function isGameTypeAvailable(type: GameType): boolean {
  return AVAILABLE_GAME_TYPES.has(type);
}

export function gameTypeOrder(type: GameType): number {
  return orderByType.get(type) ?? Number.MAX_SAFE_INTEGER;
}

export function emptyGameData(type: GameType): GameData {
  if (type === 'multiple-choice') return { rounds: [{ image: '', prompt: '', options: ['', '', '', ''], correct: 0 }] };
  if (type === 'drag-word') return { dragRounds: [{ image: '', correct: '', letters: [] }] };
  if (type === 'wheel') return { wheel: { settings: { segments: 4, initialSpeed: 3, speedIncrease: false }, rounds: [] } };
  if (type === 'memory') return { memory: { pairs: [], settings: { ...DEFAULT_MEMORY_SETTINGS } } };
  if (type === 'routine-sequence') return {
    routineSequence: {
      schemaVersion: 1,
      mode: 'order',
      prompt: '',
      supportLevel: 'initial',
      cards: [],
      stepIds: [],
      acceptedOrders: [],
      hintsEnabled: true,
    },
  };
  if (type === 'resource-scenario') return { resourceScenario: emptyResourceScenario() };
  return {};
}
