import wardrobe from './avatarWardrobe.json';
export type AvatarCategory = 'base' | 'skinTone' | 'hairstyle' | 'hairColor' | 'eyeColor' | 'top' | 'bottom' | 'shoes' | 'accessory';
export type ClothingCategory = 'top' | 'bottom' | 'shoes' | 'accessory';
export type EquipmentCategory = ClothingCategory | 'hairstyle';

export interface AvatarItem {
  id: string;
  name: string;
  category: AvatarCategory;
  /** Key of an original SVG layer or palette value; never an external URL. */
  resource: string;
  renderOrder: number;
  available: boolean;
  unlock: 'free' | 'reward';
  color?: string;
  price?: number;
}

export type AvatarConfig = Record<AvatarCategory, string>;

const items = (category: AvatarCategory, renderOrder: number, options: [string, string, string?][]): AvatarItem[] =>
  options.map(([id, name, color]) => ({ id, name, category, resource: id, renderOrder, available: true, unlock: 'free', color }));

export const avatarCatalog: Record<AvatarCategory, AvatarItem[]> = {
  base: items('base', 10, [['masculine', 'Base masculina'], ['feminine', 'Base femenina']]),
  skinTone: items('skinTone', 10, [['porcelain', 'Piel clara', '#f4cfb5'], ['warm', 'Piel cálida', '#dca27e'], ['brown', 'Piel morena', '#ab7253'], ['deep', 'Piel oscura', '#714a39']]),
  hairColor: items('hairColor', 60, [['espresso', 'Negro', '#29252d'], ['chestnut', 'Castaño', '#664236'], ['honey', 'Rubio', '#bb873f'], ['copper', 'Cobrizo', '#a64834']]),
  eyeColor: items('eyeColor', 50, [['hazel', 'Marrones', '#714932'], ['green', 'Verdes', '#467160'], ['blue', 'Azules', '#43718c']]),
  ...Object.fromEntries((['top', 'bottom', 'shoes', 'accessory', 'hairstyle'] as const).map(category => [category,
    wardrobe.filter(item => item.category === category).map(item => ({
      id: item.option, name: item.name, category, resource: item.resource, color: item.color ?? undefined,
      renderOrder: { bottom: 20, shoes: 30, top: 40, hairstyle: 60, accessory: 70 }[category], available: true,
      unlock: item.price === 0 ? 'free' : 'reward', price: item.price,
    })),
  ])) as Record<EquipmentCategory, AvatarItem[]>,
};

export const clothingCategories: ClothingCategory[] = ['top', 'bottom', 'shoes', 'accessory'];
export const equipmentCategories: EquipmentCategory[] = ['hairstyle', ...clothingCategories];
export const freeInventory = wardrobe.filter(item => item.price === 0).map(item => item.id);
export const wardrobeItems = wardrobe;
export const equipmentCode = (category: AvatarCategory, option: string) => `${category}:${option}`;
export const compatibleCode = (code: string) => wardrobe.find(item => item.id === code || item.legacyIds.includes(code))?.id;

export function ownedConfig(config: AvatarConfig, inventory: string[]): AvatarConfig {
  const next = validateAvatar(config);
  for (const category of equipmentCategories) {
    if (!inventory.includes(equipmentCode(category, next[category]))) next[category] = defaultAvatar[category];
  }
  return next;
}

export const defaultAvatar: AvatarConfig = {
  base: 'masculine',
  skinTone: 'warm', hairstyle: 'swept', hairColor: 'chestnut', eyeColor: 'hazel',
  top: 'hoodie', bottom: 'jeans', shoes: 'white', accessory: 'none',
};

export const avatarCategories = Object.keys(defaultAvatar) as AvatarCategory[];

/** Untrusted storage can only select known, available catalog entries. */
export function validateAvatar(value: unknown): AvatarConfig {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(avatarCategories.map(category => [category,
    avatarCatalog[category].find(item => item.id === source[category] && item.available)?.id ?? defaultAvatar[category],
  ])) as AvatarConfig;
}

export function avatarItem(config: AvatarConfig, category: AvatarCategory) {
  return avatarCatalog[category].find(item => item.id === config[category]) ?? avatarCatalog[category][0];
}
