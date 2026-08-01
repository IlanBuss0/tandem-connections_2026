import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  deleteFavoritePictogram,
  fetchFavoritePictograms,
  fetchPictogramFilters,
  fetchPictogramsPage,
  getPictogramDownloadUrl,
  savePictogram,
  Pictogram,
  type PictogramFilterOption,
  type PictogramFilters,
} from '@/data/api';
import { Search, Heart, Download, X, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionBlocked from '@/components/PermissionBlocked';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';

const PAGE_SIZE = 48;

// Los 3 ejes de filtrado. El catalogo tiene ~42 pictogramas distintos para
// "triste" y ~36 para "agua": no son duplicados de mas, son el mismo concepto
// en estilos graficos distintos. En comunicacion aumentativa eso es una
// ventaja (hay quien lee mejor un dibujo realista, quien necesita alto
// contraste), pero solo si se puede elegir. Por eso el estilo es un filtro de
// primera clase, al mismo nivel que la categoria.
type FilterAxis = 'categories' | 'styles' | 'collections';

const AXIS_LABELS: Record<FilterAxis, string> = {
  styles: 'Estilo visual',
  categories: 'Categoría',
  collections: 'Colección',
};

// La coleccion va al final: a un perteneciente no le dice nada que un
// pictograma sea de "Tawasol", pero a un profesional que quiere consistencia
// visual en todo un tablero si le sirve.
const AXIS_ORDER: FilterAxis[] = ['styles', 'categories', 'collections'];

const AXIS_HINTS: Record<FilterAxis, string> = {
  styles: 'Cómo está dibujado el pictograma',
  categories: 'De qué trata',
  collections: 'De qué biblioteca viene',
};

const emptyFilters: PictogramFilters = { categories: [], styles: [], collections: [] };

function FilterChip({
  option,
  active,
  onToggle,
}: {
  option: PictogramFilterOption;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'border-transparent bg-[#6b4c9a] text-white shadow-sm'
          : 'border-[#ede4f8] bg-[#faf8ff] text-[#8b7aa0] hover:border-[#d8c7ef] hover:bg-[#f5f0ff] hover:text-[#6b4c9a]'
      }`}
    >
      {option.name}
      <span className={`ml-1.5 text-[10px] ${active ? 'text-white/70' : 'text-[#b8b0c8]'}`}>{option.total}</span>
    </button>
  );
}

export default function UserPictograms() {
  const { user } = useAuth();
  const { context: permissionContext } = usePermissionContext();
  const [search, setSearch] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<PictogramFilters>(emptyFilters);
  const [selected, setSelected] = useState<Pictogram | null>(null);
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritePictograms, setFavoritePictograms] = useState<Pictogram[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingPage, setLoadingPage] = useState(false);

  // Un Set de ids seleccionados por eje. Todos los ejes son multiseleccion:
  // "realista o dibujo animado" es una consulta razonable.
  const [active, setActive] = useState<Record<FilterAxis, Set<string>>>({
    categories: new Set(),
    styles: new Set(),
    collections: new Set(),
  });

  const targetPertenecienteId = permissionContext?.perteneciente?.id
    ? String(permissionContext.perteneciente.id)
    : undefined;
  const canUsePictograms = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.USAR_PICTOGRAMAS,
    true,
  );

  const activeCount = active.categories.size + active.styles.size + active.collections.size;
  const asParam = (axis: FilterAxis) => (active[axis].size > 0 ? Array.from(active[axis]).join(',') : undefined);
  // Se serializan para usarlos como dependencia del efecto: un Set nuevo en
  // cada render dispararia el fetch en loop.
  const filterKey = useMemo(
    () => [asParam('categories'), asParam('styles'), asParam('collections')].join('|'),
    [active],
  );

  useEffect(() => {
    if (!canUsePictograms) {
      setFilterOptions(emptyFilters);
      return;
    }
    let mounted = true;
    fetchPictogramFilters()
      .then(items => { if (mounted) setFilterOptions(items); })
      .catch(() => { if (mounted) setFilterOptions(emptyFilters); });
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

  // Volver a la pagina 1 cuando cambia cualquier filtro: una pagina 5 del
  // filtro viejo no tiene sentido con una busqueda o un estilo nuevo.
  useEffect(() => {
    setPage(1);
  }, [filterKey, search, showFavorites]);

  useEffect(() => {
    if (!canUsePictograms || showFavorites) {
      if (!canUsePictograms) setPictograms([]);
      return;
    }
    let mounted = true;
    setLoadingPage(true);
    fetchPictogramsPage({
      category: asParam('categories'),
      style: asParam('styles'),
      collection: asParam('collections'),
      search,
      page,
      limit: PAGE_SIZE,
      targetPertenecienteId,
    })
      .then(r => {
        if (!mounted) return;
        setPictograms(r.items);
        setTotal(r.total || 0);
        setTotalPages(Math.max(1, r.totalPages || 1));
      })
      .catch(() => {
        if (!mounted) return;
        setPictograms([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => { if (mounted) setLoadingPage(false); });
    return () => { mounted = false; };
  }, [canUsePictograms, filterKey, search, targetPertenecienteId, page, showFavorites]);

  const toggleFilter = (axis: FilterAxis, id: string) => {
    setShowFavorites(false);
    setActive(prev => {
      const next = new Set(prev[axis]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [axis]: next };
    });
  };

  const clearFilters = () => {
    setActive({ categories: new Set(), styles: new Set(), collections: new Set() });
  };

  const visiblePictograms = showFavorites
    ? favoritePictograms.filter(pic => !search.trim() || `${pic.name} ${pic.category} ${pic.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    : pictograms;

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

  const getDownloadHref = (pic: Pictogram) => {
    const source = String((pic as Pictogram & { source?: string }).source || '').toUpperCase();
    if (source === 'TANDEM_AI') return pic.downloadUrl || pic.imageUrl || getPictogramDownloadUrl(pic.id);
    return getPictogramDownloadUrl(pic.id);
  };

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

  return (
    <div className="pb-24 lg:pb-6 space-y-5">
      <div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">Pictogramas</h2>
        <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">Apoyos visuales para comunicarte</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7aa0]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar pictograma..."
          className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-3 pl-9 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltersOpen(open => !open)}
          aria-expanded={filtersOpen}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
            activeCount > 0
              ? 'border-transparent bg-[#6b4c9a] text-white shadow-sm'
              : 'border-[#ede4f8] bg-[#faf8ff] text-[#6b4c9a] hover:bg-[#f5f0ff]'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-white/25 px-1.5 text-[11px] font-bold">{activeCount}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setShowFavorites(true); clearFilters(); }}
          aria-pressed={showFavorites}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
            showFavorites
              ? 'border-transparent bg-[#6b4c9a] text-white shadow-sm'
              : 'border-[#ede4f8] bg-[#faf8ff] text-[#8b7aa0] hover:bg-[#f5f0ff] hover:text-[#6b4c9a]'
          }`}
        >
          <Heart size={14} className={showFavorites ? 'fill-white' : ''} />
          Me gusta
        </button>

        {showFavorites && (
          <button
            type="button"
            onClick={() => setShowFavorites(false)}
            className="rounded-full border border-[#ede4f8] bg-[#faf8ff] px-4 py-2 text-sm font-medium text-[#8b7aa0] hover:bg-[#f5f0ff] hover:text-[#6b4c9a]"
          >
            Ver todos
          </button>
        )}

        {!showFavorites && (
          <span className="ml-auto text-xs text-[#8b7aa0]">
            {loadingPage ? 'Buscando...' : `${total} pictograma${total === 1 ? '' : 's'}`}
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 rounded-3xl border border-[#f0e8f8] bg-white p-4 shadow-sm">
              {AXIS_ORDER.map(axis => {
                const options = filterOptions[axis];
                if (options.length === 0) return null;
                return (
                  <div key={axis}>
                    <div className="mb-2 flex items-baseline gap-2">
                      <h3 className="text-sm font-bold text-[#4a4a5a]">{AXIS_LABELS[axis]}</h3>
                      <span className="text-[11px] text-[#b8b0c8]">{AXIS_HINTS[axis]}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {options.map(option => (
                        <FilterChip
                          key={option.id}
                          option={option}
                          active={active[axis].has(option.id)}
                          onToggle={() => toggleFilter(axis, option.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-[#6b4c9a] hover:underline"
                >
                  Limpiar {activeCount} filtro{activeCount === 1 ? '' : 's'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
        {visiblePictograms.map((pic, i) => (
          <motion.button
            key={pic.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i, 20) * 0.02 }}
            onClick={() => setSelected(pic)}
            className="flex flex-col items-center p-3 rounded-2xl bg-white border border-[#f0e8f8] hover:border-[#d8c7ef] hover:shadow-md transition-all relative"
          >
            {renderPicto(pic, 'w-12 h-12 text-3xl')}
            <span className="text-[10px] text-[#8b7aa0] mt-1 leading-tight text-center">{pic.name}</span>
            {favorites.has(pic.id) && <Heart size={10} className="absolute top-1 right-1 text-red-400 fill-red-400" />}
          </motion.button>
        ))}
      </div>

      {showFavorites && visiblePictograms.length === 0 && (
        <p className="py-8 text-center text-sm text-[#8b7aa0]">Todavía no guardaste pictogramas.</p>
      )}

      {!showFavorites && !loadingPage && visiblePictograms.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-[#8b7aa0]">No hay pictogramas con esos filtros.</p>
          {activeCount > 0 && (
            <button type="button" onClick={clearFilters} className="mt-2 text-sm font-semibold text-[#6b4c9a] hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {!showFavorites && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || loadingPage}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-[#ede4f8] bg-[#faf8ff] text-[#6b4c9a] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f0ff]"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-medium text-[#8b7aa0]">Página {page} de {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loadingPage}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-[#ede4f8] bg-[#faf8ff] text-[#6b4c9a] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f0ff]"
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="relative bg-white rounded-3xl p-6 max-w-xs w-full shadow-xl border border-[#f0e8f8] text-center"
          >
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-[#8b7aa0]" aria-label="Cerrar">
              <X size={18} />
            </button>
            <div className="flex justify-center mb-4">{renderPicto(selected, 'w-32 h-32 text-7xl')}</div>
            <h3 className="text-xl font-bold text-[#6b4c9a]">{selected.name}</h3>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => toggleFav(selected)}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  favorites.has(selected.id)
                    ? 'border border-[#ede4f8] bg-[#faf8ff] text-[#6b4c9a] hover:bg-[#f5f0ff]'
                    : 'bg-[#6b4c9a] text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95'
                }`}
              >
                {favorites.has(selected.id) ? 'Quitar' : 'Guardar'}
              </button>
              <a
                href={getDownloadHref(selected)}
                download
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-2xl border border-[#ede4f8] text-sm text-[#6b4c9a] font-semibold bg-[#faf8ff] hover:bg-[#f5f0ff]"
              >
                <Download size={14} /> Descargar
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
