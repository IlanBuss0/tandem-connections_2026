import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRoutines, DayKey } from '@/contexts/RoutinesContext';
import { CheckCircle2, Circle, Clock, Plus, Pencil, Trash2, Copy, X, Save } from 'lucide-react';
import { RoutineItem } from '@/data/api';

const categories = ['mañana', 'escuela', 'mediodía', 'tarde', 'noche'];
const categoryLabels: Record<string, string> = { mañana: '🌅 Mañana', escuela: '📚 Escuela', mediodía: '☀️ Mediodía', tarde: '🌤️ Tarde', noche: '🌙 Noche' };
const iconChoices = ['⏰','🛏️','🚿','👕','🥣','🪥','🎒','🚶','📚','🍽️','🎮','✏️','⭐','🥪','🧠','🎧','👔','🍝','💭','🌙','🏃','🎵','📖','🧘','🐶','🛁','💊','🥗','🌳','🎨'];

export default function UserRoutines() {
  const {
    routines, addRoutine, renameRoutine, deleteRoutine, duplicateRoutine,
    addItem, updateItem, deleteItem, toggleItem, dayNames,
  } = useRoutines();

  const todayDow = new Date().getDay() as DayKey;
  const initial = routines.find(r => r.dayOfWeek === todayDow)?.id || routines[0]?.id || null;
  const [activeId, setActiveId] = useState<string | null>(initial);
  const active = useMemo(() => routines.find(r => r.id === activeId) || routines[0] || null, [routines, activeId]);

  const [editingDay, setEditingDay] = useState(false);
  const [dayName, setDayName] = useState('');
  const [dayDow, setDayDow] = useState<string>('null');

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [form, setForm] = useState<{ time: string; title: string; icon: string; category: string }>({
    time: '08:00', title: '', icon: '⭐', category: 'mañana',
  });

  if (!active) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No hay rutinas todavía.</p>
        <button onClick={() => { const id = addRoutine('Mi día', null); setActiveId(id); }} className="mt-4 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm">Crear mi primera rutina</button>
      </div>
    );
  }

  const completed = active.items.filter(r => r.completed).length;
  const total = Math.max(active.items.length, 1);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ time: '08:00', title: '', icon: '⭐', category: 'mañana' });
    setShowAddItem(true);
  };
  const openEdit = (it: RoutineItem) => {
    setEditingItem(it);
    setForm({ time: it.time, title: it.title, icon: it.icon, category: it.category });
    setShowAddItem(true);
  };
  const submitItem = () => {
    if (!form.title.trim()) return;
    if (editingItem) updateItem(active.id, editingItem.id, form);
    else addItem(active.id, form);
    setShowAddItem(false);
  };

  const startDayEdit = () => {
    setDayName(active.name);
    setDayDow(active.dayOfWeek === null ? 'null' : String(active.dayOfWeek));
    setEditingDay(true);
  };
  const saveDayEdit = () => {
    renameRoutine(active.id, dayName.trim() || 'Mi día', dayDow === 'null' ? null : Number(dayDow) as DayKey);
    setEditingDay(false);
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Mi día</h2>
          <p className="text-muted-foreground text-sm">Tus rutinas guardadas por día</p>
        </div>
        <button onClick={() => { const id = addRoutine('Nueva rutina', null); setActiveId(id); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-sm">
          <Plus size={16} /> Nueva
        </button>
      </div>

      {/* Routines selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {routines.map(r => {
          const isActive = r.id === active.id;
          const isToday = r.dayOfWeek === todayDow;
          return (
            <button
              key={r.id}
              onClick={() => setActiveId(r.id)}
              className={`flex flex-col items-start min-w-[150px] py-2 px-3 rounded-xl border transition-all text-left ${isActive ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card border-border text-foreground hover:border-primary/30'}`}
            >
              <span className="text-[10px] uppercase opacity-80">
                {r.dayOfWeek !== null ? dayNames[r.dayOfWeek] : 'Sin día'}{isToday ? ' · Hoy' : ''}
              </span>
              <span className="text-sm font-bold truncate w-full">{r.name}</span>
              <span className="text-[10px] opacity-70">{r.items.length} pasos</span>
            </button>
          );
        })}
      </div>

      {/* Active routine controls */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
        {!editingDay ? (
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div>
              <h3 className="font-heading font-semibold text-foreground">{active.name}</h3>
              <p className="text-xs text-muted-foreground">
                {active.dayOfWeek !== null ? `Vinculado a: ${dayNames[active.dayOfWeek]}` : 'Sin día asignado'}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={startDayEdit} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title="Editar"><Pencil size={14} /></button>
              <button onClick={() => duplicateRoutine(active.id)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title="Duplicar"><Copy size={14} /></button>
              <button
                onClick={() => { if (confirm('¿Eliminar esta rutina?')) { deleteRoutine(active.id); setActiveId(routines.filter(r => r.id !== active.id)[0]?.id || null); } }}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Eliminar"
              ><Trash2 size={14} /></button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            <input value={dayName} onChange={e => setDayName(e.target.value)} placeholder="Nombre" className="w-full p-2 rounded-lg border border-border bg-background text-sm" />
            <select value={dayDow} onChange={e => setDayDow(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background text-sm">
              <option value="null">Sin día asignado</option>
              {dayNames.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={saveDayEdit} className="flex-1 py-2 rounded-lg gradient-primary text-primary-foreground text-sm inline-flex items-center justify-center gap-1"><Save size={14} /> Guardar</button>
              <button onClick={() => setEditingDay(false)} className="px-3 py-2 rounded-lg border border-border text-sm">Cancelar</button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">Progreso</span>
          <span className="text-sm font-bold text-primary">{Math.round((completed / total) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <motion.div className="gradient-primary h-3 rounded-full" initial={{ width: 0 }} animate={{ width: `${(completed / total) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{completed} de {active.items.length} actividades completadas</p>
      </div>

      {/* Add item form */}
      {showAddItem && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card rounded-xl p-4 border border-primary/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-foreground">{editingItem ? 'Editar paso' : 'Nuevo paso'}</h4>
            <button onClick={() => setShowAddItem(false)}><X size={16} className="text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="p-2 rounded-lg border border-border bg-background text-sm" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="p-2 rounded-lg border border-border bg-background text-sm">
              {categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="¿Qué tenés que hacer?" className="w-full p-2 rounded-lg border border-border bg-background text-sm" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Icono</p>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {iconChoices.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))} className={`text-xl p-1.5 rounded-lg border ${form.icon === ic ? 'border-primary bg-primary/10' : 'border-border'}`}>{ic}</button>
              ))}
            </div>
          </div>
          <button onClick={submitItem} className="w-full py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold">
            {editingItem ? 'Guardar cambios' : 'Agregar paso'}
          </button>
        </motion.div>
      )}

      {!showAddItem && (
        <button onClick={openCreate} className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary text-sm inline-flex items-center justify-center gap-2">
          <Plus size={16} /> Agregar paso
        </button>
      )}

      {/* Routine items by category */}
      {categories.map(cat => {
        const items = active.items.filter(r => r.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="font-heading font-semibold text-foreground mb-2">{categoryLabels[cat] || cat}</h3>
            <div className="space-y-2">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${item.completed ? 'bg-success/5 border-success/20' : 'bg-card border-border hover:border-primary/30'}`}
                >
                  <button onClick={() => toggleItem(active.id, item.id)} className="shrink-0">
                    {item.completed ? <CheckCircle2 size={20} className="text-success" /> : <Circle size={20} className="text-muted-foreground" />}
                  </button>
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-medium truncate ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} /> {item.time}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Pencil size={12} /></button>
                    <button onClick={() => deleteItem(active.id, item.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 size={12} /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
