import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { users, getActivitiesForUser, getEmotionsForUser, getObjectivesForUser, getLocationsForUser, calendarEvents, getRecommendationsForUser } from '@/data/mockData';
import { LogOut, MapPin, CheckCircle2, Heart, Calendar, Target, BarChart3, Bell, Shield, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ActivityManager from '@/components/ActivityManager';

export default function TutorDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(0);
  if (!user || user.role !== 'tutor') return null;

  const linkedUsers = users.filter(u => (user as any).linkedUserIds?.includes(u.id));
  const mainUser = linkedUsers[selectedUser] || linkedUsers[0];
  const activities = mainUser ? getActivitiesForUser(mainUser.id) : [];
  const emotions = mainUser ? getEmotionsForUser(mainUser.id) : [];
  const objectives = mainUser ? getObjectivesForUser(mainUser.id) : [];
  const locations = mainUser ? getLocationsForUser(mainUser.id) : [];
  const events = calendarEvents.filter(e => e.userId === mainUser?.id);
  const recs = mainUser ? getRecommendationsForUser(mainUser.id) : [];
  const completedAct = activities.filter(a => a.status === 'completada');
  const adherence = activities.length > 0 ? Math.round((completedAct.length / activities.length) * 100) : 0;
  const todayEmotions = emotions.filter(e => e.date === new Date().toISOString().split('T')[0]);

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'activities', label: 'Actividades', icon: Sparkles },
    { id: 'location', label: 'Ubicación', icon: MapPin },
    { id: 'emotions', label: 'Emociones', icon: Heart },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'insights', label: 'Tranquilidad', icon: Shield },
  ];

  // Mock insights
  const insights = [
    { text: `${mainUser?.name.split(' ')[0]} completó ${adherence}% de sus actividades esta semana`, type: 'positive' as const },
    { text: adherence > 70 ? 'Alta adherencia a la rutina matutina' : 'Se detectó menor adherencia a la rutina matutina', type: adherence > 70 ? 'positive' as const : 'warning' as const },
    { text: `Racha de ${mainUser?.streak || 0} días: ${(mainUser?.streak || 0) > 7 ? 'excelente constancia' : 'puede mejorar'}`, type: (mainUser?.streak || 0) > 7 ? 'positive' as const : 'neutral' as const },
    { text: `${todayEmotions.length} registro(s) emocional(es) hoy`, type: todayEmotions.length > 0 ? 'positive' as const : 'warning' as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-gradient text-lg">TÁNDEM</h1>
          <p className="text-xs text-muted-foreground">Panel de tutor · {user.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}><LogOut size={16} /></Button>
      </header>

      {/* User selector */}
      {linkedUsers.length > 1 && (
        <div className="flex gap-2 p-4 border-b border-border overflow-x-auto">
          {linkedUsers.map((u, i) => (
            <button key={u.id} onClick={() => setSelectedUser(i)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${selectedUser === i ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
              <span>{u.avatar}</span>{u.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto p-4 border-b border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${tab === t.id ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {!mainUser ? <p className="text-muted-foreground">No hay usuarios vinculados.</p> : (
          <>
            <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
              <span className="text-4xl">{mainUser.avatar}</span>
              <div className="flex-1">
                <p className="font-heading font-bold text-foreground">{mainUser.name}</p>
                <p className="text-xs text-muted-foreground">Nivel {mainUser.level} · {mainUser.points} pts · Racha {mainUser.streak} días</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-success">{adherence}%</p>
                <p className="text-[10px] text-muted-foreground">adherencia</p>
              </div>
            </div>

            {tab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Completadas', value: `${completedAct.length}/${activities.length}`, icon: '✅' },
                    { label: 'Racha', value: `${mainUser.streak} días`, icon: '🔥' },
                    { label: 'Emociones hoy', value: todayEmotions.length.toString(), icon: '💭' },
                    { label: 'Objetivos activos', value: objectives.filter(o => o.status === 'activo').length.toString(), icon: '🎯' },
                  ].map(s => (
                    <div key={s.label} className="bg-card rounded-xl p-3 border border-border text-center">
                      <span className="text-xl">{s.icon}</span>
                      <p className="font-bold text-foreground mt-1">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Adherence chart mock */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Adherencia semanal</h3>
                  <div className="flex items-end gap-2 h-24">
                    {['L','M','X','J','V','S','D'].map((d, i) => {
                      const h = [75, 90, 60, 85, 95, 40, 70][i];
                      return (
                        <div key={d} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} className="w-full rounded-t-md gradient-primary" style={{ minHeight: 4 }} />
                          <span className="text-[10px] text-muted-foreground">{d}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Target size={16} className="text-primary" /> Objetivos activos</h3>
                  <div className="space-y-3">
                    {objectives.filter(o => o.status === 'activo').slice(0, 5).map(obj => (
                      <div key={obj.id}>
                        <div className="flex justify-between text-sm"><span className="text-foreground">{obj.title}</span><span className="text-muted-foreground">{Math.round((obj.progress / obj.target) * 100)}%</span></div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1"><div className="bg-primary h-2 rounded-full" style={{ width: `${(obj.progress / obj.target) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'insights' && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Shield size={16} className="text-primary" /> Insights automáticos</h3>
                  <div className="space-y-2">
                    {insights.map((ins, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${ins.type === 'positive' ? 'bg-green-50 border border-green-200' : ins.type === 'warning' ? 'bg-amber-50 border border-amber-200' : 'bg-muted/50 border border-border'}`}>
                        <span>{ins.type === 'positive' ? '✅' : ins.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                        <p className="text-sm text-foreground">{ins.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-3">💡 ¿Cómo te ayuda TÁNDEM?</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ Seguimiento del progreso de {mainUser.name.split(' ')[0]} en tiempo real</p>
                    <p>✓ Alertas cuando no se completa la rutina</p>
                    <p>✓ Visibilidad de su estado emocional</p>
                    <p>✓ Herramientas prácticas para acompañar su autonomía</p>
                    <p>✓ Comunicación directa con su profesional</p>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-3">🔔 Alertas activas</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span className="text-foreground">Rutina de tarde no completada ayer</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span className="text-foreground">Rutina matutina completada hoy ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'location' && (
              <div className="space-y-3">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-2">📍 Ubicación actual</h3>
                  <div className="bg-sky rounded-lg p-6 text-center">
                    <MapPin size={32} className="mx-auto text-primary mb-2" />
                    <p className="font-semibold text-foreground">{locations[0]?.name || 'Casa'}</p>
                    <p className="text-xs text-muted-foreground">{locations[0]?.address}</p>
                    <p className="text-xs text-success mt-1">Último reporte: hace 5 min</p>
                  </div>
                </div>
                <h3 className="font-heading font-semibold text-foreground">Lugares</h3>
                {locations.slice(0, 8).map(loc => (
                  <div key={loc.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${loc.type === 'seguro' ? 'bg-green-100' : 'bg-blue-100'}`}>{loc.type === 'seguro' ? '🏠' : '📍'}</span>
                    <div><p className="text-sm font-medium text-foreground">{loc.name}</p><p className="text-xs text-muted-foreground">{loc.address}</p></div>
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${loc.type === 'seguro' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{loc.type}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'emotions' && (
              <div className="space-y-3">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-3">📊 Resumen emocional semanal</h3>
                  <div className="flex gap-1">
                    {emotions.slice(0, 7).map(em => (
                      <div key={em.id} className="flex flex-col items-center flex-1">
                        <span className="text-2xl">{em.emoji}</span>
                        <span className="text-[8px] text-muted-foreground mt-1">{em.date.slice(5)}</span>
                        <div className="flex gap-0.5 mt-0.5">{Array.from({length:5}).map((_,i)=><span key={i} className={`w-1 h-1 rounded-full ${i<em.intensity?'bg-primary':'bg-muted'}`}/>)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {emotions.slice(0, 10).map(em => (
                  <div key={em.id} className="bg-card rounded-lg p-3 border border-border flex items-start gap-3">
                    <span className="text-2xl">{em.emoji}</span>
                    <div><p className="font-medium text-sm text-foreground">{em.emotion} ({em.intensity}/5)</p><p className="text-xs text-muted-foreground">{em.context}</p>{em.whatHelped && <p className="text-xs text-success mt-0.5">✓ {em.whatHelped}</p>}</div>
                    <span className="ml-auto text-[10px] text-muted-foreground">{em.date === new Date().toISOString().split('T')[0] ? 'Hoy' : em.date}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'calendar' && (
              <div className="space-y-3">
                {events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10).map(ev => (
                  <div key={ev.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3">
                    <Calendar size={16} className="text-primary shrink-0" />
                    <div><p className="text-sm font-medium text-foreground">{ev.title}</p><p className="text-xs text-muted-foreground">{ev.date} · {ev.time}</p></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
