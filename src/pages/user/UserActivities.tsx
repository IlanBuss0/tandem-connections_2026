import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomActivities } from '@/contexts/CustomActivitiesContext';
import { completeAssignedActivity, fetchActivitiesForUser, Activity } from '@/data/api';
import { CheckCircle2, Clock, Award, ChevronDown, ChevronUp, Play, Sparkles, Filter, Search, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';
import ActivityExecution from './ActivityExecution';

const categoryEmoji: Record<string, string> = {
  'autonomía personal': '🦸', higiene: '🧼', organización: '📋', escuela: '📚', 'cocina básica': '🍳',
  transporte: '🚌', compras: '🛒', 'manejo del dinero': '💰', emociones: '💭', comunicación: '💬',
  'vida social': '👥', 'seguridad personal': '🛡️', 'rutinas del hogar': '🏠', 'regulación emocional': '🧘',
  'preparación para salidas': '🚪', 'anticipación de cambios': '🔄',
};

const difficultyColors: Record<string, string> = {
  fácil: 'bg-green-100 text-green-700',
  medio: 'bg-amber-100 text-amber-700',
  avanzado: 'bg-red-100 text-red-700',
};

const typeColors: Record<string, string> = {
  guiada: 'bg-blue-100 text-blue-700',
  juego: 'bg-green-100 text-green-700',
  regulación: 'bg-purple-100 text-purple-700',
  decisión: 'bg-amber-100 text-amber-700',
};

const pictogramUrl = (id: number) => `https://static.arasaac.org/pictograms/${id}/${id}_300.png`;
const isImageIcon = (value?: string) => Boolean(value?.startsWith('http'));

function StepIcon({ value, fallback, className = '' }: { value?: string; fallback: string | number; className?: string }) {
  if (isImageIcon(value)) {
    return <img src={value} alt="" className={`object-contain ${className}`} loading="lazy" />;
  }

  return <>{value || fallback}</>;
}

function buildPictogramDemoActivity(userId: string): Activity {
  return {
    id: `demo-pictogramas-${userId}`,
    title: 'Preparar una merienda con pictogramas',
    category: 'comunicación',
    objective: 'Usar apoyos visuales para seguir una rutina simple',
    description: 'Actividad de ejemplo para ver pictogramas reales de ARASAAC dentro de los pasos.',
    difficulty: 'fácil',
    duration: '5 min',
    steps: [
      'Lavarse las manos antes de empezar',
      'Elegir una comida para la merienda',
      'Servir agua o bebida',
      'Sentarse en la mesa',
      'Comer tranquilo y guardar lo usado',
    ],
    stepIcons: [
      pictogramUrl(4576),
      pictogramUrl(4610),
      pictogramUrl(5599),
      pictogramUrl(7284),
      pictogramUrl(2349),
    ],
    status: 'pendiente',
    recommendedBy: 'app',
    recommendedByName: 'TANDEM',
    progress: 0,
    assignedTo: userId,
    points: 30,
    type: 'guiada',
    completionMessage: '¡Muy bien! Seguiste una rutina usando pictogramas.',
  };
}

type ActivityDateFilter = 'all' | 'newest' | 'oldest';
type ActivityTypeFilter = 'todos' | Activity['type'];
type ActivityStatusFilter = 'todos' | Activity['status'];
type ActivityOriginFilter = 'todos' | 'tutor' | 'profesional' | 'app' | 'custom';
type ActivityDifficultyFilter = 'todos' | Activity['difficulty'];

function isAssignedToUser(activity: Activity, userId: string) {
  return activity.assignedTo === userId || (activity as any).assignedToIds?.includes(userId);
}

function isRecommendedActivity(activity: Activity, userId: string) {
  return Boolean(activity.recommendedBy || activity.recommendedByName || isAssignedToUser(activity, userId));
}

function getActivityLauncherName(activity: Activity) {
  if ((activity as any).createdByName) return (activity as any).createdByName as string;
  return activity.recommendedByName || '';
}

function getActivityOrigin(activity: Activity): Exclude<ActivityOriginFilter, 'todos'> {
  if ((activity as any).isCustom || (activity as any).createdByName) return 'custom';
  if (activity.recommendedBy === 'tutor') return 'tutor';
  if (activity.recommendedBy === 'profesional') return 'profesional';
  return 'app';
}

function getActivityTimestamp(activity: Activity, fallbackIndex: number) {
  const customTimestamp = Number((activity as any).updatedAt || (activity as any).createdAt || 0);
  if (Number.isFinite(customTimestamp) && customTimestamp > 0) return customTimestamp;

  const numericId = Number(String(activity.id).replace(/\D/g, ''));
  return Number.isFinite(numericId) && numericId > 0 ? numericId : fallbackIndex;
}

function getSourceMeta(activity: Activity) {
  if ((activity as any).isCustom || (activity as any).createdByName) {
    return {
      label: `Creada por ${(activity as any).createdByName || activity.recommendedByName || 'tu equipo'}`,
      cardClass: 'border-fuchsia-200 bg-fuchsia-50/70',
      badgeClass: 'bg-fuchsia-100 text-fuchsia-700',
    };
  }

  if (activity.recommendedBy === 'tutor') {
    return {
      label: `Recomendada por ${activity.recommendedByName || 'tu tutor'}`,
      cardClass: 'border-amber-200 bg-amber-50/70',
      badgeClass: 'bg-amber-100 text-amber-700',
    };
  }

  if (activity.recommendedBy === 'profesional') {
    return {
      label: `Recomendada por ${activity.recommendedByName || 'tu profesional'}`,
      cardClass: 'border-sky-200 bg-sky-50/70',
      badgeClass: 'bg-sky-100 text-sky-700',
    };
  }

  if (activity.recommendedBy === 'app') {
    return {
      label: `Recomendada por ${activity.recommendedByName || 'TANDEM'}`,
      cardClass: 'border-emerald-200 bg-emerald-50/70',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    };
  }

  return {
    label: '',
    cardClass: 'border-border bg-card',
    badgeClass: 'bg-muted text-muted-foreground',
  };
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {children}
      </select>
    </label>
  );
}

export default function UserActivities({ initialAssignedActivityId }: { initialAssignedActivityId?: string } = {}) {
  const { user } = useAuth();
  const { forUser, complete: completeCustomActivity } = useCustomActivities();
  const { context: permissionContext } = usePermissionContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedType, setSelectedType] = useState<ActivityTypeFilter>('todos');
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatusFilter>('todos');
  const [selectedOrigin, setSelectedOrigin] = useState<ActivityOriginFilter>('todos');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ActivityDifficultyFilter>('todos');
  const [selectedLauncher, setSelectedLauncher] = useState('todos');
  const [dateFilter, setDateFilter] = useState<ActivityDateFilter>('all');
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localActivities, setLocalActivities] = useState<Activity[]>([]);
  const [executingActivity, setExecutingActivity] = useState<Activity | null>(null);
  const canCompleteActivities = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.COMPLETAR_ACTIVIDADES,
    false,
  );


  useEffect(() => {
    let mounted = true;
    if (!user) return;
    fetchActivitiesForUser(user.id).then((rows) => {
      if (mounted) setLocalActivities(rows);
    }).catch(() => {
      if (mounted) setLocalActivities([]);
    });
    return () => { mounted = false; };
  }, [user]);
  // Custom activities asignadas a este usuario
  const customForUser = useMemo(() => user ? forUser(user.id) : [], [user, forUser]);
  const merged = useMemo(() => {
    // Custom siempre van primero (más recientes)
    const customBackendIds = new Set(customForUser.map(activity => activity.backendId).filter(Boolean));
    const localWithoutDuplicatedCustom = localActivities.filter(activity => {
      const backendCustomId = (activity as any).backendCustomActivityId;
      return !backendCustomId || !customBackendIds.has(Number(backendCustomId));
    });
    const demoCompleted = localStorage.getItem('tandem:demo-completed') === 'true';
    const demoActivity = user && !demoCompleted ? buildPictogramDemoActivity(user.id) : null;
    return [demoActivity, ...customForUser, ...localWithoutDuplicatedCustom].filter(Boolean) as Activity[];
  }, [customForUser, localActivities, user]);

  useEffect(() => {
    if (!initialAssignedActivityId) return;
    const activity = merged.find(item => String((item as any).assignedActivityId) === String(initialAssignedActivityId));
    if (activity) setExpandedId(activity.id);
  }, [initialAssignedActivityId, merged]);

  useEffect(() => {
    const storedId = localStorage.getItem('tandem:execute-activity-id');
    if (!storedId) return;
    localStorage.removeItem('tandem:execute-activity-id');
    const activity = merged.find(a => a.id === storedId);
    if (activity) setExecutingActivity(activity);
  }, [merged]);

  if (!user) return null;

  if (executingActivity) {
    return (
      <ActivityExecution
        activity={executingActivity}
        onBack={() => setExecutingActivity(null)}
        onComplete={(id) => { void completeActivity(id); }}
      />
    );
  }

  const categories = ['todas', ...Array.from(new Set(merged.map(a => a.category)))];
  const types: ActivityTypeFilter[] = ['todos', ...Array.from(new Set(merged.map(a => a.type)))] as ActivityTypeFilter[];
  const statuses: ActivityStatusFilter[] = ['todos', ...Array.from(new Set(merged.map(a => a.status)))] as ActivityStatusFilter[];
  const difficulties: ActivityDifficultyFilter[] = ['todos', ...Array.from(new Set(merged.map(a => a.difficulty)))] as ActivityDifficultyFilter[];
  const launchers = ['todos', ...Array.from(new Set(merged.map(getActivityLauncherName).filter(Boolean)))];

  let filtered = [...merged];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (normalizedSearch) {
    filtered = filtered.filter(a => a.title.toLowerCase().includes(normalizedSearch));
  }

  if (recommendedOnly) {
    filtered = filtered.filter(a => isRecommendedActivity(a, user.id));
  }

  if (selectedCategory !== 'todas') {
    filtered = filtered.filter(a => a.category === selectedCategory);
  }

  if (selectedType !== 'todos') {
    filtered = filtered.filter(a => a.type === selectedType);
  }

  if (selectedStatus !== 'todos') {
    filtered = filtered.filter(a => a.status === selectedStatus);
  }

  if (selectedDifficulty !== 'todos') {
    filtered = filtered.filter(a => a.difficulty === selectedDifficulty);
  }

  if (selectedOrigin !== 'todos') {
    filtered = filtered.filter(a => getActivityOrigin(a) === selectedOrigin);
  }

  if (selectedLauncher !== 'todos') {
    filtered = filtered.filter(a => getActivityLauncherName(a) === selectedLauncher);
  }

  if (dateFilter !== 'all') {
    filtered = filtered
      .map((activity, index) => ({ activity, timestamp: getActivityTimestamp(activity, index) }))
      .sort((a, b) => dateFilter === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp)
      .map(({ activity }) => activity);
  }

  const activeFilterCount = [
    recommendedOnly,
    dateFilter !== 'all',
    selectedCategory !== 'todas',
    selectedType !== 'todos',
    selectedStatus !== 'todos',
    selectedDifficulty !== 'todos',
    selectedOrigin !== 'todos',
    selectedLauncher !== 'todos',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm('');
    setRecommendedOnly(false);
    setDateFilter('all');
    setSelectedCategory('todas');
    setSelectedType('todos');
    setSelectedStatus('todos');
    setSelectedDifficulty('todos');
    setSelectedOrigin('todos');
    setSelectedLauncher('todos');
  };

  async function completeActivity(id: string) {
    if (!canCompleteActivities) return;
    if (id.includes('demo-pictogramas')) {
      localStorage.setItem('tandem:demo-completed', 'true');
      return;
    }
    const activity = merged.find(item => item.id === id);
    if (!activity || !user) return;
    if ((activity as any).isCustom) {
      await completeCustomActivity(id, user.id);
    } else {
      await completeAssignedActivity(activity, user.id).catch(() => undefined);
    }
    setLocalActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'completada' as const, progress: 100 } : a));
  }

  // Daily challenge
  const dailyActivity = localActivities.find(a => a.assignedTo === user.id && a.status === 'pendiente' && a.type === 'regulación') || localActivities.find(a => a.assignedTo === user.id && a.status === 'pendiente');

  return (
    <div className="pb-24 lg:pb-6 space-y-6">
      {/* Header — same style as Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">Mis Actividades</h1>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">
            Explorá, completá y seguí tu progreso
          </p>
        </div>
        <span className="text-xs text-[#8b7aa0] font-medium">
          {filtered.length} de {merged.length} actividades
        </span>
      </motion.div>

      {/* Daily challenge — restyled as white card */}
      {dailyActivity && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-3xl shadow-lg border border-[#f0e8f8] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <p className="text-xs font-semibold text-[#8b7aa0] uppercase tracking-wide flex items-center gap-1">
              <Sparkles size={12} /> Actividad del día
            </p>
            <p className="text-lg font-bold text-[#6b4c9a] mt-1">{dailyActivity.title}</p>
            <p className="text-sm text-[#8b7aa0] mt-0.5">{dailyActivity.description.slice(0, 100)}...</p>
          </div>
          <button
            onClick={() => setExecutingActivity(dailyActivity)}
            disabled={!canCompleteActivities}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition disabled:opacity-50"
          >
            <Play size={15} />
            Empezar ahora
          </button>
        </motion.div>
      )}

      {/* Warning */}
      {!canCompleteActivities && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
          Tu tutor deshabilito completar actividades por ahora.
        </div>
      )}

      {/* Search + filters — white card like Calendar */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full bg-white rounded-3xl shadow-lg border border-[#f0e8f8] p-3 sm:p-5 space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b7aa0]" />
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar actividad por nombre..."
              className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] py-2.5 pl-10 pr-9 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b0a0c0]"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7aa0] hover:text-[#6b4c9a]" aria-label="Limpiar">
                <X size={15} />
              </button>
            )}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-4 py-2.5 text-sm font-medium text-[#6b4c9a] hover:bg-[#f5f0ff] transition">
                <Filter size={15} />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6b4c9a] px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(92vw,360px)] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Filtrar actividades</p>
                  <p className="text-xs text-muted-foreground">{filtered.length} de {merged.length} resultados</p>
                </div>
                <button onClick={resetFilters} className="text-xs font-medium text-primary hover:underline">
                  Limpiar
                </button>
              </div>

              <label className="flex items-center gap-2 rounded-lg border border-border/70 p-2 text-sm">
                <Checkbox checked={recommendedOnly} onCheckedChange={checked => setRecommendedOnly(Boolean(checked))} />
                Solo recomendadas
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect label="Fecha" value={dateFilter} onChange={value => setDateFilter(value as ActivityDateFilter)}>
                  <option value="all">Sin ordenar</option>
                  <option value="newest">Mas nuevas</option>
                  <option value="oldest">Mas antiguas</option>
                </FilterSelect>

                <FilterSelect label="Lanzada por" value={selectedOrigin} onChange={value => setSelectedOrigin(value as ActivityOriginFilter)}>
                  <option value="todos">Cualquiera</option>
                  <option value="profesional">Profesional</option>
                  <option value="tutor">Tutor</option>
                  <option value="custom">Personalizada</option>
                  <option value="app">TANDEM</option>
                </FilterSelect>

                <FilterSelect label="Persona" value={selectedLauncher} onChange={setSelectedLauncher}>
                  {launchers.map(launcher => (
                    <option key={launcher} value={launcher}>{launcher === 'todos' ? 'Todas' : launcher}</option>
                  ))}
                </FilterSelect>

                <FilterSelect label="Tipo" value={selectedType} onChange={value => setSelectedType(value as ActivityTypeFilter)}>
                  {types.map(type => (
                    <option key={type} value={type}>{type === 'todos' ? 'Todos' : type}</option>
                  ))}
                </FilterSelect>

                <FilterSelect label="Categoria" value={selectedCategory} onChange={setSelectedCategory}>
                  {categories.map(category => (
                    <option key={category} value={category}>{category === 'todas' ? 'Todas' : category}</option>
                  ))}
                </FilterSelect>

                <FilterSelect label="Estado" value={selectedStatus} onChange={value => setSelectedStatus(value as ActivityStatusFilter)}>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status === 'todos' ? 'Todos' : status}</option>
                  ))}
                </FilterSelect>

                <FilterSelect label="Dificultad" value={selectedDifficulty} onChange={value => setSelectedDifficulty(value as ActivityDifficultyFilter)}>
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty === 'todos' ? 'Todas' : difficulty}</option>
                  ))}
                </FilterSelect>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selectedCategory === cat
                ? 'bg-[#6b4c9a] text-white border-transparent shadow-sm'
                : 'border-[#ede4f8] text-[#8b7aa0] bg-[#faf8ff] hover:bg-[#f5f0ff] hover:text-[#6b4c9a] hover:border-[#d8c7ef]'
            }`}
          >
            {cat === 'todas' ? 'Todas' : `${categoryEmoji[cat] || '📌'} ${cat}`}
          </button>
        ))}
      </div>
      </motion.section>

      {/* Activity cards — same style as Calendar */}
      <div className="space-y-4">
        {filtered.map((activity, i) => {
          const sourceMeta = getSourceMeta(activity);

          return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`w-full bg-white rounded-3xl shadow-lg border ${activity.status === 'completada' ? 'border-[#d0e8d0]' : 'border-[#f0e8f8]'} overflow-hidden`}
          >
            <button
              onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
              className="w-full p-4 sm:p-5 flex items-start gap-4 text-left"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f5f0ff] text-xl">
                {categoryEmoji[activity.category] || '📌'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm sm:text-base font-bold ${activity.status === 'completada' ? 'line-through text-[#8b7aa0]' : 'text-[#4a4a5a]'}`}>
                    {activity.title}
                  </p>
                  {(activity as any).isCustom && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#f5f0ff] text-[#6b4c9a] font-semibold flex items-center gap-0.5">
                      <Sparkles size={9} /> Personalizada
                    </span>
                  )}
                  {activity.status === 'completada' && <CheckCircle2 size={16} className="text-green-500" />}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${difficultyColors[activity.difficulty]}`}>
                    {activity.difficulty}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColors[activity.type]}`}>
                    {activity.type}
                  </span>
                  <span className="text-[10px] text-[#8b7aa0] flex items-center gap-1">
                    <Clock size={10} /> {activity.duration}
                  </span>
                  <span className="text-[10px] text-[#8b7aa0] flex items-center gap-1">
                    <Award size={10} /> {activity.points} pts
                  </span>
                </div>
                {activity.recommendedByName && (
                  <p className="text-[10px] text-[#6b4c9a] mt-1.5 font-medium">
                    Recomendada por {activity.recommendedByName}
                  </p>
                )}
                {sourceMeta.label && !activity.recommendedByName && (
                  <span className={`inline-flex mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${sourceMeta.badgeClass}`}>
                    {sourceMeta.label}
                  </span>
                )}
                {activity.progress > 0 && activity.progress < 100 && (
                  <div className="w-full bg-[#f0e8f8] rounded-full h-2 mt-2.5">
                    <div className="bg-[#6b4c9a] h-2 rounded-full" style={{ width: `${activity.progress}%` }} />
                  </div>
                )}
              </div>
              {expandedId === activity.id
                ? <ChevronUp size={18} className="text-[#8b7aa0] shrink-0" />
                : <ChevronDown size={18} className="text-[#8b7aa0] shrink-0" />}
            </button>

            {expandedId === activity.id && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                className="px-4 sm:px-5 pb-5 border-t border-[#f0e8f8] pt-4 space-y-3"
              >
                <p className="text-sm text-[#8b7aa0] leading-relaxed">{activity.description}</p>
                <p className="text-xs font-bold text-[#6b4c9a]">🎯 Objetivo: {activity.objective}</p>
                <div>
                  <p className="text-xs font-bold text-[#6b4c9a] mb-2">Pasos:</p>
                  <ol className="space-y-2">
                    {activity.steps.map((step, si) => (
                      <li key={si} className="flex items-start gap-3 text-xs text-[#8b7aa0]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#6b4c9a] text-[10px] font-bold overflow-hidden">
                          <StepIcon value={activity.stepIcons?.[si]} fallback={si + 1} className="w-7 h-7" />
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                {activity.status !== 'completada' && canCompleteActivities && (
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setExecutingActivity(activity)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 transition"
                    >
                      <Play size={14} /> Empezar
                    </button>
                    <button
                      onClick={() => completeActivity(activity.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-4 py-2.5 text-sm font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff] transition"
                    >
                      <CheckCircle2 size={14} /> Completada
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
          );
        })}
      </div>

      {/* Empty state — same style as Calendar */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-6 py-14 text-center shadow-sm">
          <Sparkles size={40} className="text-[#6b4c9a]/60 mb-4" />
          <p className="text-base font-bold text-[#4a4a5a]">No hay actividades</p>
          <p className="text-sm text-[#8b7aa0] mt-1">No encontramos actividades en esta categoría</p>
        </div>
      )}
    </div>
  );
}
