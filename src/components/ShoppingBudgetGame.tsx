import { useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, ShoppingCart, Trophy } from 'lucide-react';
import type { ShoppingBudgetProduct, ShoppingBudgetScenarioData } from '@/data/resourceScenario';

type Props = { data: ShoppingBudgetScenarioData; onFinish: (score: number) => void };

function ProductVisual({ product }: { product: ShoppingBudgetProduct }) {
  return product.image.startsWith('http')
    ? <img src={product.image} alt="" className="mx-auto h-16 w-16 object-contain" />
    : <span className="text-5xl" aria-hidden="true">{product.image}</span>;
}

function shuffled<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

export default function ShoppingBudgetGame({ data, onFinish }: Props) {
  const [catalog] = useState(() => shuffled(data.products));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [failedReviews, setFailedReviews] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const required = useMemo(() => data.products.filter(product => product.required), [data.products]);
  const selected = data.products.filter(product => selectedIds.includes(product.id));
  const total = selected.reduce((sum, product) => sum + product.price, 0);
  const remaining = data.budget - total;
  const score = Math.max(0, 100 - failedReviews * 10);

  const toggleProduct = (id: string) => {
    if (completed) return;
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setFeedback([]);
  };

  const review = () => {
    const missing = required.filter(product => !selectedIds.includes(product.id));
    const extras = selected.filter(product => !product.required);
    const messages: string[] = [];
    if (missing.length) messages.push(`Todavía falta: ${missing.map(product => product.name).join(', ')}.`);
    if (extras.length) messages.push(`Revisá estos productos que no están en la lista: ${extras.map(product => product.name).join(', ')}.`);
    if (total > data.budget) messages.push(`Superaste el presupuesto por ${data.currencySymbol}${total - data.budget}.`);
    if (messages.length) {
      setFailedReviews(current => current + 1);
      setFeedback(messages);
      return;
    }
    setFeedback([]);
    setCompleted(true);
  };

  return <div className="space-y-5">
    <header className="rounded-2xl border border-[#e8def3] bg-[#faf8ff] p-4 text-center">
      <h3 className="text-xl font-bold text-[#6b4c9a]">{data.prompt}</h3>
      <p className="mt-1 text-sm text-[#6f627c]">Tocá un producto para agregarlo o quitarlo del carrito.</p>
    </header>

    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-4">
        <section className="rounded-2xl border border-[#e8def3] bg-white p-4">
          <h4 className="flex items-center gap-2 font-bold text-[#5b496d]"><CheckCircle2 size={18} /> Lista de compras</h4>
          <ul className="mt-3 space-y-2">
            {required.map(product => {
              const found = selectedIds.includes(product.id);
              return <li key={product.id} className="flex items-center gap-2 text-sm"><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${found ? 'border-green-600 bg-green-600 text-white' : 'border-[#bca9d2]'}`}>{found && <Check size={13} />}</span><span className={found ? 'text-green-800' : 'text-[#5b496d]'}>{product.name}</span></li>;
            })}
          </ul>
        </section>
        <section className={`rounded-2xl border p-4 ${remaining < 0 ? 'border-red-300 bg-red-50' : 'border-[#e8def3] bg-[#faf8ff]'}`} aria-label="Resumen del presupuesto">
          <div className="flex justify-between text-sm"><span>Presupuesto</span><strong>{data.currencySymbol}{data.budget}</strong></div>
          <div className="mt-2 flex justify-between text-sm"><span>Gastado</span><strong>{data.currencySymbol}{total}</strong></div>
          <div className={`mt-2 flex justify-between border-t pt-2 font-bold ${remaining < 0 ? 'text-red-700' : 'text-[#6b4c9a]'}`}><span>{remaining < 0 ? 'Te pasaste' : 'Disponible'}</span><span>{data.currencySymbol}{Math.abs(remaining)}</span></div>
        </section>
      </aside>

      <section>
        <h4 className="mb-3 flex items-center gap-2 font-bold text-[#5b496d]"><ShoppingCart size={19} /> Productos del supermercado</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {catalog.map(product => {
            const selectedProduct = selectedIds.includes(product.id);
            return <button key={product.id} type="button" aria-pressed={selectedProduct} onClick={() => toggleProduct(product.id)} className={`relative min-h-36 rounded-2xl border-2 p-3 text-center transition ${selectedProduct ? 'border-[#6b4c9a] bg-[#f4effa]' : 'border-[#e8def3] bg-white hover:border-[#6b4c9a]/50'}`}>
              {selectedProduct && <span className="absolute right-2 top-2 rounded-full bg-[#6b4c9a] p-1 text-white"><Check size={14} /></span>}
              <ProductVisual product={product} />
              <span className="mt-2 block font-semibold text-[#5b496d]">{product.name}</span>
              <span className="block text-sm font-bold text-[#6b4c9a]">{data.currencySymbol}{product.price}</span>
            </button>;
          })}
        </div>
      </section>
    </div>

    {feedback.length > 0 && <div className="space-y-2" role="alert">{feedback.map(message => <p key={message} className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900"><AlertTriangle className="mt-0.5 shrink-0" size={17} />{message}</p>)}</div>}

    {completed ? <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
      <Trophy className="mx-auto text-amber-600" size={34} /><h4 className="text-xl font-bold text-green-900">¡Completaste la compra!</h4><p className="text-green-800">Resultado: {score}/100</p>
      <button type="button" onClick={() => onFinish(score)} className="w-full rounded-2xl bg-[#6b4c9a] px-5 py-3 font-semibold text-white">Finalizar actividad</button>
    </div> : <button type="button" onClick={review} className="w-full rounded-2xl bg-[#6b4c9a] px-5 py-3 font-semibold text-white">Revisar compra</button>}
  </div>;
}
