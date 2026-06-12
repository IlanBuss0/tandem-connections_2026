import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Backpack, Check, Coins, Loader2, Lock, RotateCcw, Save, Settings, ShoppingBag, Sparkles } from 'lucide-react';
import { AvatarAppearance, useWallet } from '@/contexts/WalletContext';
import { CATEGORY_LABELS, RARITY_STYLES, SHOP_ITEMS, ShopCategory } from '@/data/shopItems';
import AvatarPreview from '@/components/AvatarPreview';
import CoinBadge from '@/components/CoinBadge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/ui/use-toast';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';

type ShopTab = 'avatar' | 'tienda' | 'inventario' | 'configuracion';

const TABS: Array<{ id: ShopTab; label: string; icon: typeof Sparkles }> = [
  { id: 'avatar', label: 'Mi avatar', icon: Sparkles },
  { id: 'tienda', label: 'Tienda', icon: ShoppingBag },
  { id: 'inventario', label: 'Inventario', icon: Backpack },
  { id: 'configuracion', label: 'Configuracion', icon: Settings },
];

const CATS: Array<ShopCategory | 'todas'> = ['todas', 'pelo', 'accesorio', 'ropa', 'fondo', 'mascota'];

export default function UserShop() {
  const { state, loading, error, buy, equip, unequip, hasItem, isEquipped, refresh } = useWallet();
  const { context: permissionContext } = usePermissionContext();
  const [tab, setTab] = useState<ShopTab>('avatar');
  const [cat, setCat] = useState<ShopCategory | 'todas'>('todas');
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const items = useMemo(() => {
    let list = SHOP_ITEMS;
    if (tab === 'inventario') list = list.filter(item => state.inventory.includes(item.id));
    if (cat !== 'todas') list = list.filter(item => item.category === cat);
    return list;
  }, [cat, state.inventory, tab]);
  const canSpendPoints = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.GASTAR_PUNTOS,
    false,
  );

  const handleBuy = async (id: string) => {
    if (!canSpendPoints) {
      toast({ title: 'Compra deshabilitada', description: 'Tu tutor deshabilito gastar puntos por ahora.', variant: 'destructive' });
      return;
    }
    setPendingItemId(id);
    try {
      const result = await buy(id);
      if (!result.ok) {
        toast({ title: 'No se pudo comprar', description: result.reason, variant: 'destructive' });
      } else {
        toast({ title: 'Compra realizada', description: 'El item ya esta guardado en tu inventario.' });
      }
    } catch {
      toast({ title: 'No se pudo comprar', description: 'Revisa la conexion con el backend.', variant: 'destructive' });
    } finally {
      setPendingItemId(null);
    }
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground sm:text-2xl">Tienda y avatar</h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Personaliza tu personaje con las monedas que ganas</p>
        </div>
        <CoinBadge size="md" />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">La tienda esta usando datos locales.</p>
            <p className="text-xs">{error}</p>
            <button type="button" onClick={refresh} className="mt-1 text-xs font-semibold underline">
              Reintentar conexion
            </button>
          </div>
        </div>
      )}

      {!canSpendPoints && tab === 'tienda' && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <p>Tu tutor deshabilito gastar puntos. Podes seguir viendo la tienda y tu inventario.</p>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1">
        {TABS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex min-w-[118px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
              tab === item.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Cargando tienda...
        </div>
      )}

      {tab === 'avatar' && <AvatarTab />}
      {tab === 'configuracion' && <AvatarSettingsTab />}

      {tab !== 'avatar' && tab !== 'configuracion' && (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {CATS.map(category => (
              <button
                key={category}
                onClick={() => setCat(category)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  cat === category ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {category === 'todas' ? 'Todas' : CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>

          {items.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {tab === 'inventario' ? 'Tu inventario esta vacio. Compra tu primer item en la tienda.' : 'No hay items en esta categoria.'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map(item => {
              const owned = hasItem(item.id);
              const equipped = isEquipped(item.id);
              const canAfford = canSpendPoints && state.balance >= item.price;
              const pending = pendingItemId === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col rounded-xl border border-border bg-card p-3"
                >
                  <div className="relative mb-2 flex aspect-square items-center justify-center rounded-lg bg-muted/50 text-5xl">
                    <span aria-hidden>{item.emoji}</span>
                    <span className={`absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${RARITY_STYLES[item.rarity].class}`}>
                      {RARITY_STYLES[item.rarity].label}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm font-semibold leading-tight text-foreground">{item.name}</p>
                  <p className="mt-0.5 min-h-[28px] line-clamp-2 text-[11px] text-muted-foreground">{item.description}</p>

                  <div className="mt-2">
                    {owned ? (
                      equipped ? (
                        <Button size="sm" variant="outline" className="h-8 w-full text-xs" onClick={() => unequip(item.category)}>
                          <Check size={12} className="mr-1" />
                          Equipado
                        </Button>
                      ) : (
                        <Button size="sm" className="h-8 w-full text-xs gradient-primary text-primary-foreground" onClick={() => equip(item.id)}>
                          Equipar
                        </Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        disabled={!canAfford || pending}
                        onClick={() => handleBuy(item.id)}
                        className="h-8 w-full text-xs"
                        variant={canAfford ? 'default' : 'outline'}
                      >
                        {pending ? <Loader2 size={12} className="mr-1 animate-spin" /> : canAfford ? <Coins size={12} className="mr-1" /> : <Lock size={12} className="mr-1" />}
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

      {state.history.length > 0 && tab !== 'avatar' && tab !== 'configuracion' && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground font-heading">Movimientos recientes</h3>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {state.history.slice(0, 8).map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-xs">
                <span className="truncate pr-2 text-muted-foreground">{tx.reason}</span>
                <span className={`shrink-0 font-semibold tabular-nums ${tx.type === 'ingreso' ? 'text-success' : 'text-destructive'}`}>
                  {tx.type === 'ingreso' ? '+' : '-'}{tx.amount}
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
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:p-6">
        <AvatarPreview equipped={state.equipped} appearance={state.appearance} size={180} />
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-foreground font-heading">Tu avatar TANDEM</h3>
          <p className="mt-1 text-sm text-muted-foreground">Equipa items de tu inventario para personalizarlo. Gana mas monedas completando actividades.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <CoinBadge size="md" />
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <Backpack size={12} />
              {state.inventory.length} items
            </span>
          </div>
        </div>
      </div>

      {cats.map(category => {
        const owned = SHOP_ITEMS.filter(item => item.category === category && hasItem(item.id));
        if (owned.length === 0) return null;
        const equippedId = state.equipped[category];

        return (
          <div key={category} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[category]}</h4>
              {equippedId && (
                <button onClick={() => unequip(category)} className="text-xs text-muted-foreground hover:text-destructive">
                  Quitar
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {owned.map(item => {
                const active = equippedId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => equip(item.id)}
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 text-3xl transition-all ${
                      active ? 'border-primary bg-primary/10' : 'border-border bg-muted/40 hover:border-primary/50'
                    }`}
                    aria-label={`Equipar ${item.name}`}
                    aria-pressed={active}
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

const AVATAR_OPTIONS = {
  genero: [
    { value: 'neutral', label: 'Neutral' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'masculino', label: 'Masculino' },
  ] as Array<{ value: AvatarAppearance['genero']; label: string }>,
  colorPiel: [
    { value: 'claro', label: 'Claro', swatch: 'bg-[#f2c9a0]' },
    { value: 'medio', label: 'Medio', swatch: 'bg-[#c98b5f]' },
    { value: 'oscuro', label: 'Oscuro', swatch: 'bg-[#7a4a31]' },
  ] as Array<{ value: AvatarAppearance['colorPiel']; label: string; swatch: string }>,
  formaCara: [
    { value: 'redonda', label: 'Redonda' },
    { value: 'ovalada', label: 'Ovalada' },
    { value: 'cuadrada', label: 'Cuadrada' },
  ] as Array<{ value: AvatarAppearance['formaCara']; label: string }>,
  peinado: [
    { value: 'corto', label: 'Corto' },
    { value: 'largo', label: 'Largo' },
    { value: 'rizado', label: 'Rizado' },
    { value: 'rapado', label: 'Rapado' },
  ] as Array<{ value: AvatarAppearance['peinado']; label: string }>,
  colorPelo: [
    { value: 'castanio', label: 'Castanio', swatch: 'bg-[#724133]' },
    { value: 'negro', label: 'Negro', swatch: 'bg-[#2c1b18]' },
    { value: 'rubio', label: 'Rubio', swatch: 'bg-[#d6b370]' },
    { value: 'rojo', label: 'Rojizo', swatch: 'bg-[#a55728]' },
  ] as Array<{ value: AvatarAppearance['colorPelo']; label: string; swatch: string }>,
  expresion: [
    { value: 'feliz', label: 'Feliz' },
    { value: 'tranquilo', label: 'Tranquilo' },
    { value: 'concentrado', label: 'Concentrado' },
  ] as Array<{ value: AvatarAppearance['expresion']; label: string }>,
};

function AvatarSettingsTab() {
  const { state, saveAppearance } = useWallet();
  const [draft, setDraft] = useState<AvatarAppearance>(state.appearance);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(state.appearance);
  }, [state.appearance]);

  const changed = JSON.stringify(draft) !== JSON.stringify(state.appearance);

  const update = <K extends keyof AvatarAppearance>(key: K, value: AvatarAppearance[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const apply = async () => {
    setSaving(true);
    try {
      const result = await saveAppearance(draft);
      if (result.ok) {
        toast({ title: 'Avatar actualizado', description: 'La configuracion se guardo correctamente.' });
      } else {
        toast({ title: 'No se pudo guardar', description: result.reason, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'No se pudo guardar', description: 'Revisa la conexion con el backend.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground font-heading">Configuracion del avatar</h3>
            <p className="text-sm text-muted-foreground">Los cambios se ven en la vista previa antes de aplicarlos.</p>
          </div>
        </div>

        <div className="space-y-5">
          <OptionGroup title="Genero">
            {AVATAR_OPTIONS.genero.map(option => (
              <OptionButton key={option.value} active={draft.genero === option.value} onClick={() => update('genero', option.value)}>
                {option.label}
              </OptionButton>
            ))}
          </OptionGroup>

          <OptionGroup title="Color de piel">
            {AVATAR_OPTIONS.colorPiel.map(option => (
              <OptionButton key={option.value} active={draft.colorPiel === option.value} onClick={() => update('colorPiel', option.value)}>
                <span className={`h-4 w-4 rounded-full border border-border ${option.swatch}`} />
                {option.label}
              </OptionButton>
            ))}
          </OptionGroup>

          <OptionGroup title="Forma de la cara">
            {AVATAR_OPTIONS.formaCara.map(option => (
              <OptionButton key={option.value} active={draft.formaCara === option.value} onClick={() => update('formaCara', option.value)}>
                {option.label}
              </OptionButton>
            ))}
          </OptionGroup>

          <OptionGroup title="Peinado">
            {AVATAR_OPTIONS.peinado.map(option => (
              <OptionButton key={option.value} active={draft.peinado === option.value} onClick={() => update('peinado', option.value)}>
                {option.label}
              </OptionButton>
            ))}
          </OptionGroup>

          <OptionGroup title="Color de pelo">
            {AVATAR_OPTIONS.colorPelo.map(option => (
              <OptionButton key={option.value} active={draft.colorPelo === option.value} onClick={() => update('colorPelo', option.value)}>
                <span className={`h-4 w-4 rounded-full border border-border ${option.swatch}`} />
                {option.label}
              </OptionButton>
            ))}
          </OptionGroup>

          <OptionGroup title="Expresion">
            {AVATAR_OPTIONS.expresion.map(option => (
              <OptionButton key={option.value} active={draft.expresion === option.value} onClick={() => update('expresion', option.value)}>
                {option.label}
              </OptionButton>
            ))}
          </OptionGroup>
        </div>
      </section>

      <aside className="self-start rounded-lg border border-border bg-card p-4 shadow-sm lg:sticky lg:top-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <AvatarPreview equipped={state.equipped} appearance={draft} size={220} />
          <div>
            <h3 className="font-semibold text-foreground font-heading">Vista previa</h3>
            <p className="text-xs text-muted-foreground">Aplica los cambios cuando el avatar quede como queres.</p>
          </div>
          <div className="flex w-full gap-2">
            <Button type="button" variant="outline" className="flex-1 gap-2" disabled={!changed || saving} onClick={() => setDraft(state.appearance)}>
              <RotateCcw size={15} />
              Deshacer
            </Button>
            <Button type="button" className="flex-1 gap-2" disabled={!changed || saving} onClick={apply}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Aplicar
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function OptionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:border-primary/50'
      }`}
    >
      {children}
    </button>
  );
}
