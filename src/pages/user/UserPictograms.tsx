import { useState } from 'react';
import { motion } from 'framer-motion';
import { pictograms, Pictogram } from '@/data/mockData';
import { Search, Heart, Download, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function UserPictograms() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('todas');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['pic1','pic7','pic11','pic30','pic32']));
  const [selected, setSelected] = useState<Pictogram | null>(null);

  const categories = ['todas', ...Array.from(new Set(pictograms.map(p => p.category)))];

  const filtered = pictograms.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.includes(search.toLowerCase()));
    const matchCat = selectedCat === 'todas' || p.category === selectedCat;
    return matchSearch && matchCat;
  });

  const toggleFav = (id: string) => {
    setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">🖼️ Pictogramas</h2>
        <p className="text-muted-foreground text-sm">Apoyos visuales para comunicarte</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pictograma..." className="pl-9" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCat(cat)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCat === cat ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card border-border text-muted-foreground hover:border-primary/30'}`}>
            {cat === 'todas' ? '📌 Todas' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
        {filtered.map((pic, i) => (
          <motion.button
            key={pic.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => setSelected(pic)}
            className="flex flex-col items-center p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all relative"
          >
            <span className="text-3xl">{pic.emoji}</span>
            <span className="text-[10px] text-muted-foreground mt-1 leading-tight text-center">{pic.name}</span>
            {favorites.has(pic.id) && <Heart size={10} className="absolute top-1 right-1 text-red-400 fill-red-400" />}
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-3xl mb-2">🔍</p>
          <p>No se encontraron pictogramas</p>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl p-6 max-w-xs w-full shadow-xl border border-border text-center">
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-muted-foreground"><X size={18} /></button>
            <span className="text-7xl block mb-4">{selected.emoji}</span>
            <h3 className="text-xl font-heading font-bold text-foreground">{selected.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{selected.category}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => toggleFav(selected.id)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-sm ${favorites.has(selected.id) ? 'bg-red-50 border-red-200 text-red-600' : 'border-border text-muted-foreground'}`}>
                <Heart size={14} className={favorites.has(selected.id) ? 'fill-red-400' : ''} /> {favorites.has(selected.id) ? 'Guardado' : 'Guardar'}
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-sm text-muted-foreground">
                <Download size={14} /> Descargar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
