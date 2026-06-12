import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { deleteFavoritePictogram, fetchFavoritePictograms, fetchPictogramCategories, fetchPictograms, getPictogramDownloadUrl, savePictogram, Pictogram } from '@/data/api';
import { Search, Heart, Download, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import PermissionBlocked from '@/components/PermissionBlocked';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';

export default function UserPictograms() {
  const { user } = useAuth();
  const { context: permissionContext } = usePermissionContext();
  const [search, setSearch] = useState('');
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritePictograms, setFavoritePictograms] = useState<Pictogram[]>([]);
  const [selected, setSelected] = useState<Pictogram | null>(null);
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const canUsePictograms = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.USAR_PICTOGRAMAS,
    true,
  );

  useEffect(() => {
    if (!canUsePictograms) {
      setCategories([]);
      return;
    }
    let mounted = true;
    fetchPictogramCategories()
      .then(items => {
        if (mounted) setCategories(items.map(item => item.name).filter(Boolean));
      })
      .catch(() => {
        if (mounted) setCategories([]);
      });
    return () => { mounted = false; };
  }, [canUsePictograms]);

  useEffect(() => {
    if (!canUsePictograms || !user?.id) {
      setFavorites(new Set());
      setFavoritePictograms([]);
      return;
    }

    let mounted = true;
    fetchFavoritePictograms(user.id)
      .then(items => {
        if (!mounted) return;
        setFavoritePictograms(items);
        setFavorites(new Set(items.map(item => item.id)));
      })
      .catch(() => {
        if (!mounted) return;
        setFavoritePictograms([]);
        setFavorites(new Set());
      });

    return () => { mounted = false; };
  }, [canUsePictograms, user?.id]);

  useEffect(() => {
    if (!canUsePictograms) {
      setPictograms([]);
      return;
    }
    let mounted = true;
    const category = selectedCats.size > 0 ? Array.from(selectedCats).join(',') : 'todas';
    fetchPictograms({ category, search })
      .then(r => mounted && setPictograms(r))
      .catch(() => mounted && setPictograms([]));
    return () => { mounted = false; };
  }, [canUsePictograms, selectedCats, search]);

  const visiblePictograms = showFavorites
    ? favoritePictograms.filter(pic => !search.trim() || `${pic.name} ${pic.category} ${pic.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    : pictograms;
  const visibleCategories = categories.length > 0 ? categories : Array.from(new Set(pictograms.map(p => p.category)));
  const toggleCategory = (cat: string) => {
    if (cat === 'todas') {
      setSelectedCats(new Set());
      setShowFavorites(false);
      return;
    }

    setShowFavorites(false);
    setSelectedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };
  const toggleFav = (pic: Pictogram) => setFavorites(prev => {
    const n = new Set(prev);
    if (n.has(pic.id)) {
      n.delete(pic.id);
      setFavoritePictograms(items => items.filter(item => item.id !== pic.id));
      if (user?.id) deleteFavoritePictogram(pic.id, user.id).catch(() => undefined);
    } else {
      n.add(pic.id);
      setFavoritePictograms(items => items.some(item => item.id === pic.id) ? items : [pic, ...items]);
      if (user?.id) savePictogram(pic.id, user.id).catch(() => undefined);
    }
    return n;
  });
  const renderPicto = (pic: Pictogram, className: string) => pic.imageUrl
    ? <img src={pic.imageUrl} alt={pic.name} className={`${className} object-contain`} loading="lazy" />
    : <span className={className}>{pic.emoji}</span>;

  if (!canUsePictograms) {
    return (
      <PermissionBlocked
        title="Pictogramas deshabilitados"
        description="Tu tutor deshabilito temporalmente los pictogramas. No podes buscar, guardar ni descargar apoyos visuales hasta que lo vuelva a habilitar."
      />
    );
  }

  return <div className="space-y-4 pb-20 lg:pb-6">
    <div><h2 className="text-2xl font-heading font-bold text-foreground">Pictogramas</h2><p className="text-muted-foreground text-sm">Apoyos visuales para comunicarte</p></div>
    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pictograma..." className="pl-9" /></div>
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
      {['todas', 'me gusta', ...visibleCategories].map(cat => {
        const active = cat === 'me gusta' ? showFavorites : cat === 'todas' ? selectedCats.size === 0 && !showFavorites : selectedCats.has(cat);
        if (cat === 'me gusta') return <button key={cat} onClick={() => { setShowFavorites(true); setSelectedCats(new Set()); }} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card border-border text-muted-foreground hover:border-primary/30'}`}>Me gusta</button>;
        return <button key={cat} onClick={() => toggleCategory(cat)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card border-border text-muted-foreground hover:border-primary/30'}`}>{cat === 'todas' ? 'Todas' : cat}</button>;
      })}
    </div>
    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">{visiblePictograms.map((pic, i) => <motion.button key={pic.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }} onClick={() => setSelected(pic)} className="flex flex-col items-center p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all relative">{renderPicto(pic, 'w-12 h-12 text-3xl')}<span className="text-[10px] text-muted-foreground mt-1 leading-tight text-center">{pic.name}</span>{favorites.has(pic.id) && <Heart size={10} className="absolute top-1 right-1 text-red-400 fill-red-400" />}</motion.button>)}</div>
    {showFavorites && visiblePictograms.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Todavia no guardaste pictogramas.</p>}
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setSelected(null)}><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl p-6 max-w-xs w-full shadow-xl border border-border text-center"><button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-muted-foreground"><X size={18} /></button><div className="flex justify-center mb-4">{renderPicto(selected, 'w-32 h-32 text-7xl')}</div><h3 className="text-xl font-heading font-bold text-foreground">{selected.name}</h3><div className="flex gap-2 mt-4"><button onClick={() => toggleFav(selected)} className="flex-1 py-2 rounded-lg border text-sm">{favorites.has(selected.id) ? 'Quitar' : 'Guardar'}</button><a href={getPictogramDownloadUrl(selected.id)} download className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-sm text-muted-foreground"><Download size={14} /> Descargar</a></div></motion.div></div>}
  </div>;
}
