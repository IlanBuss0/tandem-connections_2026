import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { users, getActivitiesForUser, getEmotionsForUser, getObjectivesForUser, calendarEvents, professionals as allProfessionals, getRecommendationsForUser } from '@/data/mockData';
import { LogOut, CheckCircle2, Heart, Calendar, Target, Users, FileText, BarChart3, TrendingUp, ClipboardPlus, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ActivityManager from '@/components/ActivityManager';

export default function ProfessionalDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  if (!user || user.role !== 'professional') return null;

  const linkedUsers = users.filter(u => (user as any).linkedUserIds?.includes(u.id));

  const tabs = [
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'create', label: 'Crear actividad', icon: Sparkles },
    { id: 'tools', label: 'Herramientas', icon: ClipboardPlus },
    { id: 'directory', label: 'Directorio', icon: FileText },
  ];

  const patientDetail = selectedPatient ? users.find(u => u.id === selectedPatient) : null;

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
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedPatient(null); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${tab === t.id ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {tab === 'patients' && !selectedPatient && (
          <>
            <h2 className="font-heading font-bold text-xl text-foreground">Mis pacientes ({linkedUsers.length})</h2>
            {linkedUsers.map(u => {
              const acts = getActivitiesForUser(u.id);
              const completed = acts.filter(a => a.status === 'completada').length;
              const adherence = acts.length > 0 ? Math.round((completed / acts.length) * 100) : 0;
              const emotions = getEmotionsForUser(u.id);
              const objs = getObjectivesForUser(u.id).filter(o => o.status === 'activo');
              const nextSession = calendarEvents.find(e => e.userId === u.id && e.type === 'terapia' && e.date >= new Date().toISOString().split('T')[0]);

              return (
                <motion.button key={u.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} onClick={() => setSelectedPatient(u.id)} className="w-full bg-card rounded-xl border border-border overflow-hidden text-left hover:border-primary/30 transition-all">
                  <div className="p-4 flex items-center gap-4">
                    <span className="text-4xl">{u.avatar}</span>
                    <div className="flex-1">
                      <p className="font-heading font-bold text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.age} años · Nivel {u.level} · Racha {u.streak} días</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${adherence >= 70 ? 'text-success' : adherence >= 40 ? 'text-amber-500' : 'text-destructive'}`}>{adherence}%</p>
                      <p className="text-[10px] text-muted-foreground">adherencia</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 px-4 pb-4">
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Actividades</p><p className="font-bold text-foreground">{completed}/{acts.length}</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Emociones</p><p className="font-bold text-foreground">{emotions.length}</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Objetivos</p><p className="font-bold text-foreground">{objs.length}</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-xs text-muted-foreground">Próx. sesión</p><p className="font-bold text-foreground text-xs">{nextSession ? nextSession.date.slice(5) : '-'}</p></div>
                  </div>
                  <div className="px-4 pb-3 flex gap-1">
                    {emotions.slice(0, 5).map(em => <span key={em.id} className="text-lg">{em.emoji}</span>)}
                  </div>
                </motion.button>
              );
            })}
          </>
        )}

        {tab === 'patients' && selectedPatient && patientDetail && (() => {
          const acts = getActivitiesForUser(patientDetail.id);
          const completed = acts.filter(a => a.status === 'completada').length;
          const adherence = acts.length > 0 ? Math.round((completed / acts.length) * 100) : 0;
          const emotions = getEmotionsForUser(patientDetail.id);
          const objs = getObjectivesForUser(patientDetail.id).filter(o => o.status === 'activo');
          const recs = getRecommendationsForUser(patientDetail.id);
          return (
            <div className="space-y-4">
              <button onClick={() => setSelectedPatient(null)} className="text-sm text-primary font-medium">← Volver a pacientes</button>
              <div className="bg-card rounded-xl p-5 border border-border">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{patientDetail.avatar}</span>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-foreground">{patientDetail.name}</h3>
                    <p className="text-sm text-muted-foreground">{patientDetail.age} años · {patientDetail.bio}</p>
                    <p className="text-xs text-muted-foreground mt-1">Nivel {patientDetail.level} · {patientDetail.points} pts · Racha {patientDetail.streak} días</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-foreground">{adherence}%</p><p className="text-xs text-muted-foreground">Adherencia</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-foreground">{completed}</p><p className="text-xs text-muted-foreground">Completadas</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-foreground">{emotions.length}</p><p className="text-xs text-muted-foreground">Registros emoc.</p></div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Evolución emocional</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {emotions.slice(0, 10).map(em => (
                    <div key={em.id} className="flex flex-col items-center min-w-[48px]">
                      <span className="text-2xl">{em.emoji}</span>
                      <span className="text-[8px] text-muted-foreground">{em.date.slice(5)}</span>
                      <div className="flex gap-0.5 mt-0.5">{Array.from({length:5}).map((_,i)=><span key={i} className={`w-1 h-1 rounded-full ${i<em.intensity?'bg-primary':'bg-muted'}`}/>)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Target size={16} className="text-primary" /> Objetivos terapéuticos</h4>
                {objs.map(obj => (
                  <div key={obj.id} className="mb-3">
                    <div className="flex justify-between text-sm"><span className="text-foreground">{obj.title}</span><span className="text-muted-foreground">{Math.round((obj.progress/obj.target)*100)}%</span></div>
                    <div className="w-full bg-muted rounded-full h-2 mt-1"><div className="bg-primary h-2 rounded-full" style={{width:`${(obj.progress/obj.target)*100}%`}}/></div>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-heading font-semibold text-foreground mb-3">📝 Observaciones y recomendaciones</h4>
                {recs.filter(r=>r.source==='profesional').slice(0,5).map(r => (
                  <div key={r.id} className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.priority==='alta'?'bg-red-100 text-red-700':r.priority==='media'?'bg-amber-100 text-amber-700':'bg-green-100 text-green-700'}`}>{r.priority}</span>
                    <div><p className="text-sm text-foreground">{r.title}</p><p className="text-xs text-muted-foreground">{r.description}</p></div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 gradient-primary text-primary-foreground"><MessageSquare size={14} className="mr-1" /> Enviar mensaje</Button>
                <Button variant="outline" className="flex-1"><Calendar size={14} className="mr-1" /> Proponer sesión</Button>
              </div>
            </div>
          );
        })()}

        {tab === 'tools' && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-xl text-foreground">Herramientas profesionales</h2>
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">📊 Métricas globales</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xl font-bold text-foreground">{linkedUsers.length}</p><p className="text-xs text-muted-foreground">Pacientes activos</p></div>
                <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xl font-bold text-foreground">{Math.round(linkedUsers.reduce((sum,u) => { const a=getActivitiesForUser(u.id); return sum + (a.length>0?a.filter(x=>x.status==='completada').length/a.length:0); },0)/linkedUsers.length*100)}%</p><p className="text-xs text-muted-foreground">Adherencia promedio</p></div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-heading font-semibold text-foreground mb-3">🛠️ Acciones rápidas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start"><ClipboardPlus size={14} className="mr-2" /> Crear actividad personalizada</Button>
                <Button variant="outline" className="justify-start"><Calendar size={14} className="mr-2" /> Planificación semanal</Button>
                <Button variant="outline" className="justify-start"><FileText size={14} className="mr-2" /> Notas internas</Button>
                <Button variant="outline" className="justify-start"><BarChart3 size={14} className="mr-2" /> Registro de intervenciones</Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'directory' && (
          <>
            <h2 className="font-heading font-bold text-xl text-foreground">Directorio de profesionales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allProfessionals.map(p => (
                <div key={p.id} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{p.avatar}</span>
                    <div><p className="font-semibold text-sm text-foreground">{p.name}</p><p className="text-xs text-primary">{p.specialty}</p></div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3"><span>📍 {p.modality}</span><span>🕐 {p.availability}</span></div>
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
