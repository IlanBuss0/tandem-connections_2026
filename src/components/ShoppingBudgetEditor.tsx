import { useMemo, useState } from 'react';
import { ImagePlus, Plus, ShoppingBasket, Trash2 } from 'lucide-react';
import PictogramPicker from '@/components/PictogramPicker';
import type { ShoppingBudgetProduct, ShoppingBudgetScenarioData } from '@/data/resourceScenario';
import { validateShoppingBudgetScenario } from '@/data/resourceScenario';

type Props = {
  value: ShoppingBudgetScenarioData;
  onChange: (value: ShoppingBudgetScenarioData) => void;
  targetUsuarioId?: string;
};

const fieldClass = 'w-full rounded-xl border border-[#e6dcf2] bg-white px-3 py-2 text-sm text-[#4a3b5f] outline-none focus:ring-2 focus:ring-[#6b4c9a]/20';
const makeId = () => `product-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function ProductVisual({ value, name }: { value: string; name: string }) {
  return value.startsWith('http')
    ? <img src={value} alt={name} className="h-12 w-12 rounded-lg object-contain" />
    : <span className="text-3xl" aria-hidden="true">{value || '🛒'}</span>;
}

export default function ShoppingBudgetEditor({ value, onChange, targetUsuarioId }: Props) {
  const [pickingId, setPickingId] = useState<string | null>(null);
  const validation = useMemo(() => validateShoppingBudgetScenario(value), [value]);
  const requiredTotal = value.products.filter(product => product.required).reduce((sum, product) => sum + product.price, 0);

  const updateProduct = (id: string, patch: Partial<ShoppingBudgetProduct>) => onChange({
    ...value,
    products: value.products.map(product => product.id === id ? { ...product, ...patch } : product),
  });
  const addProduct = (required: boolean) => {
    if (value.products.length >= 12) return;
    const product: ShoppingBudgetProduct = { id: makeId(), name: '', image: '🛒', price: 1, required };
    onChange({ ...value, products: [...value.products, product] });
  };
  const removeProduct = (id: string) => onChange({ ...value, products: value.products.filter(product => product.id !== id) });

  const renderProducts = (required: boolean) => {
    const products = value.products.filter(product => product.required === required);
    return <div className="space-y-3">
      {products.map(product => <article key={product.id} className="space-y-3 rounded-xl border border-[#e8def3] bg-white p-3">
        <div className="grid items-center gap-2 sm:grid-cols-[56px_1fr_120px_40px]">
          <ProductVisual value={product.image} name={product.name || 'Producto'} />
          <input className={fieldClass} aria-label={`Nombre de ${required ? 'producto necesario' : 'producto extra'}`} placeholder="Nombre del producto" value={product.name} onChange={event => updateProduct(product.id, { name: event.target.value })} />
          <label className="text-xs font-semibold text-[#6b4c9a]">Precio
            <div className="mt-1 flex items-center gap-1"><span>{value.currencySymbol}</span><input className={fieldClass} aria-label={`Precio de ${product.name || 'producto'}`} type="number" min={1} step={1} value={product.price} onChange={event => updateProduct(product.id, { price: Number(event.target.value) })} /></div>
          </label>
          <button type="button" aria-label={`Eliminar ${product.name || 'producto'}`} onClick={() => removeProduct(product.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={18} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${fieldClass} flex-1`} aria-label={`Emoji o URL de ${product.name || 'producto'}`} placeholder="Emoji o URL del pictograma" value={product.image} onChange={event => updateProduct(product.id, { image: event.target.value })} />
          <button type="button" onClick={() => setPickingId(current => current === product.id ? null : product.id)} className="inline-flex items-center gap-2 rounded-xl border border-[#6b4c9a]/30 px-3 py-2 text-sm font-semibold text-[#6b4c9a]"><ImagePlus size={16} /> Buscar pictograma</button>
          <button type="button" onClick={() => updateProduct(product.id, { required: !required })} className="rounded-xl bg-[#f4effa] px-3 py-2 text-xs font-semibold text-[#6b4c9a]">Mover a {required ? 'otros productos' : 'la lista'}</button>
        </div>
        {pickingId === product.id && <PictogramPicker targetUsuarioId={targetUsuarioId} placeholder={`Buscar pictograma para ${product.name || 'el producto'}...`} onSelect={picto => {
          updateProduct(product.id, { image: picto.imageUrl || picto.emoji || '🛒', name: product.name || picto.name });
          setPickingId(null);
        }} />}
      </article>)}
      {products.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-sm text-[#8b7aa0]">Todavía no agregaste productos en esta sección.</p>}
      <button type="button" disabled={value.products.length >= 12} onClick={() => addProduct(required)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b4c9a] disabled:opacity-40"><Plus size={16} /> Agregar producto</button>
    </div>;
  };

  return <div className="space-y-5 rounded-2xl border border-[#e8def3] bg-[#faf8ff] p-4">
    <header className="flex items-start gap-3">
      <span className="rounded-xl bg-[#6b4c9a]/10 p-2 text-[#6b4c9a]"><ShoppingBasket size={22} /></span>
      <div><h4 className="font-semibold text-[#6b4c9a]">Configurá una compra simple</h4><p className="text-xs text-[#8b7aa0]">Sólo necesitás definir qué comprar, qué otros productos se mostrarán y cuánto dinero hay disponible.</p></div>
    </header>

    <section className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_90px_160px]">
      <label className="text-xs font-semibold text-[#6b4c9a]">Consigna
        <input className={`${fieldClass} mt-1`} value={value.prompt} onChange={event => onChange({ ...value, prompt: event.target.value })} />
      </label>
      <label className="text-xs font-semibold text-[#6b4c9a]">Moneda
        <input className={`${fieldClass} mt-1`} maxLength={4} value={value.currencySymbol} onChange={event => onChange({ ...value, currencySymbol: event.target.value })} />
      </label>
      <label className="text-xs font-semibold text-[#6b4c9a]">Presupuesto
        <input className={`${fieldClass} mt-1`} type="number" min={1} step={1} value={value.budget} onChange={event => onChange({ ...value, budget: Number(event.target.value) })} />
      </label>
    </section>

    <section className="space-y-3"><div><h5 className="font-semibold text-[#5b496d]">1. Lista de compras</h5><p className="text-xs text-[#8b7aa0]">Estos son los productos que el perteneciente debe encontrar. Total: {value.currencySymbol}{requiredTotal}.</p></div>{renderProducts(true)}</section>
    <section className="space-y-3 border-t border-[#e8def3] pt-4"><div><h5 className="font-semibold text-[#5b496d]">2. Otros productos del catálogo</h5><p className="text-xs text-[#8b7aa0]">Sirven para practicar la búsqueda y no deben quedar en el carrito final.</p></div>{renderProducts(false)}</section>

    <p role="status" className={`rounded-xl p-3 text-sm font-medium ${validation ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>{validation || 'La compra está lista para publicar.'}</p>
  </div>;
}
