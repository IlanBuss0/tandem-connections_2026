import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomActivities } from '@/contexts/CustomActivitiesContext';
import { completeAssignedActivity, fetchActivitiesForUser, Activity } from '@/data/api';
import { CheckCircle2, Clock, Award, ChevronDown, ChevronUp, Play, Sparkles, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export default function UserActivities() {
  const { user } = useAuth();
  const { forUser, complete: completeCustomActivity } = useCustomActivities();
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
    const demoActivity = user ? buildPictogramDemoActivity(user.id) : null;
    return [demoActivity, ...customForUser, ...localWithoutDuplicatedCustom].filter(Boolean) as Activity[];
  }, [customForUser, localActivities, user]);

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
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Actividades</h2>
        <p className="text-muted-foreground text-sm">Explora actividades, recomendaciones y novedades desde un solo lugar</p>
      </div>

      {/* Daily challenge */}
      {dailyActivity && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-xl p-4 text-primary-foreground">
          <p className="text-xs font-medium opacity-80">🎯 Actividad del día</p>
          <p className="font-heading font-bold mt-1">{dailyActivity.title}</p>
          <p className="text-xs opacity-80 mt-1">{dailyActivity.description.slice(0, 80)}...</p>
          <Button size="sm" variant="outline" className="mt-3 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setExecutingActivity(dailyActivity)}>
            <Play size={14} className="mr-1" /> Empezar ahora
          </Button>
        </motion.div>
      )}

      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="button" className="h-10 shrink-0 gradient-primary text-primary-foreground" onClick={resetFilters}>
            Todas
          </Button>

          <div className="relative min-w-0 flex-1 sm:ml-auto sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre"
              className="h-10 pl-9 pr-9"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpiar busqueda">
                <X size={15} />
              </button>
            )}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="h-10 shrink-0 gap-2">
                <Filter size={16} />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(92vw,360px)] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Filtrar actividades</p>
                  <p className="text-xs text-muted-foreground">{filtered.length} de {merged.length} resultados</p>
                </div>
                <button type="button" onClick={resetFilters} className="text-xs font-medium text-primary hover:underline">
                  Limpiar
                </button>
              </div>

              <label className="flex items-center gap-2 rounded-lg border border-border/70 p-2 text-sm">
                <Checkbox checked={recommendedOnly} onCheckedChange={checked => setRecommendedOnly(Boolean(checked))} />
                Solo recomendadas
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect label="Fecha de salida" value={dateFilter} onChange={value => setDateFilter(value as ActivityDateFilter)}>
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
      </div>

      <div className="hidden">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCategory === cat ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card border-border text-muted-foreground hover:border-primary/30'}`}
          >
            {cat === 'todas' ? '📌 Todas' : `${categoryEmoji[cat] || '📌'} ${cat}`}
          </button>
        ))}
      </div>

      {/* Activities list */}
      <div className="space-y-3">
        {filtered.map((activity, i) => {
          const sourceMeta = getSourceMeta(activity);

          return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`rounded-xl border shadow-sm overflow-hidden ${activity.status === 'completada' ? 'border-success/30 bg-card' : sourceMeta.cardClass}`}
          >
            <button
              onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
              className="w-full p-4 flex items-start gap-3 text-left"
            >
              <span className="text-2xl shrink-0">{categoryEmoji[activity.category] || '📌'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-medium text-sm ${activity.status === 'completada' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{activity.title}</p>
                  {(activity as any).isCustom && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary flex items-center gap-0.5"><Sparkles size={9} />Personalizada</span>}
                  {activity.status === 'completada' && <CheckCircle2 size={14} className="text-success" />}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${difficultyColors[activity.difficulty]}`}>{activity.difficulty}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeColors[activity.type]}`}>{activity.type}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {activity.duration}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Award size={10} /> {activity.points} pts</span>
                </div>
                {activity.recommendedByName && (
                  <p className="text-[10px] text-primary mt-1">
                    {activity.recommendedBy === 'tutor' ? '👩 ' : activity.recommendedBy === 'profesional' ? '👩‍⚕️ ' : '🤖 '}
                    Recomendada por {activity.recommendedByName}
                  </p>
                )}
                {sourceMeta.label && !activity.recommendedByName && (
                  <span className={`inline-flex mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${sourceMeta.badgeClass}`}>
                    {sourceMeta.label}
                  </span>
                )}
                {activity.progress > 0 && activity.progress < 100 && (
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${activity.progress}%` }} />
                  </div>
                )}
              </div>
              {expandedId === activity.id ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
            </button>

            {expandedId === activity.id && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-4 pb-4 border-t border-border/50 pt-3">
                <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                <p className="text-xs font-semibold text-foreground mb-1">🎯 Objetivo: {activity.objective}</p>
                <div className="mt-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Pasos:</p>
                  <ol className="space-y-1.5">
                    {activity.steps.map((step, si) => (
                      <li key={si} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold overflow-hidden">
                          <StepIcon value={activity.stepIcons?.[si]} fallback={si + 1} className="w-8 h-8" />
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                {activity.status !== 'completada' && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="flex-1 gradient-primary text-primary-foreground" onClick={() => setExecutingActivity(activity)}>
                      <Play size={14} className="mr-1" /> Empezar actividad
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => completeActivity(activity.id)}>
                      <CheckCircle2 size={14} className="mr-1" /> Marcar completada
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-3xl mb-2">📭</p>
          <p>No hay actividades en esta categoría</p>
        </div>
      )}
    </div>
  );
}
