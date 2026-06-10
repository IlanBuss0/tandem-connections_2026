import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { tandemApi } from '@/services/api';
import { SHOP_ITEMS, ShopCategory, getItemById } from '@/data/shopItems';
import type { Avatar, InventarioAvatar, ItemAvatar, Perteneciente, SaldoPuntos, TipoItemAvatar } from '@/types/database';

export interface CoinTxn {
  id: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  reason: string;
  itemId?: string;
  at: number;
}

export interface AvatarEquipped {
  pelo?: string;
  accesorio?: string;
  ropa?: string;
  fondo?: string;
  mascota?: string;
}

export type AvatarGender = 'neutral' | 'femenino' | 'masculino';
export type AvatarSkinTone = 'claro' | 'medio' | 'oscuro';
export type AvatarFaceShape = 'redonda' | 'ovalada' | 'cuadrada';
export type AvatarHairStyle = 'corto' | 'largo' | 'rizado' | 'rapado';

export interface AvatarAppearance {
  genero: AvatarGender;
  colorPiel: AvatarSkinTone;
  formaCara: AvatarFaceShape;
  peinado: AvatarHairStyle;
}

export interface WalletState {
  balance: number;
  inventory: string[];
  equipped: AvatarEquipped;
  appearance: AvatarAppearance;
  history: CoinTxn[];
}

const DEFAULT_APPEARANCE: AvatarAppearance = {
  genero: 'neutral',
  colorPiel: 'medio',
  formaCara: 'redonda',
  peinado: 'corto',
};

const DEFAULT_EQUIPPED: AvatarEquipped = { ropa: 'shirt-blue', fondo: 'bg-default' };
const DEFAULT_INVENTORY = ['shirt-blue', 'bg-default'];
const KEY = (userId: string) => `tandem:wallet:${userId}`;

const TYPE_BY_CATEGORY: Record<ShopCategory, string> = {
  pelo: 'Sombrero',
  accesorio: 'Accesorio',
  ropa: 'Ropa',
  fondo: 'Fondo',
  mascota: 'Mascota',
};

const DEFAULT_STATE = (initialBalance = 0): WalletState => ({
  balance: initialBalance,
  inventory: DEFAULT_INVENTORY,
  equipped: DEFAULT_EQUIPPED,
  appearance: DEFAULT_APPEARANCE,
  history: initialBalance > 0
    ? [{ id: 'seed', type: 'ingreso', amount: initialBalance, reason: 'Bienvenida TANDEM', at: Date.now() }]
    : [],
});

function loadLocalState(userId: string, fallbackPoints: number): WalletState {
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WalletState>;
      return {
        ...DEFAULT_STATE(Math.max(100, Math.round(fallbackPoints / 4))),
        ...parsed,
        inventory: Array.from(new Set([...(parsed.inventory || []), ...DEFAULT_INVENTORY])),
        equipped: { ...DEFAULT_EQUIPPED, ...(parsed.equipped || {}) },
        appearance: { ...DEFAULT_APPEARANCE, ...(parsed.appearance || {}) },
      };
    }
  } catch {
    // localStorage can fail in restricted browser modes.
  }
  return DEFAULT_STATE(Math.max(100, Math.round(fallbackPoints / 4)));
}

function saveLocalState(userId: string, state: WalletState) {
  try {
    localStorage.setItem(KEY(userId), JSON.stringify(state));
  } catch {
    // Storage persistence is best effort.
  }
}

function parseAvatarAppearance(raw?: string | null): AvatarAppearance {
  if (!raw) return DEFAULT_APPEARANCE;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_APPEARANCE, ...(parsed?.appearance || parsed || {}) };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function serializeAvatarJson(appearance: AvatarAppearance) {
  return JSON.stringify({ appearance });
}

function categoryOfExternalId(id: string): ShopCategory | undefined {
  return getItemById(id)?.category;
}

function normalizeInventory(ids: string[]) {
  return Array.from(new Set([...ids, ...DEFAULT_INVENTORY]));
}

interface BackendSnapshot {
  avatar: Avatar;
  saldo: SaldoPuntos;
  itemByExternalId: Map<string, ItemAvatar>;
  inventoryRecords: InventarioAvatar[];
  state: WalletState;
}

interface WalletCtx {
  state: WalletState;
  loading: boolean;
  error: string | null;
  earn: (amount: number, reason: string) => Promise<void>;
  buy: (itemId: string) => Promise<{ ok: boolean; reason?: string }>;
  equip: (itemId: string) => Promise<void>;
  unequip: (category: ShopCategory) => Promise<void>;
  saveAppearance: (appearance: AvatarAppearance) => Promise<{ ok: boolean; reason?: string }>;
  hasItem: (itemId: string) => boolean;
  isEquipped: (itemId: string) => boolean;
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? '__guest__';
  const seedPoints = (user && 'points' in user) ? (user as any).points : 0;

  const [state, setState] = useState<WalletState>(() => loadLocalState(userId, seedPoints));
  const [snapshot, setSnapshot] = useState<BackendSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildSnapshot = useCallback(async (): Promise<BackendSnapshot> => {
    if (!user || user.role !== 'user') {
      throw new Error('La tienda persistente requiere un perteneciente autenticado.');
    }

    const [
      pertenecientes,
      avatares,
      saldos,
      tipos,
      itemsBeforeSync,
      inventarios,
    ] = await Promise.all([
      tandemApi.pertenecientes.getAll(),
      tandemApi.avatares.getAll(),
      tandemApi.saldosPuntos.getAll(),
      tandemApi.tiposItemsAvatares.getAll(),
      tandemApi.itemsAvatares.getAll(),
      tandemApi.inventariosAvatares.getAll(),
    ]);

    const perteneciente = (pertenecientes as Perteneciente[]).find(item => Number(item.id_usuario) === Number(user.id));
    if (!perteneciente) {
      throw new Error('No se encontro el perfil perteneciente para este usuario.');
    }

    const syncedTypes = await ensureShopTypes(tipos as TipoItemAvatar[]);
    const syncedItems = await ensureShopItems(itemsBeforeSync as ItemAvatar[], syncedTypes);
    const itemByExternalId = new Map(
      syncedItems
        .filter(item => item.codigo_item_externo)
        .map(item => [String(item.codigo_item_externo), item])
    );
    const externalByDbId = new Map(
      syncedItems
        .filter(item => item.codigo_item_externo)
        .map(item => [Number(item.id), String(item.codigo_item_externo)])
    );

    let avatar = (avatares as Avatar[]).find(item => Number(item.id_perteneciente) === Number(perteneciente.id));
    if (!avatar) {
      const created = await tandemApi.avatares.create({
        id_perteneciente: perteneciente.id,
        nivel: 1,
        experiencia: 0,
        avatar_api: 'tandem',
        avatar_externo_id: null,
        avatar_json: serializeAvatarJson(DEFAULT_APPEARANCE),
      });
      avatar = {
        id: Number(created.id),
        id_perteneciente: perteneciente.id,
        nivel: 1,
        experiencia: 0,
        avatar_api: 'tandem',
        avatar_externo_id: null,
        avatar_json: serializeAvatarJson(DEFAULT_APPEARANCE),
      };
    }

    let saldo = (saldos as SaldoPuntos[]).find(item => Number(item.id_perteneciente) === Number(perteneciente.id));
    if (!saldo) {
      const initialBalance = Math.max(100, Math.round(seedPoints / 4));
      const created = await tandemApi.saldosPuntos.create({ id_perteneciente: perteneciente.id, saldo: initialBalance });
      saldo = { id: Number(created.id), id_perteneciente: perteneciente.id, saldo: initialBalance };
    }

    let inventoryRecords = (inventarios as InventarioAvatar[])
      .filter(item => Number(item.id_avatar) === Number(avatar.id));

    for (const defaultId of DEFAULT_INVENTORY) {
      const dbItem = itemByExternalId.get(defaultId);
      const exists = dbItem && inventoryRecords.some(record => Number(record.id_item_avatar) === Number(dbItem.id));
      if (dbItem && !exists) {
        const created = await tandemApi.inventariosAvatares.create({
          id_avatar: avatar.id,
          id_item_avatar: dbItem.id,
          equipado: true,
          fecha_obtencion: new Date().toISOString(),
        });
        inventoryRecords = [
          {
            id: Number(created.id),
            id_avatar: avatar.id,
            id_item_avatar: dbItem.id,
            equipado: true,
            fecha_obtencion: new Date().toISOString(),
          },
          ...inventoryRecords,
        ];
      }
    }

    const inventoryIds = normalizeInventory(
      inventoryRecords
        .map(record => externalByDbId.get(Number(record.id_item_avatar)))
        .filter(Boolean) as string[]
    );

    const equipped: AvatarEquipped = { ...DEFAULT_EQUIPPED };
    for (const record of inventoryRecords) {
      if (!record.equipado) continue;
      const externalId = externalByDbId.get(Number(record.id_item_avatar));
      if (!externalId) continue;
      const category = categoryOfExternalId(externalId);
      if (category) equipped[category] = externalId;
    }

    return {
      avatar,
      saldo,
      itemByExternalId,
      inventoryRecords,
      state: {
        balance: Number(saldo.saldo || 0),
        inventory: inventoryIds,
        equipped,
        appearance: parseAvatarAppearance(avatar.avatar_json),
        history: loadLocalState(userId, seedPoints).history,
      },
    };
  }, [seedPoints, user, userId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await buildSnapshot();
      setSnapshot(next);
      setState(next.state);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar la tienda.';
      setSnapshot(null);
      setState(loadLocalState(userId, seedPoints));
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [buildSnapshot, seedPoints, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    saveLocalState(userId, state);
  }, [userId, state]);

  const earn = useCallback(async (amount: number, reason: string) => {
    if (amount <= 0) return;
    if (snapshot) {
      const nextSaldo = Number(snapshot.saldo.saldo || 0) + amount;
      await tandemApi.saldosPuntos.update(snapshot.saldo.id, { ...snapshot.saldo, saldo: nextSaldo });
      setSnapshot(prev => prev ? { ...prev, saldo: { ...prev.saldo, saldo: nextSaldo } } : prev);
    }
    const tx: CoinTxn = { id: `tx-${Date.now()}`, type: 'ingreso', amount, reason, at: Date.now() };
    setState(prev => ({ ...prev, balance: prev.balance + amount, history: [tx, ...prev.history].slice(0, 50) }));
  }, [snapshot]);

  const buy = useCallback(async (itemId: string) => {
    const item = getItemById(itemId);
    if (!item) return { ok: false, reason: 'Item no encontrado' };
    if (state.inventory.includes(itemId)) return { ok: false, reason: 'Ya tenes este item' };
    if (state.balance < item.price) return { ok: false, reason: 'No tenes suficientes monedas' };

    if (snapshot) {
      const dbItem = snapshot.itemByExternalId.get(itemId);
      if (!dbItem) return { ok: false, reason: 'El item no esta disponible en la base de datos' };

      const nextSaldo = state.balance - item.price;
      const created = await tandemApi.inventariosAvatares.create({
        id_avatar: snapshot.avatar.id,
        id_item_avatar: dbItem.id,
        equipado: false,
        fecha_obtencion: new Date().toISOString(),
      });
      await tandemApi.saldosPuntos.update(snapshot.saldo.id, { ...snapshot.saldo, saldo: nextSaldo });

      const record: InventarioAvatar = {
        id: Number(created.id),
        id_avatar: snapshot.avatar.id,
        id_item_avatar: dbItem.id,
        equipado: false,
        fecha_obtencion: new Date().toISOString(),
      };
      setSnapshot(prev => prev ? {
        ...prev,
        saldo: { ...prev.saldo, saldo: nextSaldo },
        inventoryRecords: [record, ...prev.inventoryRecords],
      } : prev);
    }

    const tx: CoinTxn = { id: `tx-${Date.now()}`, type: 'egreso', amount: item.price, reason: `Compra: ${item.name}`, itemId, at: Date.now() };
    setState(prev => ({
      ...prev,
      balance: prev.balance - item.price,
      inventory: normalizeInventory([...prev.inventory, itemId]),
      history: [tx, ...prev.history].slice(0, 50),
    }));
    return { ok: true };
  }, [snapshot, state.balance, state.inventory]);

  const equip = useCallback(async (itemId: string) => {
    const item = getItemById(itemId);
    if (!item || !state.inventory.includes(itemId)) return;

    if (snapshot) {
      const updates = snapshot.inventoryRecords.filter(record => {
        const externalId = Array.from(snapshot.itemByExternalId.entries())
          .find(([, dbItem]) => Number(dbItem.id) === Number(record.id_item_avatar))?.[0];
        return externalId && getItemById(externalId)?.category === item.category;
      });
      const selectedDbItem = snapshot.itemByExternalId.get(itemId);
      await Promise.all(updates.map(record => tandemApi.inventariosAvatares.update(record.id, { ...record, equipado: false })));
      if (selectedDbItem) {
        const selected = snapshot.inventoryRecords.find(record => Number(record.id_item_avatar) === Number(selectedDbItem.id));
        if (selected) await tandemApi.inventariosAvatares.update(selected.id, { ...selected, equipado: true });
      }
      setSnapshot(prev => prev ? {
        ...prev,
        inventoryRecords: prev.inventoryRecords.map(record => {
          const externalId = Array.from(prev.itemByExternalId.entries())
            .find(([, dbItem]) => Number(dbItem.id) === Number(record.id_item_avatar))?.[0];
          if (externalId && getItemById(externalId)?.category === item.category) {
            return { ...record, equipado: externalId === itemId };
          }
          return record;
        }),
      } : prev);
    }

    setState(prev => ({ ...prev, equipped: { ...prev.equipped, [item.category]: itemId } }));
  }, [snapshot, state.inventory]);

  const unequip = useCallback(async (category: ShopCategory) => {
    if (snapshot) {
      const updates = snapshot.inventoryRecords.filter(record => {
        const externalId = Array.from(snapshot.itemByExternalId.entries())
          .find(([, dbItem]) => Number(dbItem.id) === Number(record.id_item_avatar))?.[0];
        return externalId && getItemById(externalId)?.category === category && record.equipado;
      });
      await Promise.all(updates.map(record => tandemApi.inventariosAvatares.update(record.id, { ...record, equipado: false })));
      setSnapshot(prev => prev ? {
        ...prev,
        inventoryRecords: prev.inventoryRecords.map(record => updates.some(update => update.id === record.id) ? { ...record, equipado: false } : record),
      } : prev);
    }

    setState(prev => ({ ...prev, equipped: { ...prev.equipped, [category]: undefined } }));
  }, [snapshot]);

  const saveAppearance = useCallback(async (appearance: AvatarAppearance) => {
    if (snapshot) {
      await tandemApi.avatares.update(snapshot.avatar.id, {
        ...snapshot.avatar,
        avatar_api: 'tandem',
        avatar_json: serializeAvatarJson(appearance),
      });
      setSnapshot(prev => prev ? {
        ...prev,
        avatar: { ...prev.avatar, avatar_api: 'tandem', avatar_json: serializeAvatarJson(appearance) },
      } : prev);
    }
    setState(prev => ({ ...prev, appearance }));
    return { ok: true };
  }, [snapshot]);

  const hasItem = useCallback((id: string) => state.inventory.includes(id), [state.inventory]);
  const isEquipped = useCallback((id: string) => Object.values(state.equipped).includes(id), [state.equipped]);

  return (
    <WalletContext.Provider value={{ state, loading, error, earn, buy, equip, unequip, saveAppearance, hasItem, isEquipped, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}

async function ensureShopTypes(currentTypes: TipoItemAvatar[]) {
  const next = [...currentTypes];
  for (const typeName of Array.from(new Set(Object.values(TYPE_BY_CATEGORY)))) {
    if (next.some(type => type.nombre === typeName)) continue;
    const created = await tandemApi.tiposItemsAvatares.create({ nombre: typeName, orden: next.length + 1 });
    next.push({ id: Number(created.id), nombre: typeName as TipoItemAvatar['nombre'], orden: next.length + 1 });
  }
  return next;
}

async function ensureShopItems(currentItems: ItemAvatar[], types: TipoItemAvatar[]) {
  const next = [...currentItems];
  for (const item of SHOP_ITEMS) {
    if (next.some(dbItem => dbItem.codigo_item_externo === item.id)) continue;
    const typeName = TYPE_BY_CATEGORY[item.category];
    const type = types.find(candidate => candidate.nombre === typeName);
    if (!type) continue;
    const created = await tandemApi.itemsAvatares.create({
      id_tipo_item_avatar: type.id,
      nombre: item.name,
      codigo_item_externo: item.id,
      precio_punto: item.price,
      requiere_cantidad_actividad: null,
      requiere_id_dificultad_actividad: null,
      activo: true,
    });
    next.push({
      id: Number(created.id),
      id_tipo_item_avatar: type.id,
      nombre: item.name,
      codigo_item_externo: item.id,
      precio_punto: item.price,
      requiere_cantidad_actividad: null,
      requiere_id_dificultad_actividad: null,
      activo: true,
    });
  }
  return next.filter(item => item.activo !== false);
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be inside WalletProvider');
  return ctx;
}

export { SHOP_ITEMS };
