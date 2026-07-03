import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BarChart3, CalendarDays, Loader2, Save, Sparkles, Trash2 } from 'lucide-react';
import { useEmotions, emotionOptions } from '@/contexts/EmotionsContext';

import PermissionBlocked from '@/components/PermissionBlocked';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';

const intensityLabels: Record<number, string> = {
  1: 'Muy leve',
  2: 'Leve',
  3: 'Media',
  4: 'Fuerte',
  5: 'Muy fuerte',
};

const todayIso = () => new Date().toISOString().split('T')[0];

function formatDate(date: string) {
  if (date === todayIso()) return 'Hoy';
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export default function UserEmotions() {
  const { context: permissionContext } = usePermissionContext();
  const { records, loading, error, add, remove, reload } = useEmotions();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [context, setContext] = useState('');
  const [whatHelped, setWhatHelped] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedOption = emotionOptions.find((emotion) => emotion.label === selectedEmotion);

  const stats = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const since = sevenDaysAgo.toISOString().split('T')[0];
    const weekRecords = records.filter((record) => record.date >= since);
    const averageIntensity = weekRecords.length
      ? weekRecords.reduce((sum, record) => sum + record.intensity, 0) / weekRecords.length
      : 0;
    const emotionCounts = records.reduce((acc, record) => {
      acc[record.emotion] = (acc[record.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const todayRecords = records.filter((record) => record.date === todayIso());

    return {
      weekCount: weekRecords.length,
      averageIntensity,
      topEmotions,
      todayCount: todayRecords.length,
      lastRecord: records[0],
    };
  }, [records]);

  const grouped = useMemo(() => {
    return records.reduce((acc, record) => {
      if (!acc[record.date]) acc[record.date] = [];
      acc[record.date].push(record);
      return acc;
    }, {} as Record<string, typeof records>);
  }, [records]);

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const canRegisterEmotions = isPermissionEnabled(
    permissionContext?.perteneciente?.permisos_efectivos?.permisos,
    PERTENECIENTE_PERMISSIONS.REGISTRAR_EMOCIONES,
    true,
  );

  if (!canRegisterEmotions) {
    return (
      <PermissionBlocked
        title="Emociones deshabilitadas"
        description="Tu tutor deshabilito temporalmente el registro emocional. Cuando lo habilite, vas a poder registrar y revisar tus emociones."
      />
    );
  }

  const submit = async () => {
    if (!selectedEmotion || saving) return;
    setSaving(true);

    try {
      await add({
        emotion: selectedEmotion,
        emoji: selectedOption?.emoji || '😊',
        intensity,
        context: context.trim(),
        whatHelped: whatHelped.trim(),
      });
      setSelectedEmotion(null);
      setContext('');
      setWhatHelped('');
      setIntensity(3);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setDeletingId(id);
    try {
      await remove(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pb-24 lg:pb-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">Emociones</h2>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">Seguimiento emocional personal.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl sm:rounded-3xl border border-[#f0e8f8] bg-white p-4 shadow-lg">
          <div className="flex items-center gap-2 text-[#8b7aa0] text-xs">
            <CalendarDays size={15} />
            Hoy
          </div>
          <p className="mt-2 text-2xl font-bold text-[#6b4c9a]">{stats.todayCount}</p>
          <p className="text-xs text-[#8b7aa0]">registro(s)</p>
        </div>
        <div className="rounded-2xl sm:rounded-3xl border border-[#f0e8f8] bg-white p-4 shadow-lg">
          <div className="flex items-center gap-2 text-[#8b7aa0] text-xs">
            <BarChart3 size={15} />
            Ultimos 7 dias
          </div>
          <p className="mt-2 text-2xl font-bold text-[#6b4c9a]">{stats.weekCount}</p>
          <p className="text-xs text-[#8b7aa0]">seguimientos</p>
        </div>
        <div className="rounded-2xl sm:rounded-3xl border border-[#f0e8f8] bg-white p-4 shadow-lg">
          <div className="flex items-center gap-2 text-[#8b7aa0] text-xs">
            <Sparkles size={15} />
            Intensidad media
          </div>
          <p className="mt-2 text-2xl font-bold text-[#6b4c9a]">
            {stats.averageIntensity ? stats.averageIntensity.toFixed(1) : '-'}
          </p>
          <p className="text-xs text-[#8b7aa0]">sobre 5</p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 sm:p-5 shadow-lg">
        <div className="mb-4">
          <h3 className="font-semibold text-[#6b4c9a]">Como te sentis ahora</h3>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {emotionOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setSelectedEmotion(option.label)}
              className={`min-h-[76px] rounded-xl border p-2 text-center transition-all ${
                selectedEmotion === option.label
                  ? 'border-[#6b4c9a] bg-[#f5f0ff] text-[#6b4c9a] shadow-sm'
                  : 'border-[#ede4f8] bg-[#faf8ff] hover:border-[#d8c7ef] hover:bg-[#f5f0ff]'
              }`}
            >
              <span className="block text-2xl leading-none">{option.emoji}</span>
              <span className="mt-2 block text-[11px] font-medium leading-tight">{option.label}</span>
            </button>
          ))}
        </div>

        {selectedEmotion && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-[#4a4a5a]">Intensidad</label>
                <span className="rounded-full bg-[#f5f0ff] px-2 py-1 text-xs font-semibold text-[#6b4c9a]">
                  {intensity}/5 · {intensityLabels[intensity]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={intensity}
                onChange={(event) => setIntensity(Number(event.target.value))}
                className="w-full accent-[#6b4c9a]"
              />
              <div className="mt-1 flex justify-between text-[11px] text-[#8b7aa0]">
                <span>Poco</span>
                <span>Mucho</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#4a4a5a]">Que paso</span>
                <textarea
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="Ej: hubo un cambio de plan, complete una actividad, tuve una conversacion..."
                  className="mt-1 h-24 w-full resize-none rounded-xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#4a4a5a]">Que ayudo</span>
                <textarea
                  value={whatHelped}
                  onChange={(event) => setWhatHelped(event.target.value)}
                  placeholder="Ej: respirar, pedir ayuda, descansar, usar pictogramas..."
                  className="mt-1 h-24 w-full resize-none rounded-xl border border-[#ede4f8] bg-[#faf8ff] p-3 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]"
                />
              </label>
            </div>

            <button onClick={submit} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Registrar emocion
            </button>
          </motion.div>
        )}
      </section>

      <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 sm:p-5 shadow-lg">
        <h3 className="font-semibold text-[#6b4c9a] mb-3">Resumen emocional</h3>
        <div className="space-y-2">
          {stats.topEmotions.map(([emotion, count]) => {
            const option = emotionOptions.find((item) => item.label === emotion);
            const maxCount = stats.topEmotions[0]?.[1] || 1;
            return (
              <div key={emotion} className="grid grid-cols-[auto_88px_1fr_auto] items-center gap-2">
                <span className="text-lg">{option?.emoji || '🙂'}</span>
                <span className="text-xs font-medium text-[#4a4a5a]">{emotion}</span>
                <div className="h-2 rounded-full bg-[#f0e8f8]">
                  <div className="h-2 rounded-full bg-[#6b4c9a]" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-xs text-[#8b7aa0]">{count}</span>
              </div>
            );
          })}
          {!stats.topEmotions.length && (
            <p className="text-sm text-[#8b7aa0]">Todavía no hay registros emocionales.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-[#6b4c9a] mb-3">Historial</h3>
        {loading && !records.length && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#f0e8f8] bg-white p-4 text-sm text-[#8b7aa0] shadow-lg">
            <Loader2 size={16} className="animate-spin" />
            Cargando registros...
          </div>
        )}

        {!loading && dates.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-6 py-14 text-center text-sm text-[#8b7aa0] shadow-sm">
            No hay emociones registradas todavía.
          </div>
        )}

        {dates.map((date) => (
          <div key={date} className="mb-4">
            <p className="mb-2 text-xs font-medium capitalize text-[#8b7aa0]">{formatDate(date)}</p>
            <div className="space-y-2">
              {grouped[date].map((record) => (
                <div key={record.id} className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-2xl border border-[#f0e8f8] bg-white p-3 shadow-md">
                  <span className="text-2xl">{record.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-sm text-[#4a4a5a]">{record.emotion}</p>
                      <div className="flex gap-0.5" aria-label={`Intensidad ${record.intensity} de 5`}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span key={index} className={`h-2 w-2 rounded-full ${index < record.intensity ? 'bg-[#6b4c9a]' : 'bg-[#f0e8f8]'}`} />
                        ))}
                      </div>
                      <span className="text-[11px] text-[#8b7aa0]">{record.timestamp}</span>
                    </div>
                    {record.context && <p className="mt-1 text-xs text-[#8b7aa0]">{record.context}</p>}
                    {record.whatHelped && (
                      <p className="mt-1 text-xs text-[#4a4a5a]">
                        <span className="font-medium">Ayudo:</span> {record.whatHelped}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(record.id)}
                    disabled={deletingId === record.id}
                    className="h-8 w-8 rounded-xl text-[#8b7aa0] hover:bg-[#f5f0ff] hover:text-[#6b4c9a] disabled:opacity-60"
                    title="Eliminar"
                  >
                    {deletingId === record.id ? <Loader2 size={15} className="mx-auto animate-spin" /> : <Trash2 size={15} className="mx-auto" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
