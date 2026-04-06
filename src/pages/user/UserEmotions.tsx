import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getEmotionsForUser, EmotionalRecord } from '@/data/mockData';

const emotionOptions = [
  { emoji: '😊', label: 'Contento' },
  { emoji: '😄', label: 'Feliz' },
  { emoji: '😌', label: 'Tranquilo' },
  { emoji: '💪', label: 'Motivado' },
  { emoji: '🥹', label: 'Orgulloso' },
  { emoji: '😰', label: 'Ansioso' },
  { emoji: '😬', label: 'Nervioso' },
  { emoji: '😤', label: 'Frustrado' },
  { emoji: '😡', label: 'Enojado' },
  { emoji: '😢', label: 'Triste' },
  { emoji: '😴', label: 'Cansado' },
  { emoji: '😐', label: 'Aburrido' },
  { emoji: '😲', label: 'Sorprendido' },
  { emoji: '😟', label: 'Preocupado' },
];

export default function UserEmotions() {
  const { user } = useAuth();
  const [records, setRecords] = useState<EmotionalRecord[]>(user ? getEmotionsForUser(user.id) : []);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [context, setContext] = useState('');

  if (!user) return null;

  const addRecord = () => {
    if (!selectedEmotion) return;
    const opt = emotionOptions.find(e => e.label === selectedEmotion);
    const newRec: EmotionalRecord = {
      id: `em-${Date.now()}`,
      userId: user.id,
      emotion: selectedEmotion,
      emoji: opt?.emoji || '😊',
      intensity,
      context,
      whatHelped: '',
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
    };
    setRecords(prev => [newRec, ...prev]);
    setSelectedEmotion(null);
    setContext('');
    setIntensity(3);
  };

  // Group by date
  const grouped = records.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {} as Record<string, EmotionalRecord[]>);

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Emotion summary for chart
  const emotionCounts = records.reduce((acc, r) => {
    acc[r.emotion] = (acc[r.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Emociones</h2>
        <p className="text-muted-foreground text-sm">Registrá cómo te sentís</p>
      </div>

      {/* Emotion selector */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
        <h3 className="font-heading font-semibold text-foreground mb-3">¿Cómo te sentís ahora?</h3>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {emotionOptions.map(opt => (
            <button
              key={opt.label}
              onClick={() => setSelectedEmotion(opt.label)}
              className={`flex flex-col items-center p-2 rounded-xl text-center transition-all ${selectedEmotion === opt.label ? 'bg-primary/10 ring-2 ring-primary scale-110' : 'hover:bg-muted/50'}`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>

        {selectedEmotion && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Intensidad: {intensity}/5</label>
              <input type="range" min={1} max={5} value={intensity} onChange={e => setIntensity(+e.target.value)} className="w-full accent-primary mt-1" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Poco</span><span>Mucho</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">¿Qué pasó?</label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Contá brevemente qué pasó..."
                className="w-full mt-1 p-3 rounded-lg border border-border bg-background text-sm resize-none h-20"
              />
            </div>
            <button onClick={addRecord} className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm">
              Registrar emoción
            </button>
          </motion.div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
        <h3 className="font-heading font-semibold text-foreground mb-3">📊 Resumen emocional</h3>
        <div className="space-y-2">
          {topEmotions.map(([emotion, count]) => {
            const opt = emotionOptions.find(e => e.label === emotion);
            const maxCount = topEmotions[0][1];
            return (
              <div key={emotion} className="flex items-center gap-2">
                <span className="text-lg">{opt?.emoji}</span>
                <span className="text-xs text-foreground w-20">{emotion}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3">Historial</h3>
        {dates.map(date => (
          <div key={date} className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {date === new Date().toISOString().split('T')[0] ? 'Hoy' : new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            <div className="space-y-2">
              {grouped[date].map(rec => (
                <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                  <span className="text-2xl">{rec.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{rec.emotion}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`w-2 h-2 rounded-full ${i < rec.intensity ? 'bg-primary' : 'bg-muted'}`} />
                        ))}
                      </div>
                    </div>
                    {rec.context && <p className="text-xs text-muted-foreground mt-0.5">{rec.context}</p>}
                    {rec.whatHelped && <p className="text-xs text-success mt-0.5">✓ {rec.whatHelped}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{rec.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
