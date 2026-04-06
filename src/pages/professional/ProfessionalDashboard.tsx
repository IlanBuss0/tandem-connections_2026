import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { users, getActivitiesForUser, getEmotionsForUser, getObjectivesForUser, calendarEvents, professionals as allProfessionals } from '@/data/mockData';
import { LogOut, CheckCircle2, Heart, Calendar, Target, Users, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfessionalDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('patients');
  if (!user || user.role !== 'professional') return null;

  const linkedUsers = users.filter(u => (user as any).linkedUserIds?.includes(u.id));

  const tabs = [
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'directory', label: 'Directorio', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-gradient text-lg">TÁNDEM</h1>
          <p className="text-xs text-muted-foreground">Panel profesional · {user.name}</p>
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
        {tab === 'patients' && (
          <>
            <h2 className="font-heading font-bold text-xl text-foreground">Mis pacientes ({linkedUsers.length})</h2>
            {linkedUsers.map(u => {
              const acts = getActivitiesForUser(u.id);
              const completed = acts.filter(a => a.status === 'completada').length;
              const emotions = getEmotionsForUser(u.id);
              const objs = getObjectivesForUser(u.id).filter(o => o.status === 'activo');
              const nextSession = calendarEvents.find(e => e.userId === u.id && e.type === 'terapia' && e.date >= new Date().toISOString().split('T')[0]);

              return (
                <div key={u.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-4 flex items-center gap-4">
                    <span className="text-4xl">{u.avatar}</span>
                    <div className="flex-1">
                      <p className="font-heading font-bold text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.age} años · Nivel {u.level} · Racha {u.streak} días</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">{completed}/{acts.length}</p>
                      <p className="text-[10px] text-muted-foreground">actividades</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 px-4 pb-4">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Adherencia</p>
                      <p className="font-bold text-foreground">{acts.length > 0 ? Math.round((completed / acts.length) * 100) : 0}%</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Emociones hoy</p>
                      <p className="font-bold text-foreground">{emotions.filter(e => e.date === new Date().toISOString().split('T')[0]).length}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Objetivos</p>
                      <p className="font-bold text-foreground">{objs.length}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Próx. sesión</p>
                      <p className="font-bold text-foreground text-xs">{nextSession ? `${nextSession.date.slice(5)} ${nextSession.time}` : '-'}</p>
                    </div>
                  </div>

                  {/* Recent emotions */}
                  <div className="px-4 pb-4">
                    <p className="text-xs font-semibold text-foreground mb-2">Evolución emocional reciente</p>
                    <div className="flex gap-1">
                      {emotions.slice(0, 7).map(em => (
                        <div key={em.id} className="flex flex-col items-center">
                          <span className="text-lg">{em.emoji}</span>
                          <span className="text-[8px] text-muted-foreground">{em.date.slice(5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Objectives */}
                  <div className="px-4 pb-4">
                    <p className="text-xs font-semibold text-foreground mb-2">Objetivos en curso</p>
                    {objs.slice(0, 3).map(obj => (
                      <div key={obj.id} className="mb-2">
                        <div className="flex justify-between text-xs"><span className="text-foreground">{obj.title}</span><span className="text-muted-foreground">{Math.round((obj.progress / obj.target) * 100)}%</span></div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-0.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${(obj.progress / obj.target) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === 'directory' && (
          <>
            <h2 className="font-heading font-bold text-xl text-foreground">Directorio de profesionales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allProfessionals.map(p => (
                <div key={p.id} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{p.avatar}</span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{p.name}</p>
                      <p className="text-xs text-primary">{p.specialty}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                    <span>📍 {p.modality}</span>
                    <span>🕐 {p.availability}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">Contactar</Button>
                    <Button size="sm" className="flex-1 text-xs gradient-primary text-primary-foreground">Sesión de prueba</Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
