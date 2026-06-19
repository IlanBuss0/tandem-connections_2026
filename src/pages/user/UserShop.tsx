import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Backpack, Check, Coins, Loader2, Lock, RotateCcw, Save, Settings, ShoppingBag, Sparkles } from 'lucide-react';
import { AvatarAppearance, AvatarClothing, useWallet } from '@/contexts/WalletContext';
import { CATEGORY_LABELS, RARITY_STYLES, SHOP_ITEMS, ShopCategory } from '@/data/shopItems';
import AvatarPreview from '@/components/AvatarPreview';
import CoinBadge from '@/components/CoinBadge';
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
    <div className="pb-24 lg:pb-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">Tienda y avatar</h2>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">Personaliza tu personaje con las monedas que ganas</p>
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

      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-[#f5f0ff] p-1">
        {TABS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex min-w-[118px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
              tab === item.id ? 'bg-white text-[#6b4c9a] shadow-md' : 'text-[#8b7aa0] hover:text-[#6b4c9a]'
            }`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#f0e8f8] bg-white p-3 text-sm text-[#8b7aa0] shadow-lg">
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
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  cat === category ? 'bg-[#6b4c9a] text-white shadow-sm' : 'border border-[#ede4f8] text-[#8b7aa0] bg-[#faf8ff] hover:bg-[#f5f0ff] hover:text-[#6b4c9a]'
                }`}
              >
                {category === 'todas' ? 'Todas' : CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>

          {items.length === 0 && (
            <div className="py-10 text-center text-sm text-[#8b7aa0]">
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
                  className="flex flex-col rounded-2xl border border-[#f0e8f8] bg-white p-3 shadow-md"
                >
                  <div className="relative mb-2 flex aspect-square items-center justify-center rounded-xl bg-[#faf8ff] text-5xl">
                    <span aria-hidden>{item.emoji}</span>
                    <span className={`absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${RARITY_STYLES[item.rarity].class}`}>
                      {RARITY_STYLES[item.rarity].label}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm font-semibold leading-tight text-[#4a4a5a]">{item.name}</p>
                  <p className="mt-0.5 min-h-[28px] line-clamp-2 text-[11px] text-[#8b7aa0]">{item.description}</p>

                  <div className="mt-2">
                    {owned ? (
                      equipped ? (
                        <button onClick={() => unequip(item.category)} className="inline-flex items-center justify-center gap-1 h-8 w-full rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-xs font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff]">
                          <Check size={12} />
                          Equipado
                        </button>
                      ) : (
                        <button onClick={() => equip(item.id)} className="inline-flex items-center justify-center gap-1 h-8 w-full rounded-2xl bg-[#6b4c9a] text-xs font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95">
                          Equipar
                        </button>
                      )
                    ) : (
                      <button
                        disabled={!canAfford || pending}
                        onClick={() => handleBuy(item.id)}
                        className={`inline-flex items-center justify-center gap-1 h-8 w-full rounded-2xl text-xs font-semibold transition-all ${
                          canAfford ? 'bg-[#6b4c9a] text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95' : 'border border-[#ede4f8] bg-[#faf8ff] text-[#8b7aa0]'
                        } disabled:opacity-60`}
                      >
                        {pending ? <Loader2 size={12} className="animate-spin" /> : canAfford ? <Coins size={12} /> : <Lock size={12} />}
                        {item.price}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {state.history.length > 0 && tab !== 'avatar' && tab !== 'configuracion' && (
        <div className="mt-4 rounded-2xl border border-[#f0e8f8] bg-white p-4 shadow-lg">
          <h3 className="mb-2 text-sm font-semibold text-[#6b4c9a]">Movimientos recientes</h3>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {state.history.slice(0, 8).map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-xs">
                <span className="truncate pr-2 text-[#8b7aa0]">{tx.reason}</span>
                <span className={`shrink-0 font-semibold tabular-nums ${tx.type === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
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
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-[#f0e8f8] bg-white p-5 shadow-lg sm:flex-row sm:p-6">
        <AvatarPreview equipped={state.equipped} appearance={state.appearance} size={180} />
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-[#6b4c9a]">Tu avatar TANDEM</h3>
          <p className="mt-1 text-sm text-[#8b7aa0]">Equipa items de tu inventario para personalizarlo. Gana mas monedas completando actividades.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <CoinBadge size="md" />
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f0ff] px-3 py-1.5 text-xs text-[#8b7aa0]">
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
          <div key={category} className="rounded-2xl border border-[#f0e8f8] bg-white p-4 shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[#4a4a5a]">{CATEGORY_LABELS[category]}</h4>
              {equippedId && (
                <button onClick={() => unequip(category)} className="text-xs text-[#8b7aa0] hover:text-[#6b4c9a]">
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
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 text-3xl transition-all ${
                      active ? 'border-[#6b4c9a] bg-[#f5f0ff]' : 'border-[#ede4f8] bg-[#faf8ff] hover:border-[#d8c7ef] hover:bg-[#f5f0ff]'
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
    { value: 'neutral', label: 'Por defecto' },
    { value: 'femenino', label: 'Arqueadas' },
    { value: 'masculino', label: 'Naturales' },
    { value: 'enojado', label: 'Enojadas' },
    { value: 'triste', label: 'Tristes' },
    { value: 'arribaAbajo', label: 'Sube y baja' },
    { value: 'ce�o', label: 'Fruncidas' },
  ] as Array<{ value: AvatarAppearance['genero']; label: string }>,
  colorPiel: [
    { value: 'claro', label: 'Claro', swatch: 'bg-[#f2c9a0]' },
    { value: 'medio', label: 'Medio', swatch: 'bg-[#c98b5f]' },
    { value: 'oscuro', label: 'Oscuro', swatch: 'bg-[#7a4a31]' },
  ] as Array<{ value: AvatarAppearance['colorPiel']; label: string; swatch: string }>,
  formaCara: [
    { value: 'redonda', label: 'Felices' },
    { value: 'ovalada', label: 'Normales' },
    { value: 'cuadrada', label: 'Entornados' },
    { value: 'cerrados', label: 'Cerrados' },
    { value: 'guino', label: 'Gui�o' },
    { value: 'corazones', label: 'Corazones' },
    { value: 'sorprendidos', label: 'Sorprendidos' },
    { value: 'llanto', label: 'Llanto' },
  ] as Array<{ value: AvatarAppearance['formaCara']; label: string }>,
  peinado: [
    { value: 'corto', label: 'Corto' },
    { value: 'cortoLiso', label: 'Corto liso' },
    { value: 'mediaMelena', label: 'Media melena' },
    { value: 'largo', label: 'Largo' },
    { value: 'rizado', label: 'Rizado' },
    { value: 'despeinado', label: 'Despeinado' },
    { value: 'afro', label: 'Afro' },
    { value: 'bun', label: 'Mo�o' },
    { value: 'trenzas', label: 'Trenzas' },
    { value: 'rapado', label: 'Rapado' },
  ] as Array<{ value: AvatarAppearance['peinado']; label: string }>,
  colorPelo: [
    { value: 'castanio', label: 'Castanio', swatch: 'bg-[#724133]' },
    { value: 'negro', label: 'Negro', swatch: 'bg-[#2c1b18]' },
    { value: 'rubio', label: 'Rubio', swatch: 'bg-[#d6b370]' },
    { value: 'rojo', label: 'Rojizo', swatch: 'bg-[#a55728]' },
  ] as Array<{ value: AvatarAppearance['colorPelo']; label: string; swatch: string }>,
  expresion: [
    { value: 'feliz', label: 'Sonrisa' },
    { value: 'tranquilo', label: 'Tranquila' },
    { value: 'concentrado', label: 'Serio' },
    { value: 'preocupado', label: 'Preocupado' },
    { value: 'triste', label: 'Triste' },
    { value: 'sorprendido', label: 'Sorprendido' },
    { value: 'lengua', label: 'Lengua' },
    { value: 'descreido', label: 'Descre�do' },
  ] as Array<{ value: AvatarAppearance['expresion']; label: string }>,
  ropa: [
    { value: 'hoodie', label: 'Buzo' },
    { value: 'blazerCamisa', label: 'Blazer + camisa' },
    { value: 'blazerSueter', label: 'Blazer + sweater' },
    { value: 'cuelloSueter', label: 'Cuello + sweater' },
    { value: 'remeraGrafica', label: 'Remera gr�fica' },
    { value: 'overall', label: 'Overol' },
    { value: 'remeraCuelloRedondo', label: 'Remera c. redondo' },
    { value: 'remeraEscote', label: 'Remera escote' },
    { value: 'remeraCuelloV', label: 'Remera c. V' },
  ] as Array<{ value: AvatarClothing; label: string }>,
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
      <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 sm:p-5 shadow-lg">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#6b4c9a]">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#6b4c9a]">Configuracion del avatar</h3>
            <p className="text-sm text-[#8b7aa0]">Los cambios se ven en la vista previa antes de aplicarlos.</p>
          </div>
        </div>

        <div className="space-y-5">
          <OptionGroup title="Cejas">
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

          <OptionGroup title="Ojos">
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

          <OptionGroup title="Boca">
            {AVATAR_OPTIONS.expresion.map(option => (
              <OptionButton key={option.value} active={draft.expresion === option.value} onClick={() => update('expresion', option.value)}>
                {option.label}
              </OptionButton>
            ))}
          </OptionGroup>

          <OptionGroup title="Vestimenta">
            {AVATAR_OPTIONS.ropa.map(option => (
              <OptionButton key={option.value} active={draft.ropa === option.value} onClick={() => update('ropa', option.value)}>
                {option.label}
              </OptionButton>
            ))}
          </OptionGroup>
        </div>
      </section>

      <aside className="self-start rounded-3xl border border-[#f0e8f8] bg-white p-4 shadow-lg lg:sticky lg:top-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <AvatarPreview equipped={state.equipped} appearance={draft} size={220} />
          <div>
            <h3 className="font-semibold text-[#6b4c9a]">Vista previa</h3>
            <p className="text-xs text-[#8b7aa0]">Aplica los cambios cuando el avatar quede como queres.</p>
          </div>
          <div className="flex w-full gap-2">
            <button type="button" disabled={!changed || saving} onClick={() => setDraft(state.appearance)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-4 py-2.5 text-sm font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff] disabled:opacity-60">
              <RotateCcw size={15} />
              Deshacer
            </button>
            <button type="button" disabled={!changed || saving} onClick={apply} className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Aplicar
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function OptionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[#4a4a5a]">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
        active ? 'border-[#6b4c9a] bg-[#f5f0ff] text-[#6b4c9a] shadow-sm' : 'border-[#ede4f8] bg-[#faf8ff] text-[#4a4a5a] hover:border-[#d8c7ef] hover:bg-[#f5f0ff]'
      }`}
    >
      {children}
    </button>
  );
}
