import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { deleteFavoritePictogram, fetchFavoritePictograms, fetchPictogramCategories, fetchPictograms, getPictogramDownloadUrl, savePictogram, Pictogram } from '@/data/api';
import { Search, Heart, Download, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionBlocked from '@/components/PermissionBlocked';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';
import { aiPictogramsApi } from '@/services/ai-pictograms';

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
  const [personalPictograms, setPersonalPictograms] = useState<Pictogram[]>([]);
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

  useEffect(() => {
    if (!canUsePictograms || !user?.id) return setPersonalPictograms([]);
    aiPictogramsApi.available().then(items => setPersonalPictograms(items.map(item => ({
      id: item.id, name: item.name, category: item.category, imageUrl: item.imageUrl,
      tags: [], emoji: '', author: 'TANDEM IA',
    } as Pictogram)))).catch(() => setPersonalPictograms([]));
  }, [canUsePictograms, user?.id]);

  const mergedPictograms = [...personalPictograms, ...pictograms].filter((item, index, all) => all.findIndex(other => other.id === item.id) === index)
    .filter(pic => (!search.trim() || `${pic.name} ${pic.category}`.toLowerCase().includes(search.toLowerCase())) && (selectedCats.size === 0 || selectedCats.has(pic.category)));
  const visiblePictograms = showFavorites
    ? favoritePictograms.filter(pic => !search.trim() || `${pic.name} ${pic.category} ${pic.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    : mergedPictograms;
  const visibleCategories = Array.from(new Set([...categories, ...personalPictograms.map(p => p.category)])).filter(Boolean);
  const toggleCategory = (cat: string) => {
    if (cat === 'todas') {
      setSelectedCats(new Set());
      setShowFavorites(false);
      return;
    }

    setShowFavorites(false);
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
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

  return <div className="pb-24 lg:pb-6 space-y-6">
    <div><h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">Pictogramas</h2><p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">Apoyos visuales para comunicarte</p></div>
    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7aa0]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pictograma..." className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 pl-9 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" /></div>
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
      {['todas', 'me gusta', ...visibleCategories].map(cat => {
        const active = cat === 'me gusta' ? showFavorites : cat === 'todas' ? selectedCats.size === 0 && !showFavorites : selectedCats.has(cat);
        if (cat === 'me gusta') return <button key={cat} onClick={() => { setShowFavorites(true); setSelectedCats(new Set()); }} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? 'bg-[#6b4c9a] text-white border-transparent shadow-sm' : 'border-[#ede4f8] text-[#8b7aa0] bg-[#faf8ff] hover:bg-[#f5f0ff] hover:text-[#6b4c9a] hover:border-[#d8c7ef]'}`}>Me gusta</button>;
        return <button key={cat} onClick={() => toggleCategory(cat)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? 'bg-[#6b4c9a] text-white border-transparent shadow-sm' : 'border-[#ede4f8] text-[#8b7aa0] bg-[#faf8ff] hover:bg-[#f5f0ff] hover:text-[#6b4c9a] hover:border-[#d8c7ef]'}`}>{cat === 'todas' ? 'Todas' : cat}</button>;
      })}
    </div>
    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">{visiblePictograms.map((pic, i) => <motion.button key={pic.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }} onClick={() => setSelected(pic)} className="flex flex-col items-center p-3 rounded-2xl bg-white border border-[#f0e8f8] hover:border-[#d8c7ef] hover:shadow-md transition-all relative">{renderPicto(pic, 'w-12 h-12 text-3xl')}<span className="text-[10px] text-[#8b7aa0] mt-1 leading-tight text-center">{pic.name}</span>{favorites.has(pic.id) && <Heart size={10} className="absolute top-1 right-1 text-red-400 fill-red-400" />}</motion.button>)}</div>
    {showFavorites && visiblePictograms.length === 0 && <p className="py-8 text-center text-sm text-[#8b7aa0]">Todavía no guardaste pictogramas.</p>}
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setSelected(null)}><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-xl border border-[#f0e8f8] text-center"><button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-[#8b7aa0]"><X size={18} /></button><div className="flex justify-center mb-4">{renderPicto(selected, 'w-32 h-32 text-7xl')}</div><h3 className="text-xl font-bold text-[#6b4c9a]">{selected.name}</h3><div className="flex gap-2 mt-4"><button onClick={() => toggleFav(selected)} className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${favorites.has(selected.id) ? 'border border-[#ede4f8] bg-[#faf8ff] text-[#6b4c9a] hover:bg-[#f5f0ff]' : 'bg-[#6b4c9a] text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95'}`}>{favorites.has(selected.id) ? 'Quitar' : 'Guardar'}</button><a href={getPictogramDownloadUrl(selected.id)} download className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-2xl border border-[#ede4f8] text-sm text-[#6b4c9a] font-semibold bg-[#faf8ff] hover:bg-[#f5f0ff]"><Download size={14} /> Descargar</a></div></motion.div></div>}
  </div>;
}
