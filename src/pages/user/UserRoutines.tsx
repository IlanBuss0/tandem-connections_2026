import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRoutines, DayKey } from '@/contexts/RoutinesContext';
import { CheckCircle2, Circle, Clock, Plus, Pencil, Trash2, Copy, X, Save } from 'lucide-react';
import { RoutineItem } from '@/data/api';
import PermissionBlocked from '@/components/PermissionBlocked';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';

const categories = ['mañana', 'escuela', 'mediodía', 'tarde', 'noche'];
const categoryLabels: Record<string, string> = { mañana: '🌅 Mañana', escuela: '📚 Escuela', mediodía: '☀️ Mediodía', tarde: '🌤️ Tarde', noche: '🌙 Noche' };
const iconChoices = ['⏰','🛏️','🚿','👕','🥣','🪥','🎒','🚶','📚','🍽️','🎮','✏️','⭐','🥪','🧠','🎧','👔','🍝','💭','🌙','🏃','🎵','📖','🧘','🐶','🛁','💊','🥗','🌳','🎨'];

export default function UserRoutines() {
  const { context: permissionContext } = usePermissionContext();
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

  const canUseMiDia = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.USAR_MI_DIA,
    true,
  );

  if (!canUseMiDia) {
    return (
      <PermissionBlocked
        title="Mi dia deshabilitado"
        description="Tu tutor deshabilito temporalmente Mi dia. No podes ver, crear ni completar rutinas hasta que lo vuelva a habilitar."
      />
    );
  }

  if (!active) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#8b7aa0]">No hay rutinas todavía.</p>
        <button onClick={() => { const id = addRoutine('Mi día', null); setActiveId(id); }} className="mt-4 px-4 py-2.5 rounded-2xl bg-[#6b4c9a] text-white text-sm font-semibold shadow-md shadow-purple-200 hover:bg-[#5a3c8a]">Crear mi primera rutina</button>
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
    const payload = { ...form, title: form.title.trim() };
    if (!payload.title) return;
    if (editingItem) updateItem(active.id, editingItem.id, payload);
    else addItem(active.id, payload);
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
    <div className="pb-24 lg:pb-6 space-y-6">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">Mi día</h2>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">Tus rutinas guardadas por día</p>
        </div>
        <button onClick={() => { const id = addRoutine('Nueva rutina', null); setActiveId(id); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#6b4c9a] text-white text-sm font-semibold shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95">
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
              className={`flex flex-col items-start min-w-[150px] py-2 px-3 rounded-xl border transition-all text-left ${isActive ? 'bg-[#6b4c9a] text-white border-transparent shadow-sm' : 'bg-white border-[#f0e8f8] text-[#4a4a5a] hover:border-[#d8c7ef] hover:shadow-md'}`}
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
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#f0e8f8] shadow-lg">
        {!editingDay ? (
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-[#6b4c9a]">{active.name}</h3>
              <p className="text-xs text-[#8b7aa0]">
                {active.dayOfWeek !== null ? `Vinculado a: ${dayNames[active.dayOfWeek]}` : 'Sin día asignado'}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={startDayEdit} className="p-2 rounded-xl hover:bg-[#f5f0ff] text-[#8b7aa0]" title="Editar"><Pencil size={14} /></button>
              <button onClick={() => duplicateRoutine(active.id)} className="p-2 rounded-xl hover:bg-[#f5f0ff] text-[#8b7aa0]" title="Duplicar"><Copy size={14} /></button>
              <button
                onClick={() => { if (confirm('¿Eliminar esta rutina?')) { deleteRoutine(active.id); setActiveId(routines.filter(r => r.id !== active.id)[0]?.id || null); } }}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Eliminar"
              ><Trash2 size={14} /></button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            <input value={dayName} onChange={e => setDayName(e.target.value)} placeholder="Nombre" className="w-full p-2.5 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20" />
            <select value={dayDow} onChange={e => setDayDow(e.target.value)} className="w-full p-2.5 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20">
              <option value="null">Sin día asignado</option>
              {dayNames.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={saveDayEdit} className="flex-1 py-2.5 rounded-2xl bg-[#6b4c9a] text-white text-sm font-semibold shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 inline-flex items-center justify-center gap-1"><Save size={14} /> Guardar</button>
              <button onClick={() => setEditingDay(false)} className="px-3 py-2.5 rounded-2xl border border-[#ede4f8] text-sm text-[#6b4c9a] font-semibold bg-[#faf8ff] hover:bg-[#f5f0ff]">Cancelar</button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-[#4a4a5a]">Progreso</span>
          <span className="text-sm font-bold text-[#6b4c9a]">{Math.round((completed / total) * 100)}%</span>
        </div>
        <div className="w-full bg-[#f0e8f8] rounded-full h-3">
          <motion.div className="bg-[#6b4c9a] h-3 rounded-full" initial={{ width: 0 }} animate={{ width: `${(completed / total) * 100}%` }} />
        </div>
        <p className="text-xs text-[#8b7aa0] mt-2">{completed} de {active.items.length} actividades completadas</p>
      </div>

      {/* Add item form */}
      {showAddItem && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-2xl p-4 border border-[#6b4c9a]/20 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-[#4a4a5a]">{editingItem ? 'Editar paso' : 'Nuevo paso'}</h4>
            <button onClick={() => setShowAddItem(false)}><X size={16} className="text-[#8b7aa0]" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="p-2.5 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="p-2.5 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20">
              {categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="¿Qué tenés que hacer?" className="w-full p-2.5 rounded-xl border border-[#ede4f8] bg-[#faf8ff] text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20" />
          <div>
            <p className="text-xs text-[#8b7aa0] mb-1">Icono</p>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {iconChoices.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))} className={`text-xl p-1.5 rounded-xl border ${form.icon === ic ? 'border-[#6b4c9a] bg-[#f5f0ff]' : 'border-[#ede4f8]'}`}>{ic}</button>
              ))}
            </div>
          </div>
          <button onClick={submitItem} className="w-full py-2.5 rounded-2xl bg-[#6b4c9a] text-white text-sm font-semibold shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95">
            {editingItem ? 'Guardar cambios' : 'Agregar paso'}
          </button>
        </motion.div>
      )}

      {!showAddItem && (
        <button onClick={openCreate} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#e0d8f0] text-[#8b7aa0] hover:border-[#6b4c9a] hover:text-[#6b4c9a] hover:bg-[#faf8ff] text-sm inline-flex items-center justify-center gap-2">
          <Plus size={16} /> Agregar paso
        </button>
      )}

      {/* Routine items by category */}
      {categories.map(cat => {
        const items = active.items.filter(r => r.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="font-semibold text-[#6b4c9a] mb-2">{categoryLabels[cat] || cat}</h3>
            <div className="space-y-2">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-[#f0e8f8] hover:border-[#d8c7ef] hover:shadow-md'}`}
                >
                  <button onClick={() => toggleItem(active.id, item.id)} className="shrink-0">
                    {item.completed ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} className="text-[#8b7aa0]" />}
                  </button>
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-medium truncate ${item.completed ? 'line-through text-[#8b7aa0]' : 'text-[#4a4a5a]'}`}>{item.title}</p>
                  </div>
                  <span className="text-xs text-[#8b7aa0] flex items-center gap-1">
                    <Clock size={12} /> {item.time}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[#f5f0ff] text-[#8b7aa0]"><Pencil size={12} /></button>
                    <button onClick={() => deleteItem(active.id, item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={12} /></button>
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
