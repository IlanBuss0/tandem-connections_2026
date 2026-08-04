// ===== Tipos y datos de mini-juegos =====
// Compatibles con Activity (campos opcionales nuevos en mockData).

export type GameType =
  | 'multiple-choice'   // pictograma + 4 opciones
  | 'drag-word'         // arrastrar palabra correcta a la imagen
  | 'wheel'             // ruleta: gira y resuelve la palabra que toca
  | 'memory'            // parejas (memoria)
  | 'sequence-order'    // ordenar pasos en el orden correcto
  | 'true-false'        // verdadero/falso con afirmaciones
  | 'count-objects'     // contar emojis en pantalla
  | 'fill-blank'        // completar la oración con la palabra correcta
  | 'matching-pairs'    // unir A↔B (palabra ↔ pictograma)
  | 'category-sort'     // arrastrar a la categoría correcta
  | 'sound-match'       // ¿qué emoji hace este sonido? (texto onomatopéyico)
  | 'tap-correct'       // tocar todas las opciones correctas (selección múltiple)
  | 'routine-sequence'; // familia compartida de secuencias y rutinas

import type { RoutineSequenceData, RoutineSequenceResult } from './routineSequence';
export type MiniGameResult = RoutineSequenceResult | { gameType: GameType; score: number };

// Una "ronda" o ítem dentro del juego
export interface MCItem { prompt: string; image: string; options: string[]; correct: number; }
export interface DragWordItem { image: string; correct: string; letters: string[]; }
export interface WheelRound { targetWord: string; image: string; options: string[]; correct: number; }
export interface WheelSettings { segments: number; initialSpeed: number; speedIncrease: boolean; }
export interface WheelItem { rounds: WheelRound[]; settings: WheelSettings; }
export interface LegacyWheelItem { words: string[]; }
export interface MemorySettings {
  previewEnabled: boolean;
  previewSeconds: number;
  timed: boolean;
  timeLimitSeconds: number;
}
export interface MemoryPair { a: string; b: string; aLabel?: string; bLabel?: string; }
export interface MemoryItem { pairs: MemoryPair[]; settings?: MemorySettings; }
export interface SequenceItem { prompt: string; steps: string[]; }
export interface TFItem { statement: string; answer: boolean; }
export interface CountItem { emoji: string; count: number; decoys?: string[]; }
export interface FillBlankItem { sentence: string; options: string[]; correct: number; }
export interface MatchingItem { left: string[]; right: string[]; correctMap: number[]; }
export interface CategorySortItem { categories: { name: string; emoji: string }[]; items: { label: string; categoryIndex: number }[]; }
export interface SoundMatchItem { sound: string; options: string[]; correct: number; }
export interface TapCorrectItem { prompt: string; options: string[]; correctIdx: number[]; }

export interface GameData {
  // Cada juego puede tener una de estas estructuras
  rounds?: MCItem[];
  dragRounds?: DragWordItem[];
  wheel?: WheelItem | LegacyWheelItem;
  memory?: MemoryItem;
  sequence?: SequenceItem;
  tf?: TFItem[];
  count?: CountItem[];
  fill?: FillBlankItem[];
  matching?: MatchingItem;
  category?: CategorySortItem;
  sound?: SoundMatchItem[];
  tap?: TapCorrectItem[];
  routineSequence?: RoutineSequenceData;
}

// ===== Plantillas de mini-juegos =====
import type { ActivityTemplate } from './activityTemplates';

export interface GameTemplate extends ActivityTemplate {
  gameType: GameType;
  gameData: GameData;
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'gtpl-mc-animals',
    name: '¿Qué animal es?',
    emoji: '🐶',
    category: 'comunicación',
    type: 'juego',
    difficulty: 'fácil',
    duration: '5 min',
    objective: 'Reconocer animales por imagen',
    description: 'Mirá el pictograma y elegí la opción correcta entre 4.',
    steps: ['Reconocer animales'],
    stepIcons: ['🎯'],
    points: 50,
    completionMessage: '¡Muy bien! Reconocés un montón de animales.',
    tags: ['multiple-choice','animales'],
    gameType: 'multiple-choice',
    gameData: {
      rounds: [
        { prompt: '¿Qué animal es?', image: '🐶', options: ['Gato','Perro','Pato','Ratón'], correct: 1 },
        { prompt: '¿Qué animal es?', image: '🐱', options: ['Perro','León','Gato','Conejo'], correct: 2 },
        { prompt: '¿Qué animal es?', image: '🐘', options: ['Elefante','Hipopótamo','Rinoceronte','Vaca'], correct: 0 },
        { prompt: '¿Qué animal es?', image: '🦒', options: ['Cebra','Caballo','Jirafa','Camello'], correct: 2 },
        { prompt: '¿Qué animal es?', image: '🐧', options: ['Pingüino','Pato','Cisne','Gallina'], correct: 0 },
      ],
    },
  },
  {
    id: 'gtpl-mc-emotions',
    name: 'Reconocer emociones',
    emoji: '😊',
    category: 'emociones',
    type: 'juego',
    difficulty: 'fácil',
    duration: '5 min',
    objective: 'Identificar emociones por la cara',
    description: 'Mirá la cara y elegí qué emoción siente.',
    steps: ['Identificar emociones'],
    stepIcons: ['💭'],
    points: 60,
    completionMessage: '¡Genial! Cada vez identificás mejor las emociones.',
    tags: ['multiple-choice','emociones'],
    gameType: 'multiple-choice',
    gameData: {
      rounds: [
        { prompt: '¿Cómo se siente?', image: '😊', options: ['Triste','Contento','Enojado','Asustado'], correct: 1 },
        { prompt: '¿Cómo se siente?', image: '😢', options: ['Sorprendido','Feliz','Triste','Aburrido'], correct: 2 },
        { prompt: '¿Cómo se siente?', image: '😡', options: ['Enojado','Cansado','Avergonzado','Tranquilo'], correct: 0 },
        { prompt: '¿Cómo se siente?', image: '😨', options: ['Contento','Confundido','Asustado','Orgulloso'], correct: 2 },
        { prompt: '¿Cómo se siente?', image: '😴', options: ['Cansado','Enojado','Sorprendido','Feliz'], correct: 0 },
      ],
    },
  },
  {
    id: 'gtpl-drag-fruits',
    name: 'Armá la palabra: frutas',
    emoji: '🍎',
    category: 'comunicación',
    type: 'juego',
    difficulty: 'fácil',
    duration: '5 min',
    objective: 'Construir la palabra arrastrando letras',
    description: 'Mirá el pictograma y armá la palabra arrastrando cada letra a su lugar.',
    steps: ['Arrastrar letras para formar la palabra'],
    stepIcons: ['👆'],
    points: 55,
    completionMessage: '¡Excelente! Construiste palabras como un campeón.',
    tags: ['drag','frutas'],
    gameType: 'drag-word',
    gameData: {
      dragRounds: [
        { image: '🍎', correct: 'manzana', letters: [] },
        { image: '🍌', correct: 'banana', letters: [] },
        { image: '🍇', correct: 'uva', letters: [] },
        { image: '🍊', correct: 'naranja', letters: [] },
        { image: '🍉', correct: 'sandia', letters: [] },
      ],
    },
  },
  {
    id: 'gtpl-wheel-precision',
    name: 'Ruleta de precisión: frutas',
    emoji: '🎡',
    category: 'comunicación',
    type: 'juego',
    difficulty: 'fácil',
    duration: '5 min',
    objective: 'Reconocer frutas por su pictograma',
    description: 'Frená la ruleta cuando el pictograma indicado quede bajo la flecha.',
    steps: ['Leer la palabra', 'Girar la ruleta', 'Frenar en el pictograma correcto'],
    stepIcons: ['👀', '🎡', '👆'],
    points: 60,
    completionMessage: '¡Excelente precisión! Encontraste las frutas.',
    tags: ['wheel','frutas','pictogramas'],
    gameType: 'wheel',
    gameData: { wheel: {
      settings: { segments: 6, initialSpeed: 3, speedIncrease: true },
      rounds: [
        // Antes usaba pictogramas de Blissymbolics (simbolos abstractos que se
        // sacaron del catalogo por ilegibles para CAA, ver
        // license-whitelist.js GLOBAL_SYMBOLS_BLOCKED_SETS). Se reemplaza por
        // emoji, igual que el resto de los juegos de este archivo.
        { targetWord: 'MANZANA', image: '🍎', options: ['🍎','🍌','🍊','🍇','🍉','🍓'], correct: 0 },
        { targetWord: 'BANANA', image: '🍌', options: ['🍇','🍌','🍉','🍎','🍓','🍊'], correct: 1 },
        { targetWord: 'NARANJA', image: '🍊', options: ['🍓','🍉','🍊','🍌','🍇','🍎'], correct: 2 },
      ],
    } },
  },
  {
    id: 'gtpl-memory-objects',
    name: 'Memoria: objetos del cole',
    emoji: '🧠',
    category: 'escuela',
    type: 'juego',
    difficulty: 'medio',
    duration: '7 min',
    objective: 'Memorizar y encontrar parejas',
    description: 'Encontrá las parejas de pictogramas y palabras.',
    steps: ['Encontrar parejas'],
    stepIcons: ['🃏'],
    points: 70,
    completionMessage: '¡Memoria de elefante! Encontraste todas las parejas.',
    tags: ['memory','escuela'],
    gameType: 'memory',
    gameData: {
      memory: { pairs: [
        { a: '✏️', b: 'Lápiz' },
        { a: '📚', b: 'Libro' },
        { a: '🎒', b: 'Mochila' },
        { a: '📝', b: 'Cuaderno' },
        { a: '✂️', b: 'Tijera' },
        { a: '📏', b: 'Regla' },
      ]},
    },
  },
  {
    id: 'gtpl-sequence-morning',
    name: 'Ordená la mañana',
    emoji: '🔢',
    category: 'autonomía personal',
    type: 'juego',
    difficulty: 'fácil',
    duration: '5 min',
    objective: 'Comprender el orden de la rutina matutina',
    description: 'Ordená los pasos en el orden correcto.',
    steps: ['Ordenar los pasos'],
    stepIcons: ['🧩'],
    points: 50,
    completionMessage: '¡Excelente! Tenés clarísimo el orden de la mañana.',
    tags: ['sequence','rutina'],
    gameType: 'sequence-order',
    gameData: {
      sequence: { prompt: 'Ordená la rutina matutina:', steps: ['Despertarse ⏰','Lavarse la cara 💦','Vestirse 👕','Desayunar 🥣','Cepillarse los dientes 🪥'] },
    },
  },
  {
    id: 'gtpl-tf-safety',
    name: '¿Seguro o peligroso?',
    emoji: '✅',
    category: 'seguridad personal',
    type: 'juego',
    difficulty: 'fácil',
    duration: '5 min',
    objective: 'Diferenciar conductas seguras de riesgosas',
    description: 'Decidí si la afirmación es verdadera o falsa.',
    steps: ['Verdadero o falso'],
    stepIcons: ['❓'],
    points: 60,
    completionMessage: '¡Muy bien! Sabés cuidarte.',
    tags: ['true-false','seguridad'],
    gameType: 'true-false',
    gameData: {
      tf: [
        { statement: 'Cruzo la calle solo cuando el semáforo está en verde.', answer: true },
        { statement: 'Le doy mi dirección a un desconocido por internet.', answer: false },
        { statement: 'Si me pierdo, busco a un policía o un adulto de confianza.', answer: true },
        { statement: 'Toco enchufes con las manos mojadas.', answer: false },
        { statement: 'Antes de salir, aviso a un adulto.', answer: true },
      ],
    },
  },
  {
    id: 'gtpl-count-objects',
    name: 'Contá los objetos',
    emoji: '🔢',
    category: 'escuela',
    type: 'juego',
    difficulty: 'fácil',
    duration: '5 min',
    objective: 'Practicar conteo',
    description: 'Contá cuántos hay en pantalla y elegí el número.',
    steps: ['Contar y elegir'],
    stepIcons: ['🔢'],
    points: 45,
    completionMessage: '¡Excelente! Contaste todo bien.',
    tags: ['count','matemática'],
    gameType: 'count-objects',
    gameData: {
      count: [
        { emoji: '🍎', count: 4 },
        { emoji: '⚽', count: 6 },
        { emoji: '🌟', count: 8 },
        { emoji: '🐱', count: 3 },
        { emoji: '🚗', count: 5 },
      ],
    },
  },
  {
    id: 'gtpl-fill-blank',
    name: 'Completá la oración',
    emoji: '📝',
    category: 'comunicación',
    type: 'juego',
    difficulty: 'medio',
    duration: '5 min',
    objective: 'Comprender el sentido de oraciones simples',
    description: 'Elegí la palabra que mejor completa la oración.',
    steps: ['Completar oraciones'],
    stepIcons: ['💬'],
    points: 55,
    completionMessage: '¡Bien hecho! Tu vocabulario está creciendo.',
    tags: ['fill-blank','lectura'],
    gameType: 'fill-blank',
    gameData: {
      fill: [
        { sentence: 'Cuando tengo sed, tomo ___.', options: ['agua','arena','piedras','lápices'], correct: 0 },
        { sentence: 'Para dormir, voy a la ___.', options: ['cocina','cama','escuela','calle'], correct: 1 },
        { sentence: 'En invierno hace ___.', options: ['calor','viento','frío','sol'], correct: 2 },
        { sentence: 'El perro ___ cuando está contento.', options: ['llora','ladra','vuela','nada'], correct: 1 },
        { sentence: 'Para escribir uso un ___.', options: ['lápiz','vaso','tenedor','reloj'], correct: 0 },
      ],
    },
  },
  {
    id: 'gtpl-matching-pairs',
    name: 'Unir palabra y pictograma',
    emoji: '🔗',
    category: 'comunicación',
    type: 'juego',
    difficulty: 'fácil',
    duration: '5 min',
    objective: 'Asociar palabras con imágenes',
    description: 'Tocá una palabra y luego el pictograma que le corresponde.',
    steps: ['Unir parejas'],
    stepIcons: ['🔗'],
    points: 60,
    completionMessage: '¡Perfecto! Uniste todas las parejas.',
    tags: ['matching','vocabulario'],
    gameType: 'matching-pairs',
    gameData: {
      matching: {
        left: ['Sol','Luna','Casa','Auto','Pelota'],
        right: ['🚗','🌞','⚽','🏠','🌙'],
        correctMap: [1, 4, 3, 0, 2],
      },
    },
  },
  {
    id: 'gtpl-category-sort',
    name: 'Clasificá en categorías',
    emoji: '🗂️',
    category: 'comunicación',
    type: 'juego',
    difficulty: 'medio',
    duration: '7 min',
    objective: 'Clasificar palabras en categorías',
    description: 'Tocá la palabra y luego la categoría correcta.',
    steps: ['Clasificar'],
    stepIcons: ['🗂️'],
    points: 70,
    completionMessage: '¡Muy bien! Sabés agrupar muy bien.',
    tags: ['category','clasificar'],
    gameType: 'category-sort',
    gameData: {
      category: {
        categories: [
          { name: 'Frutas', emoji: '🍎' },
          { name: 'Animales', emoji: '🐶' },
          { name: 'Vehículos', emoji: '🚗' },
        ],
        items: [
          { label: 'Banana', categoryIndex: 0 },
          { label: 'Perro', categoryIndex: 1 },
          { label: 'Auto', categoryIndex: 2 },
          { label: 'Manzana', categoryIndex: 0 },
          { label: 'Avión', categoryIndex: 2 },
          { label: 'Gato', categoryIndex: 1 },
          { label: 'Tren', categoryIndex: 2 },
          { label: 'León', categoryIndex: 1 },
          { label: 'Pera', categoryIndex: 0 },
        ],
      },
    },
  },
  {
    id: 'gtpl-sound-match',
    name: '¿Quién hace ese sonido?',
    emoji: '🔊',
    category: 'comunicación',
    type: 'juego',
    difficulty: 'fácil',
    duration: '5 min',
    objective: 'Asociar sonidos con su origen',
    description: 'Leé el sonido y elegí qué lo produce.',
    steps: ['Identificar sonidos'],
    stepIcons: ['🔊'],
    points: 50,
    completionMessage: '¡Tenés muy buen oído!',
    tags: ['sound','sonidos'],
    gameType: 'sound-match',
    gameData: {
      sound: [
        { sound: 'Guau guau', options: ['🐱','🐶','🐮','🐤'], correct: 1 },
        { sound: 'Miau', options: ['🐶','🐱','🐔','🐷'], correct: 1 },
        { sound: 'Muu', options: ['🐮','🐷','🦁','🐔'], correct: 0 },
        { sound: 'Pío pío', options: ['🐤','🐶','🐮','🐷'], correct: 0 },
        { sound: 'Brrrum', options: ['🚲','🚗','🚂','🚀'], correct: 1 },
      ],
    },
  },
  {
    id: 'gtpl-tap-correct',
    name: 'Tocá los saludables',
    emoji: '🥕',
    category: 'cocina básica',
    type: 'juego',
    difficulty: 'fácil',
    duration: '5 min',
    objective: 'Distinguir alimentos saludables',
    description: 'Tocá todas las opciones correctas.',
    steps: ['Selección múltiple'],
    stepIcons: ['🥗'],
    points: 60,
    completionMessage: '¡Sabés elegir alimentos saludables!',
    tags: ['multi-select','salud'],
    gameType: 'tap-correct',
    gameData: {
      tap: [
        { prompt: 'Tocá los alimentos saludables:', options: ['🥕','🍔','🍎','🍟','🥦','🍰'], correctIdx: [0, 2, 4] },
        { prompt: 'Tocá las frutas:', options: ['🍇','🥩','🍌','🍕','🍓','🥖'], correctIdx: [0, 2, 4] },
        { prompt: 'Tocá los líquidos para tomar:', options: ['💧','🪨','🥛','🌳','🧃','🪑'], correctIdx: [0, 2, 4] },
      ],
    },
  },
  ...buildRoutineSequenceTemplates(),
];

function buildRoutineSequenceTemplates(): GameTemplate[] {
  const make = (id: string, name: string, emoji: string, mode: RoutineSequenceData['mode'], texts: string[], extras: Partial<RoutineSequenceData> = {}): GameTemplate => {
    const cards = texts.map((text, index) => ({ id: `${id}-step-${index + 1}`, text, emoji: ['⏰','🚿','👕','🥣','🎒','✅','🌧️','🤝'][index] || '📌', accessibleLabel: text }));
    const stepIds = cards.slice(0, Math.min(8, Math.max(3, cards.length))).map(card => card.id);
    const data: RoutineSequenceData = { schemaVersion: 1, mode, prompt: name, supportLevel: mode === 'order' ? 'initial' : 'intermediate', cards, stepIds, acceptedOrders: [stepIds], hintsEnabled: true, ...extras };
    return { id, name, emoji, category: mode === 'plan-b' ? 'anticipación de cambios' : 'autonomía personal', type: 'juego', difficulty: mode === 'order' ? 'fácil' : 'medio', duration: '5 min', objective: name, description: 'Actividad visual de secuencias y rutinas.', steps: ['Resolver la secuencia'], stepIcons: [emoji], points: 60, completionMessage: '¡Muy bien! Practicaste esta rutina.', tags: ['rutina', mode], gameType: 'routine-sequence', gameData: { routineSequence: data } };
  };
  const morning = make('gtpl-routine-morning', 'Armá tu rutina de la mañana', '🌅', 'order', ['Despertarse','Lavarse la cara','Vestirse','Desayunar']);
  const dental = make('gtpl-routine-dental', '¿Qué viene después al lavarse los dientes?', '🪥', 'next', ['Buscar el cepillo','Poner pasta dental','Cepillarse','Enjuagarse'], { rounds: [{ id: 'dental-round-1', sequenceIds: ['gtpl-routine-dental-step-1'], optionIds: ['gtpl-routine-dental-step-2','gtpl-routine-dental-step-4'], acceptedIds: ['gtpl-routine-dental-step-2'] }] });
  const backpack = make('gtpl-routine-backpack', 'Encontrá el paso que falta', '🎒', 'missing', ['Mirar el horario','Buscar los útiles','Guardarlos en la mochila','Cerrar la mochila'], { rounds: [{ id: 'backpack-round-1', sequenceIds: ['gtpl-routine-backpack-step-1','gtpl-routine-backpack-step-3','gtpl-routine-backpack-step-4'], optionIds: ['gtpl-routine-backpack-step-2','gtpl-routine-backpack-step-4'], acceptedIds: ['gtpl-routine-backpack-step-2'] }] });
  const detective = make('gtpl-routine-detective', 'Detective de rutinas', '🕵️', 'detective', ['Abrir la canilla','Mojarse las manos','Tocar el enchufe con las manos mojadas','Secarse las manos','Pedir ayuda a una persona de confianza'], { rounds: [{ id: 'detective-round-1', sequenceIds: ['gtpl-routine-detective-step-1','gtpl-routine-detective-step-2','gtpl-routine-detective-step-3','gtpl-routine-detective-step-4'], conflictId: 'gtpl-routine-detective-step-3', optionIds: ['gtpl-routine-detective-step-4','gtpl-routine-detective-step-5'], acceptedIds: ['gtpl-routine-detective-step-5'], explanation: 'Con las manos mojadas es más seguro alejarse del enchufe y pedir ayuda.' }] });
  const planB = make('gtpl-routine-plan-b', 'Plan B para un día de lluvia', '🌧️', 'plan-b', ['Preparar la salida','Revisar el clima','Llevar paraguas','Esperar bajo techo','Pedir ayuda'], { rounds: [{ id: 'rain-round-1', prompt: 'Hoy llueve antes de salir. ¿Qué puede ayudar?', optionIds: ['gtpl-routine-plan-b-step-3','gtpl-routine-plan-b-step-4','gtpl-routine-plan-b-step-5'], acceptedIds: ['gtpl-routine-plan-b-step-3','gtpl-routine-plan-b-step-4','gtpl-routine-plan-b-step-5'], explanation: 'Hay varias alternativas posibles: protegerse de la lluvia, esperar o pedir ayuda.' }] });
  return [morning, dental, backpack, detective, planB];
}
