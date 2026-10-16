import { expect, it } from 'vitest';
import { buildDiceBearAvatarUrl } from './dicebearAvatar';
import type { AvatarAppearance } from '@/contexts/WalletContext';

const appearance: AvatarAppearance = { genero: 'neutral', colorPiel: 'medio', formaCara: 'redonda', peinado: 'corto', colorPelo: 'castanio', expresion: 'feliz', ropa: 'hoodie' };

it('renders glasses from the existing inventory equipment field', () => {
  const url = new URL(buildDiceBearAvatarUrl(appearance, { accenorio: 'acc-glasses' }, 'fixture'));
  expect(url.searchParams.get('accessories')).toBe('prescription02');
});

it('does not add glasses when no accessory is equipped', () => {
  const url = new URL(buildDiceBearAvatarUrl(appearance, {}, 'fixture'));
  expect(url.searchParams.get('accessories')).not.toBe('prescription02');
});
