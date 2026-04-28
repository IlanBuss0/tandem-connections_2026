import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { SHOP_ITEMS, ShopCategory, getItemById } from '@/data/shopItems';

// ===== Tipos =====
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

export interface WalletState {
  balance: number;
  inventory: string[];   // ids de ítems comprados
  equipped: AvatarEquipped;
  history: CoinTxn[];
}

// ===== Storage helpers =====
const KEY = (userId: string) => `tandem:wallet:${userId}`;

const DEFAULT_STATE = (initialBalance = 0): WalletState => ({
  balance: initialBalance,
  inventory: ['shirt-blue', 'bg-default'],
  equipped: { ropa: 'shirt-blue', fondo: 'bg-default' },
  history: initialBalance > 0
    ? [{ id: 'seed', type: 'ingreso', amount: initialBalance, reason: 'Bienvenida TÁNDEM', at: Date.now() }]
    : [],
});

function loadState(userId: string, fallbackPoints: number): WalletState {
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (raw) return JSON.parse(raw) as WalletState;
  } catch (_) { /* noop */ }
  // Inicializa con la mitad de sus puntos como "monedas de bienvenida" para tener tienda viva
  const seed = Math.max(100, Math.round(fallbackPoints / 4));
  return DEFAULT_STATE(seed);
}

function saveState(userId: string, state: WalletState) {
  try { localStorage.setItem(KEY(userId), JSON.stringify(state)); } catch (_) { /* noop */ }
}

// ===== Context =====
interface WalletCtx {
  state: WalletState;
  earn: (amount: number, reason: string) => void;
  buy: (itemId: string) => { ok: boolean; reason?: string };
  equip: (itemId: string) => void;
  unequip: (category: ShopCategory) => void;
  hasItem: (itemId: string) => boolean;
  isEquipped: (itemId: string) => boolean;
}

const WalletContext = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? '__guest__';
  const seedPoints = (user && 'points' in user) ? (user as any).points : 0;

  const [state, setState] = useState<WalletState>(() => loadState(userId, seedPoints));

  // Recargar estado cuando cambia el usuario
  useEffect(() => {
    setState(loadState(userId, seedPoints));
  }, [userId, seedPoints]);

  // Persistir en cada cambio
  useEffect(() => { saveState(userId, state); }, [userId, state]);

  const earn = useCallback((amount: number, reason: string) => {
    if (amount <= 0) return;
    setState(prev => ({
      ...prev,
      balance: prev.balance + amount,
      history: [{ id: `tx-${Date.now()}`, type: 'ingreso', amount, reason, at: Date.now() }, ...prev.history].slice(0, 50),
    }));
  }, []);

  const buy = useCallback((itemId: string) => {
    const item = getItemById(itemId);
    if (!item) return { ok: false, reason: 'Ítem no encontrado' };
    let result: { ok: boolean; reason?: string } = { ok: true };
    setState(prev => {
      if (prev.inventory.includes(itemId)) {
        result = { ok: false, reason: 'Ya tenés este ítem' };
        return prev;
      }
      if (prev.balance < item.price) {
        result = { ok: false, reason: 'No tenés suficientes monedas' };
        return prev;
      }
      return {
        ...prev,
        balance: prev.balance - item.price,
        inventory: [...prev.inventory, itemId],
        history: [{ id: `tx-${Date.now()}`, type: 'egreso', amount: item.price, reason: `Compra: ${item.name}`, itemId, at: Date.now() }, ...prev.history].slice(0, 50),
      };
    });
    return result;
  }, []);

  const equip = useCallback((itemId: string) => {
    const item = getItemById(itemId);
    if (!item) return;
    setState(prev => {
      if (!prev.inventory.includes(itemId)) return prev;
      return { ...prev, equipped: { ...prev.equipped, [item.category]: itemId } };
    });
  }, []);

  const unequip = useCallback((category: ShopCategory) => {
    setState(prev => ({ ...prev, equipped: { ...prev.equipped, [category]: undefined } }));
  }, []);

  const hasItem = useCallback((id: string) => state.inventory.includes(id), [state.inventory]);
  const isEquipped = useCallback((id: string) => Object.values(state.equipped).includes(id), [state.equipped]);

  return (
    <WalletContext.Provider value={{ state, earn, buy, equip, unequip, hasItem, isEquipped }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be inside WalletProvider');
  return ctx;
}

// Re-export para conveniencia
export { SHOP_ITEMS };
