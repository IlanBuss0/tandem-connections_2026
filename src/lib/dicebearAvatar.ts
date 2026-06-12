import type { AvatarAppearance, AvatarEquipped, AvatarClothing } from '@/contexts/WalletContext';

const API_BASE = 'https://api.dicebear.com/9.x/avataaars';

const SKIN_COLOR: Record<AvatarAppearance['colorPiel'], string> = {
  claro: 'ffdbb4',
  medio: 'd08b5b',
  oscuro: '614335',
};

const HAIR_STYLE: Record<AvatarAppearance['peinado'], string> = {
  corto: 'shortWaved',
  cortoLiso: 'shortFlat',
  mediaMelena: 'straight01',
  largo: 'straight02',
  rizado: 'curly',
  despeinado: 'shaggy',
  afro: 'fro',
  bun: 'bun',
  trenzas: 'frida',
  rapado: 'hat',
};

const GENDER_PRESET: Record<AvatarAppearance['genero'], Partial<Record<string, string>>> = {
  neutral: { eyebrows: 'default' },
  femenino: { eyebrows: 'raisedExcited' },
  masculino: { eyebrows: 'defaultNatural' },
  enojado: { eyebrows: 'angry' },
  triste: { eyebrows: 'sadConcerned' },
  arribaAbajo: { eyebrows: 'upDown' },
  ceno: { eyebrows: 'frownNatural' },
};

const FACE_PRESET: Record<AvatarAppearance['formaCara'], Partial<Record<string, string>>> = {
  redonda: { eyes: 'happy', nose: 'default' },
  ovalada: { eyes: 'default', nose: 'default' },
  cuadrada: { eyes: 'squint', nose: 'default' },
  cerrados: { eyes: 'closed', nose: 'default' },
  guino: { eyes: 'wink', nose: 'default' },
  corazones: { eyes: 'hearts', nose: 'default' },
  sorprendidos: { eyes: 'surprised', nose: 'default' },
  llanto: { eyes: 'cry', nose: 'default' },
};

const HAIR_COLOR: Record<AvatarAppearance['colorPelo'], string> = {
  castanio: '724133',
  negro: '2c1b18',
  rubio: 'd6b370',
  rojo: 'a55728',
};

const EXPRESSION: Record<AvatarAppearance['expresion'], string> = {
  feliz: 'smile',
  tranquilo: 'twinkle',
  concentrado: 'serious',
  preocupado: 'concerned',
  triste: 'sad',
  sorprendido: 'screamOpen',
  lengua: 'tongue',
  descreido: 'disbelief',
};

const CLOTHING: Record<AvatarClothing, string> = {
  hoodie: 'hoodie',
  blazerCamisa: 'blazerAndShirt',
  blazerSueter: 'blazerAndSweater',
  cuelloSueter: 'collarAndSweater',
  remeraGrafica: 'graphicShirt',
  overall: 'overall',
  remeraCuelloRedondo: 'shirtCrewNeck',
  remeraEscote: 'shirtScoopNeck',
  remeraCuelloV: 'shirtVNeck',
};

const SHIRT_COLOR: Record<string, string> = {
  'shirt-blue': '65c9ff',
  'shirt-red': 'ff5c5c',
  'shirt-green': '3c4f5c',
  'shirt-purple': '9292ff',
  'shirt-rainbow': 'ffafb9',
};

const BACKGROUND_COLOR: Record<string, string> = {
  'bg-default': 'f6f7f9',
  'bg-stars': '262e57',
  'bg-beach': 'b6e3f4',
  'bg-forest': 'c0f2c7',
  'bg-space': '1b2440',
};

export function buildDiceBearAvatarUrl(
  appearance: AvatarAppearance,
  equipped: AvatarEquipped,
  seed = 'tandem-avatar',
  format: 'svg' | 'png' = 'svg',
) {
  const options: Record<string, string> = {};

  options.seed = seed;
  options.radius = '18';
  options.scale = '110';
  options.backgroundType = 'solid';
  options.backgroundColor = BACKGROUND_COLOR[equipped.fondo || 'bg-default'] || BACKGROUND_COLOR['bg-default'];
  options.skinColor = SKIN_COLOR[appearance.colorPiel];
  options.top = HAIR_STYLE[appearance.peinado];
  options.hairColor = HAIR_COLOR[appearance.colorPelo];
  options.clothesColor = SHIRT_COLOR[equipped.ropa || 'shirt-blue'] || SHIRT_COLOR['shirt-blue'];
  options.clothing = CLOTHING[appearance.ropa];

  options.accessoriesColor = '25557c';

  const gender = GENDER_PRESET[appearance.genero];
  Object.assign(options, gender);

  const face = FACE_PRESET[appearance.formaCara];
  Object.assign(options, face);

  options.mouth = EXPRESSION[appearance.expresion];

  if (equipped.accesorio === 'acc-glasses') {
    options.accessories = 'prescription02';
  }

  const params = new URLSearchParams(options);

  return `${API_BASE}/${format}?${params.toString()}`;
}
