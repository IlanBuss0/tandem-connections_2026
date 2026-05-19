import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { SHOP_ITEMS, CATEGORY_LABELS, RARITY_STYLES, ShopCategory } from '@/data/shopItems';
import AvatarPreview from '@/components/AvatarPreview';
import CoinBadge from '@/components/CoinBadge';
import { Button } from '@/components/ui/button';
import { Check, Coins, Lock, Sparkles, ShoppingBag, Backpack } from 'lucide-react';
import { toast } from '@/hooks/ui/use-toast';

const TABS: Array<{ id: 'tienda' | 'inventario' | 'avatar'; label: string; icon: any }> = [
  { id: 'avatar', label: 'Mi avatar', icon: Sparkles },
  { id: 'tienda', label: 'Tienda', icon: ShoppingBag },
  { id: 'inventario', label: 'Inventario', icon: Backpack },
];

const CATS: Array<ShopCategory | 'todas'> = ['todas', 'pelo', 'accesorio', 'ropa', 'fondo', 'mascota'];

export default function UserShop() {
  const { state, buy, equip, unequip, hasItem, isEquipped } = useWallet();
  const [tab, setTab] = useState<'tienda' | 'inventario' | 'avatar'>('avatar');
  const [cat, setCat] = useState<ShopCategory | 'todas'>('todas');

  const items = useMemo(() => {
    let list = SHOP_ITEMS;
    if (tab === 'inventario') list = list.filter(i => state.inventory.includes(i.id));
    if (cat !== 'todas') list = list.filter(i => i.category === cat);
    return list;
  }, [tab, cat, state.inventory]);

  const handleBuy = (id: string) => {
    const r = buy(id);
    if (!r.ok) toast({ title: 'No se pudo comprar', description: r.reason, variant: 'destructive' });
    else toast({ title: '¡Compra realizada! 🎉', description: 'El ítem ya está en tu inventario.' });
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">Tienda y avatar</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Personalizá tu personaje con las monedas que ganás</p>
        </div>
        <CoinBadge size="md" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/60 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'avatar' && (
        <AvatarTab />
      )}

      {tab !== 'avatar' && (
        <>
          {/* Filtros categoría */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${cat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {c === 'todas' ? 'Todas' : CATEGORY_LABELS[c as ShopCategory]}
              </button>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {tab === 'inventario' ? 'Tu inventario está vacío. Comprá tu primer ítem en la tienda.' : 'No hay ítems en esta categoría.'}
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map(item => {
              const owned = hasItem(item.id);
              const equipped = isEquipped(item.id);
              const canAfford = state.balance >= item.price;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border p-3 flex flex-col"
                >
                  <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center text-5xl mb-2 relative">
                    <span aria-hidden>{item.emoji}</span>
                    <span className={`absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${RARITY_STYLES[item.rarity].class}`}>
                      {RARITY_STYLES[item.rarity].label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 min-h-[28px]">{item.description}</p>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    {owned ? (
                      equipped ? (
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => unequip(item.category)}>
                          <Check size={12} className="mr-1" /> Equipado
                        </Button>
                      ) : (
                        <Button size="sm" className="w-full h-8 text-xs gradient-primary text-primary-foreground" onClick={() => equip(item.id)}>
                          Equipar
                        </Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        disabled={!canAfford}
                        onClick={() => handleBuy(item.id)}
                        className="w-full h-8 text-xs"
                        variant={canAfford ? 'default' : 'outline'}
                      >
                        {canAfford ? <Coins size={12} className="mr-1" /> : <Lock size={12} className="mr-1" />}
                        {item.price}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Historial */}
      {state.history.length > 0 && tab !== 'avatar' && (
        <div className="bg-card rounded-xl border border-border p-4 mt-4">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-2">Movimientos recientes</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {state.history.slice(0, 8).map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate pr-2">{tx.reason}</span>
                <span className={`font-semibold tabular-nums shrink-0 ${tx.type === 'ingreso' ? 'text-success' : 'text-destructive'}`}>
                  {tx.type === 'ingreso' ? '+' : '−'}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarTab() {
  const { state, equip, unequip, hasItem } = useWallet();
  const cats: ShopCategory[] = ['pelo', 'accesorio', 'ropa', 'fondo', 'mascota'];

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
        <AvatarPreview equipped={state.equipped} size={180} />
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-heading font-bold text-foreground text-lg">Tu avatar TÁNDEM</h3>
          <p className="text-sm text-muted-foreground mt-1">Equipá ítems de tu inventario para personalizarlo. Ganá más monedas completando actividades.</p>
          <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
            <CoinBadge size="md" />
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
              <Backpack size={12} /> {state.inventory.length} ítems
            </span>
          </div>
        </div>
      </div>

      {cats.map(c => {
        const owned = SHOP_ITEMS.filter(i => i.category === c && hasItem(i.id));
        if (owned.length === 0) return null;
        const equippedId = state.equipped[c];
        return (
          <div key={c} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-foreground">{CATEGORY_LABELS[c]}</h4>
              {equippedId && (
                <button onClick={() => unequip(c)} className="text-xs text-muted-foreground hover:text-destructive">Quitar</button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {owned.map(item => {
                const isOn = equippedId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => equip(item.id)}
                    className={`shrink-0 w-16 h-16 rounded-lg border-2 flex items-center justify-center text-3xl transition-all ${isOn ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:border-primary/50'}`}
                    aria-label={`Equipar ${item.name}`}
                    aria-pressed={isOn}
                  >
                    {item.emoji}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

