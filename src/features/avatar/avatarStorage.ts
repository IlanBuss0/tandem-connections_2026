import { AvatarConfig, compatibleCode, defaultAvatar, equipmentCode, freeInventory, equipmentCategories, ownedConfig, validateAvatar } from './avatarCatalog';

export interface CoinTxn { id: string; type: 'ingreso' | 'egreso'; amount: number; reason: string; itemId?: string; at: number }
export interface AvatarWardrobe { version: 2; config: AvatarConfig; inventory: string[]; legacyInventory: string[]; legacyAvatar?: unknown }
export interface WalletState extends AvatarWardrobe { balance: number; history: CoinTxn[] }
export const walletKey = (id: string) => 'tandem:wallet:' + id;

export function readAvatarConfig(raw: unknown): AvatarConfig {
  let data = raw;
  if (typeof raw === 'string') { try { data = JSON.parse(raw); } catch { return {...defaultAvatar}; } }
  if (!data || typeof data !== 'object') return {...defaultAvatar};
  const record = data as Record<string, unknown>;
  if (record.version === 2) return validateAvatar(record.config);
  if (record.version === 1) return validateAvatar(record.equipped);
  const appearance = (record.appearance || record) as Record<string, string>;
  const clothing = typeof appearance.ropa === 'string' ? appearance.ropa : '';
  const equipped = (record.equipped || {}) as Record<string, string>;
  const config = validateAvatar({
    base: appearance.genero === 'femenino' ? 'feminine' : 'masculine',
    skinTone: ({claro:'porcelain',medio:'warm',oscuro:'deep'})[appearance.colorPiel],
    hairstyle: ({largo:'long',mediaMelena:'long',trenzas:'long',rizado:'waves',afro:'waves'})[appearance.peinado] || 'swept',
    hairColor: ({negro:'espresso',castanio:'chestnut',rubio:'honey',rojo:'copper'})[appearance.colorPelo],
    top: clothing.startsWith('remera') ? 'tee' : clothing.startsWith('blazer') ? 'jacket' : 'hoodie',
  });
  for (const code of Object.values(equipped)) {
    const compatible = compatibleCode(code);
    if (compatible) { const [category, option] = compatible.split(':'); config[category] = option; }
  }
  return config;
}
export function migrateWallet(raw: unknown, prototype?: unknown, fallbackBalance = 0): WalletState {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const original = Array.isArray(source.inventory) ? source.inventory.filter((id): id is string => typeof id === 'string') : [];
  const legacyInventory = [...new Set([...(Array.isArray(source.legacyInventory) ? source.legacyInventory.filter((id):id is string=>typeof id==='string') : []), ...original.filter(code => !code.includes(':'))])];
  const inventory = [...new Set([...freeInventory, ...original.flatMap(code => compatibleCode(code) || []), ...legacyInventory.flatMap(code => compatibleCode(code) || [])])];
  return {
    version: 2, config: ownedConfig(readAvatarConfig(source.version === 2 ? source : prototype || source), inventory),
    inventory, legacyInventory, legacyAvatar: source.legacyAvatar ?? (source.version !== 2 ? raw : undefined),
    balance: Number.isFinite(source.balance) ? Number(source.balance) : Math.max(0,fallbackBalance),
    history: Array.isArray(source.history) ? source.history.filter(item=>item && typeof item==='object') as CoinTxn[] : [],
  };
}
// One persistence boundary per user. Prototype keys remain as recoverable backups.
export const localAvatarStorage = {
  load(userId: string, fallbackBalance = 0): WalletState {
    const read = (key: string) => { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) as unknown : undefined; };
    let wallet: unknown; let prototype: unknown;
    try {wallet=read(walletKey(userId));} catch { /* Preserve corrupt source until explicit save. */ }
    try {prototype=read('tandem:avatar-studio:v1:'+encodeURIComponent(userId));} catch { /* Use defaults. */ }
    return migrateWallet(wallet,prototype,fallbackBalance);
  },
  save(userId: string,state: WalletState) {
    const key=walletKey(userId),old=localStorage.getItem(key);
    if(old&&!localStorage.getItem(key+':legacy-backup')) {
      let version:unknown;try{version=JSON.parse(old)?.version;}catch{version=null;}
      if(version!==2) localStorage.setItem(key+':legacy-backup',old);
    }
    localStorage.setItem(key,JSON.stringify(state));
  },
};
export const serializeAvatar = (state: AvatarWardrobe) => JSON.stringify({version:2,config:state.config,
  equipped:Object.fromEntries(equipmentCategories.map(category=>[category,equipmentCode(category,state.config[category])])),legacyAvatar:state.legacyAvatar});
