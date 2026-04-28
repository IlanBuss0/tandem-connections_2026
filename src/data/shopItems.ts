// Catálogo de ítems de la tienda TÁNDEM
// Cada ítem usa emoji como overlay sobre el avatar base, organizados por categoría/slot.

export type ShopCategory = 'pelo' | 'accesorio' | 'ropa' | 'fondo' | 'mascota';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  emoji: string;          // representación visual (emoji o símbolo)
  price: number;          // en monedas TÁNDEM
  rarity: 'comun' | 'raro' | 'epico' | 'legendario';
  description: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // PELO
  { id: 'hair-cap', name: 'Gorra deportiva', category: 'pelo', emoji: '🧢', price: 50, rarity: 'comun', description: 'Una gorra cómoda para el día a día.' },
  { id: 'hair-tophat', name: 'Galera elegante', category: 'pelo', emoji: '🎩', price: 200, rarity: 'raro', description: 'Para ocasiones especiales.' },
  { id: 'hair-crown', name: 'Corona dorada', category: 'pelo', emoji: '👑', price: 500, rarity: 'legendario', description: 'Para sentirte rey o reina del día.' },
  { id: 'hair-graduation', name: 'Birrete', category: 'pelo', emoji: '🎓', price: 150, rarity: 'raro', description: 'Cuando lográs un nuevo aprendizaje.' },
  { id: 'hair-helmet', name: 'Casco aventurero', category: 'pelo', emoji: '⛑️', price: 120, rarity: 'comun', description: 'Listo para explorar.' },

  // ACCESORIO
  { id: 'acc-glasses', name: 'Lentes de sol', category: 'accesorio', emoji: '🕶️', price: 80, rarity: 'comun', description: 'Estilo cool en cualquier momento.' },
  { id: 'acc-headphones', name: 'Auriculares', category: 'accesorio', emoji: '🎧', price: 120, rarity: 'comun', description: 'Para tu música favorita.' },
  { id: 'acc-medal', name: 'Medalla de oro', category: 'accesorio', emoji: '🏅', price: 300, rarity: 'epico', description: 'Recompensa por tu esfuerzo.' },
  { id: 'acc-mask', name: 'Antifaz misterioso', category: 'accesorio', emoji: '🦸', price: 250, rarity: 'raro', description: 'Sentite un superhéroe.' },
  { id: 'acc-flower', name: 'Flor en la oreja', category: 'accesorio', emoji: '🌸', price: 60, rarity: 'comun', description: 'Detalle suave y bonito.' },

  // ROPA (color de remera)
  { id: 'shirt-blue', name: 'Remera celeste', category: 'ropa', emoji: '👕', price: 0, rarity: 'comun', description: 'La remera por defecto.' },
  { id: 'shirt-red', name: 'Remera roja', category: 'ropa', emoji: '🟥', price: 70, rarity: 'comun', description: 'Color vibrante y enérgico.' },
  { id: 'shirt-green', name: 'Remera verde', category: 'ropa', emoji: '🟩', price: 70, rarity: 'comun', description: 'Tranquilo como la naturaleza.' },
  { id: 'shirt-purple', name: 'Remera lila', category: 'ropa', emoji: '🟪', price: 90, rarity: 'comun', description: 'Calma y creatividad.' },
  { id: 'shirt-rainbow', name: 'Remera arcoíris', category: 'ropa', emoji: '🌈', price: 350, rarity: 'epico', description: 'Mostrá tus colores.' },

  // FONDO
  { id: 'bg-default', name: 'Fondo claro', category: 'fondo', emoji: '⬜', price: 0, rarity: 'comun', description: 'Fondo neutro por defecto.' },
  { id: 'bg-stars', name: 'Cielo estrellado', category: 'fondo', emoji: '🌌', price: 200, rarity: 'raro', description: 'Un cielo con estrellas para soñar.' },
  { id: 'bg-beach', name: 'Playa soleada', category: 'fondo', emoji: '🏖️', price: 180, rarity: 'raro', description: 'Sentí la calma del mar.' },
  { id: 'bg-forest', name: 'Bosque mágico', category: 'fondo', emoji: '🌲', price: 180, rarity: 'raro', description: 'Aventurate en la naturaleza.' },
  { id: 'bg-space', name: 'Espacio infinito', category: 'fondo', emoji: '🚀', price: 400, rarity: 'epico', description: 'Más allá de las estrellas.' },

  // MASCOTA
  { id: 'pet-cat', name: 'Gatito', category: 'mascota', emoji: '🐱', price: 220, rarity: 'raro', description: 'Te acompaña a todos lados.' },
  { id: 'pet-dog', name: 'Perrito', category: 'mascota', emoji: '🐶', price: 220, rarity: 'raro', description: 'Tu mejor amigo digital.' },
  { id: 'pet-dragon', name: 'Dragón mítico', category: 'mascota', emoji: '🐲', price: 600, rarity: 'legendario', description: 'Una mascota legendaria.' },
  { id: 'pet-rabbit', name: 'Conejito', category: 'mascota', emoji: '🐰', price: 180, rarity: 'comun', description: 'Tierno y saltarín.' },
  { id: 'pet-unicorn', name: 'Unicornio', category: 'mascota', emoji: '🦄', price: 550, rarity: 'epico', description: 'Mágico y brillante.' },
];

export const RARITY_STYLES: Record<ShopItem['rarity'], { label: string; class: string }> = {
  comun:       { label: 'Común',       class: 'bg-muted text-muted-foreground' },
  raro:        { label: 'Raro',        class: 'bg-sky text-blue-700' },
  epico:       { label: 'Épico',       class: 'bg-lavender text-purple-700' },
  legendario:  { label: 'Legendario',  class: 'bg-amber-100 text-amber-700' },
};

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  pelo: 'Cabeza',
  accesorio: 'Accesorios',
  ropa: 'Ropa',
  fondo: 'Fondo',
  mascota: 'Mascotas',
};

export function getItemById(id: string | undefined | null): ShopItem | undefined {
  if (!id) return undefined;
  return SHOP_ITEMS.find(i => i.id === id);
}
