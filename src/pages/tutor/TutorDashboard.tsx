import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { users, getActivitiesForUser, getEmotionsForUser, getObjectivesForUser, getLocationsForUser, calendarEvents, getTutorById, getProfessionalById } from '@/data/mockData';
import { LogOut, MapPin, CheckCircle2, Heart, Calendar, MessageCircle, TrendingUp, Bell, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TutorDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  if (!user || user.role !== 'tutor') return null;

  const linkedUsers = users.filter(u => (user as any).linkedUserIds?.includes(u.id));
  const mainUser = linkedUsers[0];
  const activities = mainUser ? getActivitiesForUser(mainUser.id) : [];
  const emotions = mainUser ? getEmotionsForUser(mainUser.id) : [];
  const objectives = mainUser ? getObjectivesForUser(mainUser.id) : [];
  const locations = mainUser ? getLocationsForUser(mainUser.id) : [];
  const events = calendarEvents.filter(e => e.userId === mainUser?.id);
  const completedAct = activities.filter(a => a.status === 'completada');

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'location', label: 'Ubicación', icon: MapPin },
    { id: 'emotions', label: 'Emociones', icon: Heart },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
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
            {/* User card */}
            <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
              <span className="text-4xl">{mainUser.avatar}</span>
              <div className="flex-1">
                <p className="font-heading font-bold text-foreground">{mainUser.name}</p>
                <p className="text-xs text-muted-foreground">Nivel {mainUser.level} · {mainUser.points} pts · Racha {mainUser.streak} días</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-success">{completedAct.length}/{activities.length}</p>
                <p className="text-[10px] text-muted-foreground">completadas</p>
              </div>
            </div>

            {tab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Actividades hoy', value: '3', icon: '✅' },
                    { label: 'Racha', value: `${mainUser.streak} días`, icon: '🔥' },
                    { label: 'Emociones hoy', value: emotions.filter(e => e.date === new Date().toISOString().split('T')[0]).length.toString(), icon: '💭' },
                    { label: 'Próximo evento', value: events[0]?.time || '-', icon: '📅' },
                  ].map(s => (
                    <div key={s.label} className="bg-card rounded-xl p-3 border border-border text-center">
                      <span className="text-xl">{s.icon}</span>
                      <p className="font-bold text-foreground mt-1">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Target size={16} className="text-primary" /> Objetivos activos</h3>
                  <div className="space-y-3">
                    {objectives.filter(o => o.status === 'activo').slice(0, 5).map(obj => (
                      <div key={obj.id}>
                        <div className="flex justify-between text-sm"><span className="text-foreground">{obj.title}</span><span className="text-muted-foreground">{obj.progress}/{obj.target}</span></div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1"><div className="bg-primary h-2 rounded-full" style={{ width: `${(obj.progress / obj.target) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-heading font-semibold text-foreground mb-3">Actividades recientes</h3>
                  {completedAct.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
                      <CheckCircle2 size={14} className="text-success" />
                      <span className="text-sm text-foreground">{a.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">+{a.points} pts</span>
                    </div>
                  ))}
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
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${loc.type === 'seguro' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {loc.type === 'seguro' ? '🏠' : '📍'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">{loc.address}</p>
                    </div>
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${loc.type === 'seguro' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{loc.type}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'emotions' && (
              <div className="space-y-3">
                {emotions.slice(0, 10).map(em => (
                  <div key={em.id} className="bg-card rounded-lg p-3 border border-border flex items-start gap-3">
                    <span className="text-2xl">{em.emoji}</span>
                    <div>
                      <p className="font-medium text-sm text-foreground">{em.emotion} <span className="text-muted-foreground">({em.intensity}/5)</span></p>
                      <p className="text-xs text-muted-foreground">{em.context}</p>
                      {em.whatHelped && <p className="text-xs text-success mt-0.5">✓ {em.whatHelped}</p>}
                    </div>
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
                    <div>
                      <p className="text-sm font-medium text-foreground">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{ev.date} · {ev.time}</p>
                    </div>
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
