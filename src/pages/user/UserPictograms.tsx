import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchPictograms, Pictogram } from '@/data/api';
import { Search, Heart, Download, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function UserPictograms() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('todas');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Pictogram | null>(null);
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchPictograms({ category: selectedCat, search }).then(r => mounted && setPictograms(r)).catch(() => mounted && setPictograms([]));
    return () => { mounted = false; };
  }, [selectedCat, search]);

  const categories = ['todas', ...Array.from(new Set(pictograms.map(p => p.category)))];
  const toggleFav = (id: string) => setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return <div className="space-y-4 pb-20 lg:pb-6">{/* same ui */}
    <div><h2 className="text-2xl font-heading font-bold text-foreground">🖼️ Pictogramas</h2><p className="text-muted-foreground text-sm">Apoyos visuales para comunicarte</p></div>
    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pictograma..." className="pl-9" /></div>
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">{categories.map(cat => <button key={cat} onClick={() => setSelectedCat(cat)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCat === cat ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card border-border text-muted-foreground hover:border-primary/30'}`}>{cat === 'todas' ? '📌 Todas' : cat}</button>)}</div>
    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">{pictograms.map((pic, i) => <motion.button key={pic.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }} onClick={() => setSelected(pic)} className="flex flex-col items-center p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all relative"><span className="text-3xl">{pic.emoji}</span><span className="text-[10px] text-muted-foreground mt-1 leading-tight text-center">{pic.name}</span>{favorites.has(pic.id) && <Heart size={10} className="absolute top-1 right-1 text-red-400 fill-red-400" />}</motion.button>)}</div>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setSelected(null)}><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl p-6 max-w-xs w-full shadow-xl border border-border text-center"><button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-muted-foreground"><X size={18} /></button><span className="text-7xl block mb-4">{selected.emoji}</span><h3 className="text-xl font-heading font-bold text-foreground">{selected.name}</h3><div className="flex gap-2 mt-4"><button onClick={() => toggleFav(selected.id)} className="flex-1 py-2 rounded-lg border text-sm">Guardar</button><button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-sm text-muted-foreground"><Download size={14} /> Descargar</button></div></motion.div></div>}
  </div>;
}
