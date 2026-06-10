import type { AvatarAppearance, AvatarEquipped } from '@/contexts/WalletContext';

const API_BASE = 'https://api.dicebear.com/9.x/avataaars/svg';

const SKIN_COLOR: Record<AvatarAppearance['colorPiel'], string> = {
  claro: 'ffdbb4',
  medio: 'd08b5b',
  oscuro: '614335',
};

const HAIR_STYLE: Record<AvatarAppearance['peinado'], string> = {
  corto: 'shortWaved',
  largo: 'straight02',
  rizado: 'curly',
  rapado: 'hat',
};

const GENDER_PRESET: Record<AvatarAppearance['genero'], Partial<Record<string, string>>> = {
  neutral: {
    eyebrows: 'default',
    mouth: 'smile',
  },
  femenino: {
    eyebrows: 'raisedExcited',
    mouth: 'smile',
  },
  masculino: {
    eyebrows: 'defaultNatural',
    mouth: 'smile',
    facialHair: 'beardLight',
  },
};

const FACE_PRESET: Record<AvatarAppearance['formaCara'], Partial<Record<string, string>>> = {
  redonda: {
    eyes: 'happy',
    nose: 'default',
  },
  ovalada: {
    eyes: 'default',
    nose: 'default',
  },
  cuadrada: {
    eyes: 'squint',
    nose: 'default',
  },
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
) {
  const options: Record<string, string> = {
    seed,
    radius: '18',
    scale: '110',
    backgroundType: 'solid',
    backgroundColor: BACKGROUND_COLOR[equipped.fondo || 'bg-default'] || BACKGROUND_COLOR['bg-default'],
    skinColor: SKIN_COLOR[appearance.colorPiel],
    top: HAIR_STYLE[appearance.peinado],
    hairColor: HAIR_COLOR[appearance.colorPelo],
    clothesColor: SHIRT_COLOR[equipped.ropa || 'shirt-blue'] || SHIRT_COLOR['shirt-blue'],
    clothing: 'hoodie',
    mouth: EXPRESSION[appearance.expresion],
    accessoriesColor: '25557c',
    facialHairColor: HAIR_COLOR[appearance.colorPelo],
    ...GENDER_PRESET[appearance.genero],
    ...FACE_PRESET[appearance.formaCara],
  };

  if (equipped.accesorio === 'acc-glasses') {
    options.accessories = 'prescription02';
  }

  const params = new URLSearchParams(options);

  return `${API_BASE}?${params.toString()}`;
}
