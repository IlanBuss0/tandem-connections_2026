import { wardrobeItems, EquipmentCategory } from '@/features/avatar/avatarCatalog';
export { LEGACY_SHOP_ITEMS } from './legacyShopItems';
export type ShopCategory=EquipmentCategory;
export const CATEGORY_LABELS:Record<EquipmentCategory,string>={hairstyle:'Peinados',top:'Arriba',bottom:'Pantalones',shoes:'Calzado',accessory:'Accesorios'};
export const SHOP_ITEMS=wardrobeItems.map(item=>({...item,emoji:'',rarity:'comun' as const,description:CATEGORY_LABELS[item.category as EquipmentCategory]}));
